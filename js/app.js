import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, currentUser, userData, saveProgress, loadProgress } from './firebase-config.js';
import { categories } from './exercises.js';

// --- Elementos del DOM ---
const loader = document.getElementById('loader');
const appContainer = document.getElementById('app-container');
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const gamesScreen = document.getElementById('games-screen');
const gameScreen = document.getElementById('game-screen');

const authBtn = document.getElementById('auth-btn');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userDisplay = document.getElementById('user-display');
const playGuestBtn = document.getElementById('play-guest');

const categoriesGrid = document.getElementById('categories-grid');
const gamesGrid = document.getElementById('games-grid');
const totalScoreEl = document.getElementById('total-score');
const exercisesCompletedEl = document.getElementById('exercises-completed');

const btnBackDash = document.getElementById('btn-back-dash');
const btnBack = document.getElementById('btn-back');
const gameTitle = document.getElementById('game-title');
const currentScoreEl = document.getElementById('current-score');
const gameArea = document.getElementById('game-area');
const gameInstructions = document.getElementById('game-instructions');
const gameContent = document.getElementById('game-content');
const gameFeedback = document.getElementById('game-feedback');
const btnStartLevel = document.getElementById('btn-start-level');
const btnNextLevel = document.getElementById('btn-next-level');

// Variables Globales de Juego
let currentGameConfig = null;
let currentCategoryIndex = null;
let currentGameIndex = null;
let currentLevelNum = 1;
let sessionScore = 0;
let gameTimer = null;

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loader.classList.add('hidden');
        appContainer.classList.remove('hidden');
        showScreen('auth');
    }, 1200);
});

function showScreen(screenId) {
    authScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    gamesScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');

    if (screenId === 'auth') authScreen.classList.remove('hidden');
    if (screenId === 'dashboard') {
        dashboardScreen.classList.remove('hidden');
        renderDashboard();
    }
    if (screenId === 'games') {
        gamesScreen.classList.remove('hidden');
    }
    if (screenId === 'game') gameScreen.classList.remove('hidden');
}

// --- Autenticación Ficticia/Real ---
playGuestBtn.addEventListener('click', (e) => {
    e.preventDefault();
    userDisplay.textContent = "Invitado";
    userDisplay.classList.remove('hidden');
    authBtn.textContent = "Salir";
    showScreen('dashboard');
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userDisplay.textContent = emailInput.value.split('@')[0];
    userDisplay.classList.remove('hidden');
    authBtn.textContent = "Salir";
    showScreen('dashboard');
});

authBtn.addEventListener('click', () => {
    if (authBtn.textContent === "Salir") {
        userDisplay.classList.add('hidden');
        authBtn.textContent = "Iniciar Sesión";
        showScreen('auth');
    }
});

// --- Dashboard (Categorías Maestras) ---
function renderDashboard() {
    totalScoreEl.textContent = userData.totalScore || 0;
    exercisesCompletedEl.textContent = userData.exercisesCompleted || 0;

    categoriesGrid.innerHTML = '';
    categories.forEach((cat, index) => {
        const card = document.createElement('div');
        card.className = 'category-card glass-panel';
        card.innerHTML = `
            <h3>${cat.icon} ${cat.name}</h3>
            <p>${cat.desc}</p>
            <div style="color: var(--accent); font-size: 0.875rem;">${cat.games.length} Tipos de Juegos</div>
        `;
        card.addEventListener('click', () => openCategory(index));
        categoriesGrid.appendChild(card);
    });
}

