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
const btnGameCompletedBack = document.getElementById('btn-game-completed-back');

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
    openCategory(currentCategoryIndex); // Refresh progress in games view
});

btnGameCompletedBack.addEventListener('click', () => {
    openCategory(currentCategoryIndex); // Refresh progress
});

function prepareLevel() {
    const gameInfo = categories[currentCategoryIndex].games[currentGameIndex];

    if (currentLevelNum > gameInfo.totalLevels) {
        gameTitle.textContent = "¡Batería Completada!";
        document.getElementById('instruction-title').textContent = "¡Has completado todos los niveles!";
        document.getElementById('instruction-text').textContent = `Excelente trabajo en ${gameInfo.name}.`;

        btnStartLevel.classList.add('hidden');
        btnGameCompletedBack.classList.remove('hidden');

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

    btnStartLevel.classList.remove('hidden');
    btnGameCompletedBack.classList.add('hidden');

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
    else if (type === 'flanker') playFlanker();
    else if (type === 'simon-sequence') playSimon();
    else if (type === 'pattern-recall') playPatternRecall();
    else if (type === 'n-back') playNBack();
    else if (type === 'sequence-tap') playSequenceTap();
    else if (type === 'fast-compare') playFastCompare();
    else if (type === 'visual-sweep') playVisualSweep();
    else if (type === 'math-speed') playMathSpeed();
    else if (type === 'angle-match') playAngleMatch();
    else if (type === 'rule-switch') playRuleSwitch();
}

function playGeneric(msg) {
    gameContent.innerHTML = `<p style="margin-top:40px; font-size: 1.2rem; text-align:center; color: var(--accent)">Simulación Completada Automáticamente.<br><em>[${msg}]</em></p>`;
    setTimeout(endLevelSuccess, 2000);
}

// ============================================
// 1. ATENCIÓN - Flanker Task
// ============================================
let flankerRounds = 0;
function playFlanker() {
    flankerRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="flanker-arrows" style="font-size: 5rem; letter-spacing: 10px; margin-bottom: 40px;"></div>
        <div class="button-row">
            <button id="btn-left" class="btn btn-outline btn-large">← Izquierda</button>
            <button id="btn-right" class="btn btn-outline btn-large">Derecha →</button>
        </div>
    `;
    nextFlankerRound();
}
function nextFlankerRound() {
    if (flankerRounds <= 0) return endLevelSuccess();
    let isCongruent = Math.random() > 0.5;
    let centerDir = Math.random() > 0.5 ? '←' : '→';
    let flankDir = isCongruent ? centerDir : (centerDir === '←' ? '→' : '←');

    let arrowStr = "";
    let mid = Math.floor(currentGameConfig.arrows / 2);
    for (let i = 0; i < currentGameConfig.arrows; i++) {
        arrowStr += (i === mid) ? centerDir : flankDir;
    }

    document.getElementById('flanker-arrows').textContent = arrowStr;

    document.getElementById('btn-left').onclick = () => { if (centerDir === '←') { flankerRounds--; nextFlankerRound(); } else endLevelFailure(); };
    document.getElementById('btn-right').onclick = () => { if (centerDir === '→') { flankerRounds--; nextFlankerRound(); } else endLevelFailure(); };
    startTimer(currentGameConfig.limitTime);
}

// ============================================
// 2. MEMORIA - Pattern Recall
// ============================================
function playPatternRecall() {
    const s = currentGameConfig.grid;
    gameContent.innerHTML = `<div class="grid-game" id="recall-grid" style="grid-template-columns: repeat(${s}, 1fr)"></div>`;
    const grid = document.getElementById('recall-grid');

    let activeIndices = [];
    while (activeIndices.length < currentGameConfig.blocks) {
        let r = Math.floor(Math.random() * (s * s));
        if (!activeIndices.includes(r)) activeIndices.push(r);
    }

    let cells = [];
    for (let i = 0; i < (s * s); i++) {
        let c = document.createElement('div');
        c.className = 'grid-cell';
        if (activeIndices.includes(i)) c.style.background = 'var(--accent)';
        grid.appendChild(c);
        cells.push(c);
    }

    setTimeout(() => {
        cells.forEach(c => c.style.background = 'rgba(255,255,255,0.05)');
        enableRecallInput(cells, activeIndices);
    }, currentGameConfig.displayTime);
}
function enableRecallInput(cells, activeIndices) {
    let found = 0;
    cells.forEach((c, i) => {
        c.onclick = () => {
            if (activeIndices.includes(i)) {
                c.style.background = 'var(--accent)';
                c.onclick = null;
                found++;
                if (found >= activeIndices.length) setTimeout(endLevelSuccess, 500);
            } else {
                c.style.background = '#ef4444';
                setTimeout(endLevelFailure, 400);
            }
        };
    });
}

// ============================================
// 3. MEMORIA - N-Back
// ============================================
let nBackRounds = 0;
let nBackHistory = [];
function playNBack() {
    nBackRounds = currentGameConfig.rounds;
    nBackHistory = [];
    gameContent.innerHTML = `
        <div id="nback-shape" style="width:150px; height:150px; background:var(--primary); margin-bottom:40px; display:flex; align-items:center; justify-content:center; font-size:4rem;"></div>
        <p style="margin-bottom: 20px;">¿Es igual a la figura de hace ${currentGameConfig.nBack} turnos?</p>
        <div class="button-row">
            <button id="btn-nback-yes" class="btn btn-primary btn-large">Sí (Igual)</button>
            <button id="btn-nback-no" class="btn btn-outline btn-large">No</button>
        </div>
    `;
    nextNBackRound();
}
function nextNBackRound() {
    if (nBackRounds <= 0) return endLevelSuccess();

    let shapes = ['⭐', '🔺', '🟦', '🔴', '🟢'];
    let currentShape = '';

    // Forzamos que un 30% de veces SÍ sea igual para que haya respuestas "Sí"
    let forceMatch = Math.random() < 0.3 && nBackHistory.length >= currentGameConfig.nBack;

    if (forceMatch) {
        currentShape = nBackHistory[nBackHistory.length - currentGameConfig.nBack];
    } else {
        currentShape = shapes[Math.floor(Math.random() * shapes.length)];
    }

    document.getElementById('nback-shape').textContent = currentShape;
    document.getElementById('btn-nback-yes').disabled = nBackHistory.length < currentGameConfig.nBack;
    document.getElementById('btn-nback-no').disabled = nBackHistory.length < currentGameConfig.nBack;

    if (nBackHistory.length < currentGameConfig.nBack) {
        document.getElementById('nback-shape').style.opacity = "0.5";
        setTimeout(() => {
            document.getElementById('nback-shape').style.opacity = "1";
            nBackHistory.push(currentShape);
            nextNBackRound();
        }, 1000);
        return;
    }

    let isMatch = (currentShape === nBackHistory[nBackHistory.length - currentGameConfig.nBack]);

    document.getElementById('btn-nback-yes').onclick = () => {
        if (isMatch) { nBackHistory.push(currentShape); nBackRounds--; nextNBackRound(); } else endLevelFailure();
    };
    document.getElementById('btn-nback-no').onclick = () => {
        if (!isMatch) { nBackHistory.push(currentShape); nBackRounds--; nextNBackRound(); } else endLevelFailure();
    };
    startTimer(currentGameConfig.limitTime);
}

// ============================================
// 4. VELOCIDAD - Fast Compare
// ============================================
let fcRounds = 0;
function playFastCompare() {
    fcRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div style="display:flex; gap: 40px; margin-bottom: 40px; font-size:5rem;">
            <div id="fc-left"></div>
            <div id="fc-right"></div>
        </div>
        <div class="button-row">
            <button id="btn-fc-yes" class="btn btn-primary btn-large">Iguales</button>
            <button id="btn-fc-no" class="btn btn-outline btn-large">Diferentes</button>
        </div>
    `;
    nextFastCompareRound();
}
function nextFastCompareRound() {
    if (fcRounds <= 0) return endLevelSuccess();

    let symbols = currentGameConfig.complexShapes ? ['q', 'p', 'b', 'd', 'O', '0', 'I', 'l'] : ['⭐', '🌟', '⚙️', '🌞', '🌙'];
    let isDiff = Math.random() < currentGameConfig.diffProb;
    let sym1 = symbols[Math.floor(Math.random() * symbols.length)];
    let sym2 = sym1;

    if (isDiff) {
        while (sym2 === sym1) sym2 = symbols[Math.floor(Math.random() * symbols.length)];
    }

    document.getElementById('fc-left').textContent = sym1;
    document.getElementById('fc-right').textContent = sym2;

    document.getElementById('btn-fc-yes').onclick = () => { if (!isDiff) { fcRounds--; nextFastCompareRound(); } else endLevelFailure(); };
    document.getElementById('btn-fc-no').onclick = () => { if (isDiff) { fcRounds--; nextFastCompareRound(); } else endLevelFailure(); };
    startTimer(currentGameConfig.limitTime);
}

// ============================================
// 5. VELOCIDAD - Visual Sweep
// ============================================
let vsRounds = 0;
function playVisualSweep() {
    vsRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="sweep-area" style="width: 300px; height: 100px; background: rgba(255,255,255,0.05); position:relative; overflow:hidden; margin-bottom:40px; border-radius:8px;">
            <div id="bar1" style="width:20px; height:100%; background:var(--primary); position:absolute; top:0;"></div>
            <div id="bar2" style="width:20px; height:100%; background:var(--accent); position:absolute; top:0;"></div>
        </div>
        <div class="button-row">
            <button id="btn-vs-in" class="btn btn-outline btn-large">Hacia el Centro</button>
            <button id="btn-vs-out" class="btn btn-outline btn-large">Hacia Afuera</button>
        </div>
    `;
    nextVisualSweepRound();
}
function nextVisualSweepRound() {
    if (vsRounds <= 0) return endLevelSuccess();

    let isConverging = Math.random() > 0.5; // In (center) or Out
    let b1 = document.getElementById('bar1');
    let b2 = document.getElementById('bar2');

    b1.style.transition = 'none';
    b2.style.transition = 'none';

    if (isConverging) {
        b1.style.left = '0px'; b2.style.left = '280px';
    } else {
        b1.style.left = '140px'; b2.style.left = '160px'; // center
    }

    // Animate
    setTimeout(() => {
        b1.style.transition = 'left 0.4s linear';
        b2.style.transition = 'left 0.4s linear';
        if (isConverging) { b1.style.left = '140px'; b2.style.left = '160px'; }
        else { b1.style.left = '0px'; b2.style.left = '280px'; }
    }, 50);

    document.getElementById('btn-vs-in').onclick = () => { if (isConverging) { vsRounds--; nextVisualSweepRound(); } else endLevelFailure(); };
    document.getElementById('btn-vs-out').onclick = () => { if (!isConverging) { vsRounds--; nextVisualSweepRound(); } else endLevelFailure(); };
    startTimer(currentGameConfig.limitTime);
}

// ============================================
// 6. LOGICA - Angle Match
// ============================================
let amRounds = 0;
function playAngleMatch() {
    amRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div style="display:flex; gap:50px; margin-bottom:40px;">
            <div id="ang1" style="font-size: 5rem; font-weight:bold; transition: transform 0s;">F</div>
            <div id="ang2" style="font-size: 5rem; font-weight:bold; transition: transform 0s;">F</div>
        </div>
        <div class="button-row">
            <button id="btn-am-yes" class="btn btn-primary btn-large">Misma Figura</button>
            <button id="btn-am-no" class="btn btn-outline btn-large">Reflejada (Diferente)</button>
        </div>
    `;
    nextAngleMatchRound();
}
function nextAngleMatchRound() {
    if (amRounds <= 0) return endLevelSuccess();

    let isReflected = Math.random() > 0.5;
    let rot1 = Math.floor(Math.random() * 360);
    let rot2 = Math.floor(Math.random() * 360);

    // Aumentar dificultad haciendo que las letras cambien en niveles altos
    let chars = currentGameConfig.level > 5 ? ['R', 'P', 'J', 'G'] : ['F', 'L'];
    let char = chars[Math.floor(Math.random() * chars.length)];

    let el1 = document.getElementById('ang1');
    let el2 = document.getElementById('ang2');

    el1.textContent = char;
    el2.textContent = char;

    el1.style.transform = `rotate(${rot1}deg)`;
    if (isReflected) {
        el2.style.transform = `rotate(${rot2}deg) scaleX(-1)`;
    } else {
        el2.style.transform = `rotate(${rot2}deg) scaleX(1)`;
    }

    document.getElementById('btn-am-yes').onclick = () => { if (!isReflected) { amRounds--; nextAngleMatchRound(); } else endLevelFailure(); };
    document.getElementById('btn-am-no').onclick = () => { if (isReflected) { amRounds--; nextAngleMatchRound(); } else endLevelFailure(); };
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
