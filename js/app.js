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
    else if (type === 'letter-search') playLetterSearch();
    else if (type === 'go-no-go') playGoNoGo();
    else if (type === 'memory-match') playMemoryMatch();
    else if (type === 'reverse-simon') playReverseSimon();
    else if (type === 'target-clicker') playTargetClicker();
    else if (type === 'dual-task') playDualTask();
    else if (type === 'number-pattern') playNumberPattern();
    else if (type === 'logic-balance') playLogicBalance();
    else if (type === 'emotion-match') playEmotionMatch();
    else if (type === 'face-memory') playFaceMemory();
    else if (type === 'hawk-eye') playHawkEye();
    else if (type === 'sound-sweeps') playSoundSweeps();
    else if (type === 'eye-gaze') playEyeGaze();
    else if (type === 'emotion-context') playEmotionContext();
    else if (type === 'path-planning') playPathPlanning();
    else if (type === 'hidden-figure') playHiddenFigure();
    else if (type === 'target-tracker') playTargetTracker();
    else if (type === 'sound-match') playSoundMatch();
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

// ============================================
// NUEVO JUEGO 1: Búsqueda Cruzada (letter-search)
// ============================================
let lsTargets = 0;
let lsFound = 0;
function playLetterSearch() {
    lsFound = 0;
    const g = currentGameConfig.grid;
    lsTargets = currentGameConfig.targetsNum;
    gameContent.innerHTML = `<div class="grid-game" style="grid-template-columns: repeat(${g}, 1fr)"></div>`;
    const grid = gameContent.querySelector('.grid-game');

    let totalCells = g * g;
    let cells = Array(totalCells).fill('X');
    let vocales = ['A', 'E', 'I', 'O', 'U'];
    let distractores = ['M', 'N', 'Z', 'W', 'V', 'K', 'R'];

    // Fill distractors
    for (let i = 0; i < totalCells; i++) {
        cells[i] = distractores[Math.floor(Math.random() * distractores.length)];
    }

    // Place targets
    let placed = 0;
    while (placed < lsTargets) {
        let idx = Math.floor(Math.random() * totalCells);
        if (!vocales.includes(cells[idx])) {
            cells[idx] = vocales[placed % vocales.length];
            placed++;
        }
    }

    cells.forEach((char, i) => {
        let cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = char;
        cell.onclick = () => {
            if (vocales.includes(char)) {
                if (!cell.classList.contains('active')) {
                    cell.classList.add('active');
                    cell.style.background = 'var(--accent)';
                    lsFound++;
                    if (lsFound >= lsTargets) setTimeout(endLevelSuccess, 300);
                }
            } else {
                cell.style.background = "#ef4444";
                setTimeout(() => cell.style.background = "rgba(255,255,255,0.05)", 300);
                endLevelFailure();
            }
        };
        grid.appendChild(cell);
    });
}