// --- Listado de Juegos dentro de una Categoría ---
function openCategory(catIndex) {
    currentCategoryIndex = catIndex;
    const cat = categories[catIndex];

    document.getElementById('category-title').innerHTML = `${cat.icon} ${cat.name}`;
    document.getElementById('category-desc').textContent = cat.desc;

    gamesGrid.innerHTML = '';

    cat.games.forEach((game, gIndex) => {
        const globalGameId = `${cat.id}_${game.id}`;
        const level = (userData.categoriesProgress && userData.categoriesProgress[globalGameId]) ? userData.categoriesProgress[globalGameId] : 1;
        const fillPercent = ((level) / game.totalLevels) * 100;

        const card = document.createElement('div');
        card.className = 'category-card glass-panel';
        card.innerHTML = `
            <h3>${game.name}</h3>
            <p>${game.desc}</p>
            <div class="level-progress">
                <span>Nivel ${level}/${game.totalLevels}</span>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${fillPercent}%"></div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => loadGame(catIndex, gIndex, level));
        gamesGrid.appendChild(card);
    });

    showScreen('games');
}

btnBackDash.addEventListener('click', () => {
    showScreen('dashboard');
});

// --- Flujo de un Juego Específico ---
function loadGame(catIndex, gameIndex, level) {
    currentCategoryIndex = catIndex;
    currentGameIndex = gameIndex;
    currentLevelNum = level;
    sessionScore = 0;
    currentScoreEl.textContent = "0";
    showScreen('game');
    prepareLevel();
}

btnBack.addEventListener('click', () => {
    clearInterval(gameTimer);
    clearTimeout(gameTimer);
    showScreen('games');
});

function prepareLevel() {
    const gameInfo = categories[currentCategoryIndex].games[currentGameIndex];

    if (currentLevelNum > gameInfo.totalLevels) {
        gameTitle.textContent = "¡Batería Completada!";
        gameInstructions.innerHTML = `<h3>¡Has completado todos los niveles de ${gameInfo.name}!</h3><button id="btn-back-g" class="btn btn-primary">Volver</button>`;
        document.getElementById('btn-back-g').addEventListener('click', () => showScreen('games'));
        gameContent.classList.add('hidden');
        gameFeedback.classList.add('hidden');
        gameInstructions.classList.remove('hidden');
        return;
    }

    try {
        currentGameConfig = gameInfo.generateLevel(currentLevelNum);
    } catch (e) {
        console.error("Error generating config:", e);
    }

    gameTitle.textContent = `${gameInfo.name} - Nivel ${currentLevelNum}`;
    document.getElementById('instruction-title').textContent = gameInfo.name;
    document.getElementById('instruction-text').textContent = currentGameConfig.instruction;

    gameContent.classList.add('hidden');
    gameFeedback.classList.add('hidden');
    gameInstructions.classList.remove('hidden');
}

btnStartLevel.addEventListener('click', () => {
    gameInstructions.classList.add('hidden');
    gameContent.classList.remove('hidden');
    gameContent.innerHTML = '';
    startGamePlay();
});

btnNextLevel.addEventListener('click', () => {
    currentLevelNum++;
    const cat = categories[currentCategoryIndex];
    const gameInfo = cat.games[currentGameIndex];
    const globalGameId = `${cat.id}_${gameInfo.id}`;

    if (!userData.categoriesProgress) userData.categoriesProgress = {};
    if (!userData.totalScore) userData.totalScore = 0;
    if (!userData.exercisesCompleted) userData.exercisesCompleted = 0;

    userData.categoriesProgress[globalGameId] = currentLevelNum;
    userData.totalScore += 15;
    userData.exercisesCompleted++;
    saveProgress();

    prepareLevel();
});

function endLevelSuccess() {
    clearInterval(gameTimer);
    clearTimeout(gameTimer);
    sessionScore += 15;
    currentScoreEl.textContent = sessionScore;
    gameContent.classList.add('hidden');
    gameFeedback.classList.remove('hidden');
    document.getElementById('feedback-title').textContent = "¡Respuesta Exitosa!";
    document.getElementById('feedback-title').style.color = "var(--accent)";
    document.getElementById('feedback-text').textContent = "+15 Puntos sinápticos.";
}

function endLevelFailure() {
    clearInterval(gameTimer);
    clearTimeout(gameTimer);
    gameContent.classList.add('hidden');
    gameFeedback.classList.remove('hidden');
    document.getElementById('feedback-title').textContent = "Casi lo logras";
    document.getElementById('feedback-title').style.color = "#ef4444";
    document.getElementById('feedback-text').textContent = "La neuroplasticidad requiere repetición. ¡Inténtalo de nuevo!";
    btnNextLevel.textContent = "Reintentar Nivel";
    const oldFn = btnNextLevel.onclick;
    btnNextLevel.onclick = () => {
        btnNextLevel.textContent = "Siguiente Nivel";
        btnNextLevel.onclick = oldFn;
        prepareLevel();
    };
}

// --- MOTORES UNIVERSALES DE JUEGOS ---

function startGamePlay() {
    const type = currentGameConfig.type;

    if (type === 'find-odd-one') playFindOddOne();
    else if (type === 'stroop') playStroop();
    else if (type === 'flanker') playGeneric("Atención Selectiva generará flechas indicadoras.");
    else if (type === 'simon-sequence') playSimon();
    else if (type === 'pattern-recall') playGeneric("Lógica de Recall Visual ocultando patrones.");
    else if (type === 'n-back') playGeneric("Algoritmo N-back evaluando la imagen hace N pasos.");
    else if (type === 'sequence-tap') playSequenceTap();
    else if (type === 'fast-compare') playGeneric("Lógica de comparación de formas asíncronas.");
    else if (type === 'visual-sweep') playGeneric("Animación en canvas de barridos divergentes.");
    else if (type === 'math-speed') playMathSpeed();
    else if (type === 'angle-match') playGeneric("Motor de rotación angular fina.");
    else if (type === 'rule-switch') playRuleSwitch();
    else playGeneric("Juego en desarrollo...");
}

function playGeneric(msg) {
    gameContent.innerHTML = `<p style="margin-top:40px; font-size: 1.2rem; text-align:center; color: var(--accent)">Simulación Completada Automáticamente.<br><em>[${msg}]</em></p>`;
    setTimeout(endLevelSuccess, 2000);
}

// 1. ODD ONE
function playFindOddOne() {
    const gridSize = currentGameConfig.grid;
    const targetIdx = currentGameConfig.targetIndex;
    gameContent.innerHTML = `<div class="grid-game" style="grid-template-columns: repeat(${gridSize}, 1fr)"></div>`;
    const grid = gameContent.querySelector('.grid-game');
    for (let i = 0; i < (gridSize * gridSize); i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = (i === targetIdx) ? currentGameConfig.targetChar : currentGameConfig.baseChar;
        cell.onclick = () => {
            if (i === targetIdx) { cell.classList.add('active'); setTimeout(endLevelSuccess, 300); }
            else { cell.style.background = "#ef4444"; setTimeout(endLevelFailure, 300); }
        };
        grid.appendChild(cell);
    }
    startTimer(currentGameConfig.timeLimit);
}

// 2. STROOP
let stroopRounds = 0;
function playStroop() {
    gameContent.innerHTML = `<div id="stroop-text" class="stroop-word">PALABRA</div><div class="button-row" id="stroop-buttons"></div>`;
    stroopRounds = currentGameConfig.rounds;
    nextStroopRound();
}

function nextStroopRound() {
    if (stroopRounds <= 0) return endLevelSuccess();
    const colors = currentGameConfig.colors;
    const match = Math.random() < currentGameConfig.matchProb;
    const trueColorObj = colors[Math.floor(Math.random() * colors.length)];
    let textWordObj = trueColorObj;

    if (!match && colors.length > 1) {
        textWordObj = colors[Math.floor(Math.random() * colors.length)];
        while (textWordObj.hex === trueColorObj.hex) textWordObj = colors[Math.floor(Math.random() * colors.length)];
    }

    document.getElementById('stroop-text').textContent = textWordObj.name;
    document.getElementById('stroop-text').style.color = trueColorObj.hex;
    const btnRow = document.getElementById('stroop-buttons');
    btnRow.innerHTML = '';

    let btnColors = [...colors].sort(() => Math.random() - 0.5);
    btnColors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline color-btn';
        btn.textContent = c.name;
        btn.onclick = () => {
            if (c.hex === trueColorObj.hex) { stroopRounds--; nextStroopRound(); }
            else endLevelFailure();
        };
        btnRow.appendChild(btn);
    });
}

// 3. SEQUENCE TAP
let tapCurrentNum = 1;
function playSequenceTap() {
    const count = currentGameConfig.count;
    tapCurrentNum = 1;
    gameContent.innerHTML = `<div class="grid-game" style="grid-template-columns: repeat(${currentGameConfig.grid}, 1fr)"></div>`;
    const grid = gameContent.querySelector('.grid-game');
    let nums = [];
    for (let i = 1; i <= count; i++) nums.push(i);
    nums.sort(() => Math.random() - 0.5);

    nums.forEach(n => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = n;
        cell.onclick = () => {
            if (n === tapCurrentNum) {
                cell.style.background = "var(--accent)"; cell.style.color = "#000";
                tapCurrentNum++;
                if (tapCurrentNum > count) endLevelSuccess();
            } else {
                cell.style.background = "#ef4444";
                setTimeout(() => cell.style.background = "rgba(255,255,255,0.05)", 200);
            }
        };
        grid.appendChild(cell);
    });
}

// 4. MATH SPEED
let mathRounds = 0;
function playMathSpeed() {
    mathRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `<div class="stroop-word" id="math-eq"></div><div class="button-row" id="math-options"></div>`;
    nextMathRound();
}

function nextMathRound() {
    if (mathRounds <= 0) return endLevelSuccess();
    const op = currentGameConfig.ops[Math.floor(Math.random() * currentGameConfig.ops.length)];
    const num1 = Math.floor(Math.random() * currentGameConfig.maxNum) + 1;
    const num2 = Math.floor(Math.random() * currentGameConfig.maxNum) + 1;
    let answer = op === '+' ? num1 + num2 : op === '-' ? num1 - num2 : num1 * num2;

    document.getElementById('math-eq').textContent = `${num1} ${op} ${num2} = ?`;
    let options = [answer, answer + Math.floor(Math.random() * 5) + 1, answer - Math.floor(Math.random() * 5) - 1].sort(() => Math.random() - 0.5);

    const btnRow = document.getElementById('math-options');
    btnRow.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline color-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            if (opt === answer) { mathRounds--; nextMathRound(); }
            else endLevelFailure();
        };
        btnRow.appendChild(btn);
    });
}

// 5. RULE SWITCH
let ruleRounds = 0;
function playRuleSwitch() {
    ruleRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `<h2 id="rule-prompt" style="color:var(--accent); margin-bottom: 24px; font-size:2rem;"></h2>
        <div id="rule-card" class="stroop-word" style="background:var(--panel-bg); padding:40px; border-radius:12px;"></div>
        <div class="button-row" id="rule-options"></div>`;
    nextRuleRound();
}

function nextRuleRound() {
    if (ruleRounds <= 0) return endLevelSuccess();
    let rules = ['Color', 'Forma'];
    let currentRule = rules[Math.floor(Math.random() * 2)];

    let colors = [{ n: 'Rojo', h: '#ef4444' }, { n: 'Azul', h: '#3b82f6' }, { n: 'Verde', h: '#10b981' }];
    let shapes = ['Círculo', 'Cuadrado', 'Triángulo'];

    let trueColor = colors[Math.floor(Math.random() * colors.length)];
    let trueShape = shapes[Math.floor(Math.random() * shapes.length)];

    document.getElementById('rule-prompt').textContent = `Regla Actual: Coincidir por ${currentRule.toUpperCase()}`;
    const card = document.getElementById('rule-card');
    card.textContent = trueShape;
    card.style.color = trueColor.h;

    const btnRow = document.getElementById('rule-options');
    btnRow.innerHTML = '';

    let options = [];
    if (currentRule === 'Color') {
        colors.forEach(c => options.push({ text: c.n, isCorrect: c.h === trueColor.h }));
    } else {
        shapes.forEach(s => options.push({ text: s, isCorrect: s === trueShape }));
    }

    options.sort(() => Math.random() - 0.5);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline color-btn';
        btn.textContent = opt.text;
        btn.onclick = () => {
            if (opt.isCorrect) { ruleRounds--; nextRuleRound(); }
            else endLevelFailure();
        }
        btnRow.appendChild(btn);
    });
}

// 6. SIMON
let simonRounds = 0;
function playSimon() {
    gameContent.innerHTML = `<div class="grid-game" id="simon-grid" style="grid-template-columns: repeat(${currentGameConfig.grid}, 1fr)"></div>`;
    const grid = document.getElementById('simon-grid');
    let cells = [];
    for (let i = 0; i < (currentGameConfig.grid * currentGameConfig.grid); i++) {
        const c = document.createElement('div');
        c.className = 'grid-cell';
        grid.appendChild(c);
        cells.push(c);
    }

    let sequence = [];
    for (let i = 0; i < currentGameConfig.sequenceLength; i++) {
        sequence.push(Math.floor(Math.random() * cells.length));
    }

    let step = 0;
    // Mostrar secuencia
    let showInterval = setInterval(() => {
        cells.forEach(c => c.style.background = 'rgba(255,255,255,0.05)');
        if (step >= sequence.length) {
            clearInterval(showInterval);
            enableSimonInput(cells, sequence);
            return;
        }
        setTimeout(() => {
            cells[sequence[step]].style.background = 'var(--primary)';
            step++;
        }, 200);
    }, currentGameConfig.displayTime);
}

function enableSimonInput(cells, sequence) {
    let currentInputStep = 0;
    cells.forEach((c, idx) => {
        c.onclick = () => {
            c.style.background = 'var(--accent)';
            setTimeout(() => c.style.background = 'rgba(255,255,255,0.05)', 200);

            if (idx === sequence[currentInputStep]) {
                currentInputStep++;
                if (currentInputStep === sequence.length) setTimeout(endLevelSuccess, 400);
            } else {
                endLevelFailure();
            }
        };
    });
}

function startTimer(seconds) {
    if (seconds) {
        clearInterval(gameTimer);
        gameTimer = setTimeout(() => {
            endLevelFailure();
        }, seconds * 1000);
    }
}