// ============================================
// NUEVO JUEGO 2: Go/No-Go
// ============================================
let gngRounds = 0;
function playGoNoGo() {
    gngRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="gng-shape" style="width: 150px; height: 150px; border-radius: 50%; background: var(--panel-bg); margin: 0 auto; transition: background 0.1s;"></div>
    `;
    nextGoNoGoRound();
}

let gngTimeout;
function nextGoNoGoRound() {
    if (gngRounds <= 0) return endLevelSuccess();

    let isGo = Math.random() > 0.3; // 70% verde
    let shape = document.getElementById('gng-shape');

    // reset
    shape.style.background = 'var(--panel-bg)';
    shape.onclick = null;
    clearTimeout(gngTimeout);

    // Delay between rounds
    setTimeout(() => {
        if (isGo) {
            shape.style.background = '#10b981'; // Green
            shape.onclick = () => { clearTimeout(gngTimeout); gngRounds--; shape.style.background = 'var(--panel-bg)'; nextGoNoGoRound(); };
            gngTimeout = setTimeout(() => { endLevelFailure(); }, currentGameConfig.timeLimit * 1000);
        } else {
            shape.style.background = '#ef4444'; // Red
            shape.style.borderRadius = '20%'; // Mínimo cambio
            shape.onclick = () => { clearTimeout(gngTimeout); endLevelFailure(); };
            gngTimeout = setTimeout(() => { gngRounds--; shape.style.borderRadius = '50%'; shape.style.background = 'var(--panel-bg)'; nextGoNoGoRound(); }, currentGameConfig.timeLimit * 1000);
        }
    }, 500 + Math.random() * 1000);
}

// ============================================
// NUEVO JUEGO 3: Pares Ocultos (Memory Match)
// ============================================
let mmMatches = 0;
let mmFlipped = [];
function playMemoryMatch() {
    mmMatches = 0;
    mmFlipped = [];
    let pairs = currentGameConfig.pairs;
    let icons = ['🌟', '🍎', '🚗', '🏀', '🎸', '🕹️', '🎨', '🚀'];
    let gameIcons = icons.slice(0, pairs);
    let cards = [...gameIcons, ...gameIcons].sort(() => Math.random() - 0.5);

    let cols = pairs <= 3 ? 3 : 4;
    gameContent.innerHTML = `<div class="grid-game" style="grid-template-columns: repeat(${cols}, 1fr)"></div>`;
    const grid = gameContent.querySelector('.grid-game');

    cards.forEach((icon, i) => {
        let cell = document.createElement('div');
        cell.className = 'grid-cell memory-card';
        cell.dataset.icon = icon;
        cell.innerHTML = `<span>?</span>`;
        cell.style.cursor = 'pointer';
        cell.onclick = () => flipCard(cell, icon, pairs);
        grid.appendChild(cell);
    });
}

function flipCard(cell, icon, totalPairs) {
    if (mmFlipped.length >= 2 || cell.classList.contains('matched') || cell.classList.contains('flipped')) return;

    cell.classList.add('flipped');
    cell.innerHTML = `<span>${icon}</span>`;
    cell.style.background = 'var(--primary)';
    mmFlipped.push(cell);

    if (mmFlipped.length === 2) {
        if (mmFlipped[0].dataset.icon === mmFlipped[1].dataset.icon) {
            mmFlipped[0].classList.add('matched');
            mmFlipped[1].classList.add('matched');
            mmFlipped[0].style.background = 'var(--accent)';
            mmFlipped[1].style.background = 'var(--accent)';
            mmFlipped = [];
            mmMatches++;
            if (mmMatches >= totalPairs) setTimeout(endLevelSuccess, 500);
        } else {
            setTimeout(() => {
                mmFlipped[0].classList.remove('flipped');
                mmFlipped[1].classList.remove('flipped');
                mmFlipped[0].innerHTML = `<span>?</span>`;
                mmFlipped[1].innerHTML = `<span>?</span>`;
                mmFlipped[0].style.background = 'rgba(255,255,255,0.05)';
                mmFlipped[1].style.background = 'rgba(255,255,255,0.05)';
                mmFlipped = [];
            }, 800);
        }
    }
}

// ============================================
// NUEVO JUEGO 4: Secuencia Inversa
// ============================================
function playReverseSimon() {
    gameContent.innerHTML = `<div class="grid-game" id="rev-simon-grid" style="grid-template-columns: repeat(${currentGameConfig.grid}, 1fr)"></div>`;
    const grid = document.getElementById('rev-simon-grid');
    let cells = [];
    for (let i = 0; i < (currentGameConfig.grid * currentGameConfig.grid); i++) {
        let c = document.createElement('div'); c.className = 'grid-cell';
        grid.appendChild(c); cells.push(c);
    }

    let sequence = [];
    for (let i = 0; i < currentGameConfig.sequenceLength; i++) {
        sequence.push(Math.floor(Math.random() * cells.length));
    }

    let step = 0;
    let showInterval = setInterval(() => {
        cells.forEach(c => c.style.background = 'rgba(255,255,255,0.05)');
        if (step >= sequence.length) {
            clearInterval(showInterval);
            enableReverseSimonInput(cells, sequence);
            return;
        }
        setTimeout(() => {
            cells[sequence[step]].style.background = 'var(--primary)';
            step++;
        }, 200);
    }, currentGameConfig.displayTime);
}

function enableReverseSimonInput(cells, sequence) {
    let revSeq = [...sequence].reverse();
    let currentInputStep = 0;
    cells.forEach((c, idx) => {
        c.onclick = () => {
            c.style.background = 'var(--accent)';
            setTimeout(() => c.style.background = 'rgba(255,255,255,0.05)', 200);

            if (idx === revSeq[currentInputStep]) {
                currentInputStep++;
                if (currentInputStep === revSeq.length) setTimeout(endLevelSuccess, 400);
            } else {
                endLevelFailure();
            }
        };
    });
}

// ============================================
// NUEVO JUEGO 5: Tiro al Blanco (Target Clicker)
// ============================================
let tcRounds = 0;
let tcTimer;
function playTargetClicker() {
    tcRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `<div id="tc-area" style="position:relative; width:100%; height:300px; background:rgba(0,0,0,0.2); border-radius:12px; overflow:hidden;"></div>`;
    nextTargetClickerRound();
}

function nextTargetClickerRound() {
    if (tcRounds <= 0) return endLevelSuccess();
    let area = document.getElementById('tc-area');
    area.innerHTML = '';

    let dot = document.createElement('div');
    dot.style.width = '60px';
    dot.style.height = '60px';
    dot.style.background = 'var(--accent)';
    dot.style.borderRadius = '50%';
    dot.style.position = 'absolute';

    let maxX = area.clientWidth - 60;
    let maxY = area.clientHeight - 60;
    dot.style.left = Math.floor(Math.random() * maxX) + 'px';
    dot.style.top = Math.floor(Math.random() * maxY) + 'px';

    dot.onclick = () => {
        clearTimeout(tcTimer);
        tcRounds--;
        nextTargetClickerRound();
    };

    area.appendChild(dot);
    tcTimer = setTimeout(() => { endLevelFailure(); }, currentGameConfig.timeLimit);
}

// ============================================
// NUEVO JUEGO 6: Tarea Dual
// ============================================
let dtRounds = 0;
function playDualTask() {
    dtRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div style="display:flex; justify-content:center; gap:40px; margin-bottom: 40px;">
            <div id="dt-letter" style="font-size: 5rem; font-weight:bold; color:var(--primary);"></div>
            <div id="dt-number" style="font-size: 5rem; font-weight:bold; color:var(--accent);"></div>
        </div>
        <div class="button-row">
            <button id="btn-dt-yes" class="btn btn-primary btn-large">SÍ (Vocal Y Par)</button>
            <button id="btn-dt-no" class="btn btn-outline btn-large">NO</button>
        </div>
    `;
    nextDualTaskRound();
}

function nextDualTaskRound() {
    if (dtRounds <= 0) return endLevelSuccess();

    let forceTrue = Math.random() > 0.6;
    let isVowel = Math.random() > 0.5 || forceTrue;
    let isEven = Math.random() > 0.5 || forceTrue;
    if (forceTrue) { isVowel = true; isEven = true; }

    let vowels = ['A', 'E', 'I', 'O', 'U'];
    let consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    let evens = [2, 4, 6, 8];
    let odds = [1, 3, 5, 7, 9];

    let l = isVowel ? vowels[Math.floor(Math.random() * vowels.length)] : consonants[Math.floor(Math.random() * consonants.length)];
    let n = isEven ? evens[Math.floor(Math.random() * evens.length)] : odds[Math.floor(Math.random() * odds.length)];

    document.getElementById('dt-letter').textContent = l;
    document.getElementById('dt-number').textContent = n;

    let isBothCorrect = isVowel && isEven;

    document.getElementById('btn-dt-yes').onclick = () => { if (isBothCorrect) { dtRounds--; nextDualTaskRound(); } else { endLevelFailure(); } };
    document.getElementById('btn-dt-no').onclick = () => { if (!isBothCorrect) { dtRounds--; nextDualTaskRound(); } else { endLevelFailure(); } };
}

// ============================================
// NUEVO JUEGO 7: Patrones Lógicos
// ============================================
let npRounds = 0;
function playNumberPattern() {
    npRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="np-seq" style="font-size: 3rem; margin-bottom: 40px; letter-spacing: 5px;"></div>
        <div class="button-row" id="np-btns"></div>
    `;
    nextNumberPattern();
}

function nextNumberPattern() {
    if (npRounds <= 0) return endLevelSuccess();

    let step = Math.floor(Math.random() * 4) + 2;
    let start = Math.floor(Math.random() * 10) + 1;
    let isMulti = Math.random() > 0.5 && currentGameConfig.level > 4;

    let seq = [];
    let current = start;
    for (let i = 0; i < 3; i++) {
        seq.push(current);
        if (isMulti) current *= step; else current += step;
    }
    let answer = current;

    document.getElementById('np-seq').textContent = seq.join(', ') + ', ?';

    let options = [answer, answer + step, answer - step, answer + step + 1].sort(() => Math.random() - 0.5);
    let btns = document.getElementById('np-btns');
    btns.innerHTML = '';
    options.forEach(opt => {
        let b = document.createElement('button');
        b.className = 'btn btn-outline color-btn';
        b.textContent = opt;
        b.onclick = () => { if (opt === answer) { npRounds--; nextNumberPattern(); } else endLevelFailure(); };
        btns.appendChild(b);
    });
}

// ============================================
// NUEVO JUEGO 8: Balanza Lógica
// ============================================
let lbRounds = 0;
function playLogicBalance() {
    lbRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="lb-text" style="font-size: 1.5rem; margin-bottom: 40px; line-height: 1.6; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px;"></div>
        <div class="button-row">
            <button id="btn-lb-true" class="btn btn-primary btn-large">Verdadero</button>
            <button id="btn-lb-false" class="btn btn-outline btn-large">Falso</button>
        </div>
    `;
    nextLogicBalance();
}

function nextLogicBalance() {
    if (lbRounds <= 0) return endLevelSuccess();

    let items = [['El león', 'El perro', 'El gato'], ['La roca', 'La madera', 'La pluma'], ['A', 'B', 'C']];
    let p = items[Math.floor(Math.random() * items.length)];
    let verb = "pesa más que";

    let text = `${p[0]} ${verb} ${p[1]}.<br>${p[1]} ${verb} ${p[2]}.<br><br>`;

    let isTrue = Math.random() > 0.5;
    if (isTrue) { text += `¿${p[0]} ${verb} ${p[2]}?`; } // A > C (Verdad)
    else { text += `¿${p[2]} ${verb} ${p[0]}?`; } // C > A (Falso)

    document.getElementById('lb-text').innerHTML = text;
    document.getElementById('btn-lb-true').onclick = () => { if (isTrue) { lbRounds--; nextLogicBalance(); } else endLevelFailure(); };
    document.getElementById('btn-lb-false').onclick = () => { if (!isTrue) { lbRounds--; nextLogicBalance(); } else endLevelFailure(); };
}

// ============================================
// NUEVO JUEGO 9: Emotion Match (Habilidades Sociales)
// ============================================
let emRounds = 0;
function playEmotionMatch() {
    emRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <h2 id="em-text" style="font-size: 2.5rem; color:var(--accent); margin-bottom:40px;"></h2>
        <div class="grid-game" id="em-grid" style="grid-template-columns: repeat(2, 1fr); gap: 20px;"></div>
    `;
    nextEmotionMatch();
}

function nextEmotionMatch() {
    if (emRounds <= 0) return endLevelSuccess();

    let emotions = [
        { name: "Felicidad", emoji: "😃" }, { name: "Tristeza", emoji: "😢" },
        { name: "Enojo", emoji: "😠" }, { name: "Sorpresa", emoji: "😲" },
        { name: "Miedo", emoji: "😨" }, { name: "Asco o Disgusto", emoji: "🤢" }
    ];

    let shuffled = [...emotions].sort(() => Math.random() - 0.5);
    let options = shuffled.slice(0, 4);
    let target = options[Math.floor(Math.random() * 4)];

    document.getElementById('em-text').textContent = target.name;
    const grid = document.getElementById('em-grid');
    grid.innerHTML = '';

    options.forEach(opt => {
        let c = document.createElement('div');
        c.className = 'grid-cell';
        c.style.fontSize = '4rem';
        c.style.cursor = 'pointer';
        c.textContent = opt.emoji;
        c.onclick = () => { if (opt.name === target.name) { emRounds--; nextEmotionMatch(); } else endLevelFailure(); };
        grid.appendChild(c);
    });
}

// ============================================
// NUEVO JUEGO 10: Face Memory (Habilidades Sociales)
// ============================================
let fmRounds = 0;
function playFaceMemory() {
    fmRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="fm-main" style="font-size: 6rem; margin-bottom:40px; height: 150px; display:flex; justify-content:center; align-items:center;"></div>
        <div class="grid-game hidden" id="fm-grid" style="grid-template-columns: repeat(3, 1fr)"></div>
    `;
    nextFaceMemory();
}

function nextFaceMemory() {
    if (fmRounds <= 0) return endLevelSuccess();

    let faces = ["👦", "👧", "👨", "👩", "👴", "👵", "👶", "👳‍♂️", "👲", "🧔"];
    let shuffled = [...faces].sort(() => Math.random() - 0.5);
    let options = shuffled.slice(0, 3);
    let target = options[0];

    // random shuffle options for presentation
    options.sort(() => Math.random() - 0.5);

    const main = document.getElementById('fm-main');
    const grid = document.getElementById('fm-grid');

    main.textContent = target;
    main.classList.remove('hidden');
    grid.classList.add('hidden');

    setTimeout(() => {
        main.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';
        options.forEach(opt => {
            let c = document.createElement('div');
            c.className = 'grid-cell';
            c.style.fontSize = '3.5rem';
            c.textContent = opt;
            c.onclick = () => { if (opt === target) { fmRounds--; nextFaceMemory(); } else endLevelFailure(); };
            grid.appendChild(c);
        });
    }, currentGameConfig.displayTime);
}

// ============================================
// HAWK EYE (BrainHQ Inspired)
// ============================================
let heRounds = 0;
function playHawkEye() {
    heRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="he-container" style="position:relative; width:300px; height:300px; margin:0 auto; background:rgba(0,0,0,0.2); border-radius:50%;">
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:2rem;">➕</div>
            <div id="he-elements"></div>
        </div>
    `;
    nextHawkEye();
}
function nextHawkEye() {
    if (heRounds <= 0) return endLevelSuccess();

    let container = document.getElementById('he-elements');
    container.innerHTML = '';

    let targetIdx = Math.floor(Math.random() * 8);
    let radius = 110;

    let cells = [];
    for (let i = 0; i < 8; i++) {
        let angle = i * 45 * (Math.PI / 180);
        let x = 150 + radius * Math.cos(angle) - 20;
        let y = 150 + radius * Math.sin(angle) - 20;

        let el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = '40px'; el.style.height = '40px';
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.fontSize = '2rem';
        el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
        el.style.cursor = 'pointer';

        container.appendChild(el);
        cells.push(el);
    }

    setTimeout(() => {
        for (let i = 0; i < 8; i++) {
            cells[i].textContent = (i === targetIdx) ? '⭐' : '☁️';
        }

        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                cells[i].textContent = '';
                cells[i].style.background = 'rgba(255,255,255,0.1)';
                cells[i].style.borderRadius = '50%';

                cells[i].onclick = () => {
                    for (let j = 0; j < 8; j++) cells[j].onclick = null;
                    if (i === targetIdx) {
                        cells[i].style.background = 'var(--accent)';
                        heRounds--;
                        setTimeout(nextHawkEye, 500);
                    } else {
                        cells[i].style.background = '#ef4444';
                        setTimeout(endLevelFailure, 500);
                    }
                }
            }
        }, currentGameConfig.displayTime);
    }, 800);
}

// ============================================
// SOUND SWEEPS (BrainHQ Inspired Auditory)
// ============================================
let ssRounds = 0;
let audioCtx = null;

function playSoundSweeps() {
    ssRounds = currentGameConfig.rounds;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    gameContent.innerHTML = `
        <div style="text-align:center; margin-bottom: 30px;">
            <div style="font-size: 5rem; margin-bottom: 20px;">🔊</div>
            <p>Escucha con atención... ¿El segundo tono es más agudo o grave?</p>
        </div>
        <div class="button-row">
            <button id="btn-ss-up" class="btn btn-outline btn-large" style="display:none;">Sube (Más Agudo)</button>
            <button id="btn-ss-down" class="btn btn-outline btn-large" style="display:none;">Baja (Más Grave)</button>
        </div>
    `;

    const resumeAudio = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        document.removeEventListener('click', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);

    setTimeout(nextSoundSweep, 1000);
}

function nextSoundSweep() {
    if (ssRounds <= 0) return endLevelSuccess();

    document.getElementById('btn-ss-up').style.display = 'none';
    document.getElementById('btn-ss-down').style.display = 'none';

    let isUp = Math.random() > 0.5;
    let freq1 = 400 + Math.random() * 400; // 400 - 800 Hz
    let freq2 = isUp ? freq1 + 250 + Math.random() * 100 : freq1 - 250 - Math.random() * 100;

    if (audioCtx.state === 'suspended') audioCtx.resume();
    let now = audioCtx.currentTime;

    let duration = 0.2;
    let gap = 0.1;

    // Tone 1
    let osc1 = audioCtx.createOscillator();
    let gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(freq1, now);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.setTargetAtTime(0, now + duration - 0.05, 0.05);
    osc1.start(now);
    osc1.stop(now + duration);

    // Tone 2
    let osc2 = audioCtx.createOscillator();
    let gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.setValueAtTime(freq2, now + duration + gap);
    gain2.gain.setValueAtTime(0.5, now + duration + gap);
    gain2.gain.setTargetAtTime(0, now + duration + gap + duration - 0.05, 0.05);
    osc2.start(now + duration + gap);
    osc2.stop(now + duration + gap + duration);

    setTimeout(() => {
        document.getElementById('btn-ss-up').style.display = 'inline-block';
        document.getElementById('btn-ss-down').style.display = 'inline-block';

        document.getElementById('btn-ss-up').onclick = () => { if (isUp) { ssRounds--; nextSoundSweep(); } else endLevelFailure(); };
        document.getElementById('btn-ss-down').onclick = () => { if (!isUp) { ssRounds--; nextSoundSweep(); } else endLevelFailure(); };
        startTimer(currentGameConfig.limitTime);
    }, (duration * 2 + gap) * 1000 + 100);
}

// ============================================
// EYE GAZE (Autism Social Tool)
// ============================================
let egRounds = 0;
function playEyeGaze() {
    egRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div id="eg-face" style="font-size: 5rem; font-family: monospace; text-align: center; margin-bottom: 30px;">
           [ <span id="eg-eyes"></span> ]
        </div>
        <div class="button-row" style="flex-wrap: wrap; width: 300px; margin: 0 auto; justify-content: center;">
            <button id="btn-eg-up" class="btn btn-outline" style="width: 100%; margin-bottom:10px;">Arriba</button>
            <button id="btn-eg-left" class="btn btn-outline" style="width: 45%;">Izquierda</button>
            <button id="btn-eg-right" class="btn btn-outline" style="width: 45%;">Derecha</button>
            <button id="btn-eg-down" class="btn btn-outline" style="width: 100%; margin-top:10px;">Abajo</button>
        </div>
    `;
    nextEyeGaze();
}
function nextEyeGaze() {
    if (egRounds <= 0) return endLevelSuccess();
    let dirs = [
        { id: 'up', eyes: '△ △' },
        { id: 'down', eyes: '▽ ▽' },
        { id: 'left', eyes: '◁ ◁' },
        { id: 'right', eyes: '▷ ▷' }
    ];
    let d = dirs[Math.floor(Math.random() * dirs.length)];
    document.getElementById('eg-eyes').textContent = d.eyes;

    ['up', 'down', 'left', 'right'].forEach(dir => {
        document.getElementById('btn-eg-' + dir).onclick = () => {
            if (d.id === dir) { egRounds--; nextEyeGaze(); } else endLevelFailure();
        }
    });
    startTimer(currentGameConfig.limitTime);
}

// ============================================
// EMOTION CONTEXT (Social Context)
// ============================================
let ecRounds = 0;
function playEmotionContext() {
    ecRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <p id="ec-text" style="font-size: 1.5rem; text-align:center; margin-bottom: 40px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;"></p>
        <div class="button-row" id="ec-options" style="flex-wrap: wrap;"></div>
    `;
    nextEmotionContext();
}
function nextEmotionContext() {
    if (ecRounds <= 0) return endLevelSuccess();
    const scenarios = [
        { t: "A Juan se le cayó su helado favorito al piso.", emo: "Tristeza 😢", wrong: ["Alegría 😀", "Enojo 😡", "Miedo 😱"] },
        { t: "María abrió una caja y saltó una araña gigante.", emo: "Miedo 😱", wrong: ["Alegría 😀", "Tristeza 😢", "Enojo 😡"] },
        { t: "El jefe le dio el día libre a Carlos como sorpresa.", emo: "Alegría 😀", wrong: ["Tristeza 😢", "Enojo 😡", "Miedo 😱"] },
        { t: "Alguien se coló en la fila justo frente a Ana.", emo: "Enojo 😡", wrong: ["Alegría 😀", "Tristeza 😢", "Miedo 😱"] },
        { t: "Su equipo de fútbol acaba de ganar la copa mundial.", emo: "Alegría 😀", wrong: ["Tristeza 😢", "Enojo 😡", "Asombro 😵"] }
    ];
    let s = scenarios[Math.floor(Math.random() * scenarios.length)];
    document.getElementById('ec-text').textContent = s.t;

    let opts = [s.emo];
    let w = [...s.wrong].sort(() => Math.random() - 0.5).slice(0, 3);
    opts = opts.concat(w).sort(() => Math.random() - 0.5);

    const rb = document.getElementById('ec-options');
    rb.innerHTML = '';
    opts.forEach(o => {
        let b = document.createElement('button');
        b.className = 'btn btn-outline color-btn';
        b.textContent = o;
        b.onclick = () => { if (o === s.emo) { ecRounds--; nextEmotionContext(); } else endLevelFailure(); };
        rb.appendChild(b);
    });
}

// ============================================
// PATH PLANNING (Executive Function)
// ============================================
function playPathPlanning() {
    const s = currentGameConfig.grid;
    gameContent.innerHTML = `<div class="grid-game" id="path-grid" style="grid-template-columns: repeat(${s}, 1fr)"></div>`;
    const grid = document.getElementById('path-grid');

    let cells = [];
    for (let i = 0; i < (s * s); i++) {
        let c = document.createElement('div');
        c.className = 'grid-cell';
        grid.appendChild(c);
        cells.push(c);
    }

    let path = [];
    let startIdx = 0;
    path.push(startIdx);

    let currentIdx = startIdx;
    for (let i = 1; i < currentGameConfig.pathLen; i++) {
        let x = currentIdx % s;
        let y = Math.floor(currentIdx / s);

        let neighbors = [];
        if (x > 0) neighbors.push(currentIdx - 1);
        if (x < s - 1) neighbors.push(currentIdx + 1);
        if (y > 0) neighbors.push(currentIdx - s);
        if (y < s - 1) neighbors.push(currentIdx + s);

        neighbors = neighbors.filter(n => !path.includes(n));
        if (neighbors.length === 0) break; // dead end

        let next = neighbors[Math.floor(Math.random() * neighbors.length)];
        path.push(next);
        currentIdx = next;
    }

    let step = 0;
    let showInterval = setInterval(() => {
        if (step > 0 && step < path.length) {
            cells[path[step - 1]].style.background = 'var(--accent)';
            cells[path[step - 1]].style.opacity = '0.5';
        }
        if (step >= path.length) {
            clearInterval(showInterval);
            setTimeout(() => {
                cells.forEach(c => { c.style.background = 'rgba(255,255,255,0.05)'; c.style.opacity = '1'; });
                enablePathInput(cells, path);
            }, 500);
            return;
        }
        cells[path[step]].style.background = 'var(--primary)';
        step++;
    }, currentGameConfig.displayTime);
}

function enablePathInput(cells, path) {
    let currentStep = 0;
    cells.forEach((c, i) => {
        c.onclick = () => {
            if (i === path[currentStep]) {
                c.style.background = 'var(--primary)';
                currentStep++;
                if (currentStep === path.length) setTimeout(endLevelSuccess, 400);
            } else {
                c.style.background = '#ef4444';
                setTimeout(endLevelFailure, 400);
            }
        };
    });
}

// ============================================
// HIDDEN FIGURE (Sensory Filtering)
// ============================================
function playHiddenFigure() {
    gameContent.innerHTML = `<div id="hf-container" style="position:relative; width:100%; height:300px; background:var(--panel-bg); border-radius:12px; overflow:hidden;"></div>`;
    const container = document.getElementById('hf-container');

    let W = container.clientWidth || 300;
    let H = 300;

    let chars = ['🔺', '🔵', '⬛', '🔶', '◻️'];
    for (let i = 0; i < currentGameConfig.distractors; i++) {
        let el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = (Math.random() * (W - 30)) + 'px';
        el.style.top = (Math.random() * (H - 30)) + 'px';
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        el.style.fontSize = (1 + Math.random()) + 'rem';
        el.style.opacity = 0.5 + Math.random() * 0.5;
        el.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
        el.onclick = () => { el.style.color = '#ef4444'; setTimeout(endLevelFailure, 200); };
        container.appendChild(el);
    }

    // Add target
    let target = document.createElement('div');
    target.style.position = 'absolute';
    target.style.left = (Math.random() * (W - 30)) + 'px';
    target.style.top = (Math.random() * (H - 30)) + 'px';
    target.textContent = '⭐';
    target.style.fontSize = '1.2rem';
    target.style.cursor = 'pointer';
    target.onclick = () => { target.style.transform = 'scale(2)'; setTimeout(endLevelSuccess, 300); };
    container.appendChild(target);

    startTimer(currentGameConfig.limitTime);
}

// ============================================
// TARGET TRACKER (UFOV)
// ============================================
function playTargetTracker() {
    gameContent.innerHTML = `<div id="tt-container" style="position:relative; width:100%; height:300px; background:transparent; border: 2px solid rgba(255,255,255,0.1); border-radius:12px; overflow:hidden;"></div>`;
    const container = document.getElementById('tt-container');
    let W = container.clientWidth || 300;
    let H = 300;

    let total = currentGameConfig.total;
    let targets = currentGameConfig.targets;

    let spheres = [];
    for (let i = 0; i < total; i++) {
        let el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = '30px'; el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.background = 'rgba(255,255,255,0.2)';
        el.style.left = Math.random() * (W - 40) + 'px';
        el.style.top = Math.random() * (H - 40) + 'px';
        el.style.transition = 'all 1s ease-in-out';
        el.isTarget = i < targets;
        container.appendChild(el);
        spheres.push(el);
    }

    // Flash targets
    spheres.forEach(s => { if (s.isTarget) s.style.background = 'var(--accent)'; });

    setTimeout(() => {
        // Hide targets, make them all look the same
        spheres.forEach(s => s.style.background = 'rgba(255,255,255,0.2)');

        let stepsCompleted = 0;
        let moveInterval = setInterval(() => {
            spheres.forEach(s => {
                s.style.left = Math.random() * (W - 40) + 'px';
                s.style.top = Math.random() * (H - 40) + 'px';
            });
            stepsCompleted++;
            if (stepsCompleted >= currentGameConfig.moveSteps) {
                clearInterval(moveInterval);
                setTimeout(() => enableTrackerInput(spheres, targets), 1000);
            }
        }, 1000);
    }, 1500);
}

function enableTrackerInput(spheres, targetsCount) {
    document.getElementById('instruction-text').textContent = 'Haz clic en las esferas que parpadearon al inicio.';
    let found = 0;
    let clicks = 0;
    spheres.forEach(s => {
        s.style.cursor = 'pointer';
        s.onclick = () => {
            if (s.dataset.clicked) return;
            s.dataset.clicked = true;
            clicks++;
            if (s.isTarget) {
                s.style.background = 'var(--accent)';
                found++;
                if (found === targetsCount) setTimeout(endLevelSuccess, 500);
            } else {
                s.style.background = '#ef4444';
                setTimeout(endLevelFailure, 500);
            }
            if (clicks === targetsCount && found < targetsCount) {
                setTimeout(endLevelFailure, 500);
            }
        }
    });
}

// ============================================
// SOUND MATCH (Auditory + Spatial)
// ============================================
function playSoundMatch() {
    let pairs = currentGameConfig.pairs;
    let totalCells = pairs * 2;
    let cols = totalCells <= 4 ? 2 : (totalCells <= 6 ? 3 : 4);

    gameContent.innerHTML = `<div class="grid-game" id="sm-grid" style="grid-template-columns: repeat(${cols}, 1fr)"></div>`;
    const grid = document.getElementById('sm-grid');

    let baseFrequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C(high)
    let freqs = [];
    for (let i = 0; i < pairs; i++) {
        freqs.push(baseFrequencies[i % 4]);
        freqs.push(baseFrequencies[i % 4]); // add pair
    }
    freqs.sort(() => Math.random() - 0.5);

    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (freq) => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    };

    let firstSel = null;
    let matchesFound = 0;

    for (let i = 0; i < totalCells; i++) {
        let c = document.createElement('div');
        c.className = 'grid-cell';
        c.textContent = '🔊';
        c.onclick = () => {
            if (c.dataset.matched || c === firstSel) return;

            playTone(freqs[i]);
            c.style.background = 'rgba(255,255,255,0.2)';

            if (!firstSel) {
                firstSel = c;
                firstSel.idx = i;
            } else {
                if (freqs[firstSel.idx] === freqs[i]) {
                    // Match!
                    c.style.background = 'var(--accent)';
                    firstSel.style.background = 'var(--accent)';
                    c.dataset.matched = "true";
                    firstSel.dataset.matched = "true";
                    matchesFound++;
                    if (matchesFound === pairs) setTimeout(endLevelSuccess, 600);
                } else {
                    // Mismatch
                    let temp = firstSel;
                    setTimeout(() => {
                        temp.style.background = 'rgba(255,255,255,0.05)';
                        c.style.background = 'rgba(255,255,255,0.05)';
                    }, 500);
                }
                firstSel = null;
            }
        };
        grid.appendChild(c);
    }
}

