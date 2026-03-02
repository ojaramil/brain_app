import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, currentUser, userData, saveProgress, loadProgress } from './firebase-config.js';
import { categories } from './exercises.js';

// --- Elementos del DOM ---
const loader = document.getElementById('loader');
const appContainer = document.getElementById('app-container');
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const gameScreen = document.getElementById('game-screen');

const authBtn = document.getElementById('auth-btn');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const playGuestBtn = document.getElementById('play-guest');

const categoriesGrid = document.getElementById('categories-grid');
const totalScoreEl = document.getElementById('total-score');
const exercisesCompletedEl = document.getElementById('exercises-completed');

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
let currentLevelNum = 1;
let sessionScore = 0;
let gameTimer = null;

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar el estado de autenticación (Firebase no inicializado realmente aquí, pero preparamos UI)
    // Al usar modular de Firebase, onAuthStateChanged saltaría. 
    // Como preparamos con variables dummy para q funcione sin keys de momento, simulamos la carga:

    setTimeout(() => {
        loader.classList.add('hidden');
        appContainer.classList.remove('hidden');
        showScreen('auth');
    }, 1500);
});

function showScreen(screenId) {
    authScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');

    if (screenId === 'auth') authScreen.classList.remove('hidden');
    if (screenId === 'dashboard') {
        dashboardScreen.classList.remove('hidden');
        renderDashboard();
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
    // Aquí iría el código real de Firebase: signInWithEmailAndPassword
    // Simulación:
    userDisplay.textContent = emailInput.value.split('@')[0];
    userDisplay.classList.remove('hidden');
    authBtn.textContent = "Salir";
    showScreen('dashboard');
});

authBtn.addEventListener('click', () => {
    if (authBtn.textContent === "Salir") {
        // signOut(auth)
        userDisplay.classList.add('hidden');
        authBtn.textContent = "Iniciar Sesión";
        showScreen('auth');
    }
});

// --- Dashboard ---
function renderDashboard() {
    totalScoreEl.textContent = userData.totalScore;
    exercisesCompletedEl.textContent = userData.exercisesCompleted;

    categoriesGrid.innerHTML = '';
    categories.forEach((cat, index) => {
        const level = (userData.categoriesProgress && userData.categoriesProgress[cat.id]) ? userData.categoriesProgress[cat.id] : 1;
        const fillPercent = ((level) / cat.totalLevels) * 100;

        const card = document.createElement('div');
        card.className = 'category-card glass-panel';
        card.innerHTML = `
            <h3>${cat.name}</h3>
            <p>${cat.desc}</p>
            <div class="level-progress">
                <span>Nivel ${level}/${cat.totalLevels}</span>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${fillPercent}%"></div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => loadGameCategory(index, level));
        categoriesGrid.appendChild(card);
    });
}

// --- Flujo de Juego ---
function loadGameCategory(categoryIndex, level) {
    currentCategoryIndex = categoryIndex;
    currentLevelNum = level;
    sessionScore = 0;
    currentScoreEl.textContent = "0";
    showScreen('game');
    prepareLevel();
}

btnBack.addEventListener('click', () => {
    clearInterval(gameTimer);
    showScreen('dashboard');
});

function prepareLevel() {
    const cat = categories[currentCategoryIndex];
    if (currentLevelNum > cat.totalLevels) {
        gameTitle.textContent = "¡Categoría Completada!";
        gameInstructions.innerHTML = `<h3>¡Has completado los ${cat.totalLevels} niveles de neuroplasticidad!</h3><button id="btn-back-dash" class="btn btn-primary">Volver al Dashboard</button>`;
        document.getElementById('btn-back-dash').addEventListener('click', () => showScreen('dashboard'));
        gameContent.classList.add('hidden');
        gameFeedback.classList.add('hidden');
        gameInstructions.classList.remove('hidden');
        return;
    }

    try {
        currentGameConfig = cat.generateLevel(currentLevelNum);
    } catch (e) {
        console.error("Error generating level:", e);
    }

    gameTitle.textContent = `${cat.name} - Nivel ${currentLevelNum}`;
    document.getElementById('instruction-title').textContent = currentGameConfig.title;
    document.getElementById('instruction-text').textContent = currentGameConfig.instruction;

    gameContent.classList.add('hidden');
    gameFeedback.classList.add('hidden');
    gameInstructions.classList.remove('hidden');
}

btnStartLevel.addEventListener('click', () => {
    gameInstructions.classList.add('hidden');
    gameContent.classList.remove('hidden');
    gameContent.innerHTML = ''; // Limpiar
    startGamePlay();
});

btnNextLevel.addEventListener('click', () => {
    currentLevelNum++;
    // Guardar progreso simple
    if (!userData.categoriesProgress) userData.categoriesProgress = {};
    userData.categoriesProgress[categories[currentCategoryIndex].id] = currentLevelNum;
    userData.totalScore += 10;
    userData.exercisesCompleted++;
    saveProgress(); // Llamada real a firebase-config
    prepareLevel();
});

function endLevelSuccess() {
    clearInterval(gameTimer);
    sessionScore += 10;
    currentScoreEl.textContent = sessionScore;
    gameContent.classList.add('hidden');
    gameFeedback.classList.remove('hidden');
    document.getElementById('feedback-title').textContent = "¡Excelente Respuesta Cerebral!";
    document.getElementById('feedback-title').style.color = "var(--accent)";
    document.getElementById('feedback-text').textContent = "Has reforzado tus sinapsis. +10 Puntos.";
}

function endLevelFailure() {
    clearInterval(gameTimer);
    gameContent.classList.add('hidden');
    gameFeedback.classList.remove('hidden');
    document.getElementById('feedback-title').textContent = "Casi lo logras";
    document.getElementById('feedback-title').style.color = "#ef4444";
    document.getElementById('feedback-text').textContent = "La neuroplasticidad requiere repetición. ¡Inténtalo de nuevo!";
    btnNextLevel.textContent = "Reintentar Nivel";
    const oldFn = btnNextLevel.onclick;
    // Sobrescribir evento momentáneamente para reintentar
    btnNextLevel.onclick = () => {
        btnNextLevel.textContent = "Siguiente Nivel";
        btnNextLevel.onclick = oldFn; // Restaurar si había
        prepareLevel();
    };
}

// --- LÓGICA ESPECÍFICA DE CADA MOTOR DE JUEGO ---

function startGamePlay() {
    const type = currentGameConfig.type;

    if (type === 'find-odd-one') {
        playFindOddOne();
    } else if (type === 'simon-sequence') {
        playSimon();
    } else if (type === 'stroop') {
        playStroop();
    } else if (type === 'angle-match') {
        playAngleMatch();
    } else if (type === 'sequence-tap') {
        playSequenceTap();
    } else if (type === 'math-speed') {
        playMathSpeed();
    } else {
        gameContent.innerHTML = "<p>Ejercicio en desarrollo.</p>";
        setTimeout(endLevelSuccess, 2000);
    }
}

// 1. Atención Visual
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
            if (i === targetIdx) {
                cell.classList.add('active');
                setTimeout(endLevelSuccess, 500);
            } else {
                cell.style.background = "#ef4444";
                setTimeout(endLevelFailure, 500);
            }
        };
        grid.appendChild(cell);
    }

    // Timer logica si tiene cfg
    startTimer(currentGameConfig.timeLimit);
}

// 2. Control Inhibitorio (Stroop)
let stroopRounds = 0;
function playStroop() {
    gameContent.innerHTML = `
        <div id="stroop-text" class="stroop-word">PALABRA</div>
        <div class="button-row" id="stroop-buttons"></div>
    `;
    stroopRounds = currentGameConfig.rounds;
    nextStroopRound();
}

function nextStroopRound() {
    if (stroopRounds <= 0) return endLevelSuccess();

    const colors = currentGameConfig.colors;
    // Decidir si coinciden o no basado en probabilidad
    const match = Math.random() < currentGameConfig.matchProb;

    const trueColorObj = colors[Math.floor(Math.random() * colors.length)];
    let textWordObj = trueColorObj;

    if (!match && colors.length > 1) {
        textWordObj = colors[Math.floor(Math.random() * colors.length)];
        while (textWordObj.hex === trueColorObj.hex) {
            textWordObj = colors[Math.floor(Math.random() * colors.length)];
        }
    }

    const wordEl = document.getElementById('stroop-text');
    wordEl.textContent = textWordObj.name;
    wordEl.style.color = trueColorObj.hex;

    const btnRow = document.getElementById('stroop-buttons');
    btnRow.innerHTML = '';

    colors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline color-btn';
        btn.textContent = c.name;
        // El usuario debe clickear el COLOR de la tinta, que es trueColorObj
        btn.onclick = () => {
            if (c.hex === trueColorObj.hex) {
                stroopRounds--;
                nextStroopRound();
            } else {
                endLevelFailure();
            }
        };
        btnRow.appendChild(btn);
    });
}

// 3. Agilidad Mental
let mathRounds = 0;
function playMathSpeed() {
    mathRounds = currentGameConfig.rounds;
    gameContent.innerHTML = `
        <div class="stroop-word" id="math-eq">2 + 2 = ?</div>
        <div class="button-row" id="math-options"></div>
    `;
    nextMathRound();
}

function nextMathRound() {
    if (mathRounds <= 0) return endLevelSuccess();

    const op = currentGameConfig.ops[Math.floor(Math.random() * currentGameConfig.ops.length)];
    const num1 = Math.floor(Math.random() * currentGameConfig.maxNum) + 1;
    const num2 = Math.floor(Math.random() * currentGameConfig.maxNum) + 1;

    let answer = 0;
    if (op === '+') answer = num1 + num2;
    if (op === '-') answer = num1 - num2; // A veces negativo, no pasa nada
    if (op === '*') answer = num1 * num2;

    document.getElementById('math-eq').textContent = `${num1} ${op} ${num2} = ?`;

    // Generar 3 opciones
    let options = [answer, answer + Math.floor(Math.random() * 5) + 1, answer - Math.floor(Math.random() * 5) - 1];
    options.sort(() => Math.random() - 0.5);

    const btnRow = document.getElementById('math-options');
    btnRow.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline color-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            if (opt === answer) {
                mathRounds--;
                nextMathRound();
            } else {
                endLevelFailure();
            }
        };
        btnRow.appendChild(btn);
    });
}

// 4. Velocidad Procesamiento
let tapCurrentNum = 1;
function playSequenceTap() {
    const count = currentGameConfig.count;
    const gridCols = currentGameConfig.grid;
    tapCurrentNum = 1;

    gameContent.innerHTML = `<div class="grid-game" style="grid-template-columns: repeat(${gridCols}, 1fr)"></div>`;
    const grid = gameContent.querySelector('.grid-game');

    // Crear array y desordenar
    let nums = [];
    for (let i = 1; i <= count; i++) nums.push(i);
    nums.sort(() => Math.random() - 0.5);

    nums.forEach(n => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = n;
        cell.onclick = () => {
            if (n === tapCurrentNum) {
                cell.style.background = "var(--accent)";
                cell.style.color = "#000";
                tapCurrentNum++;
                if (tapCurrentNum > count) endLevelSuccess();
            } else {
                cell.style.background = "#ef4444";
                setTimeout(() => cell.style.background = "rgba(255,255,255,0.05)", 300);
                // No hay failure directo aquí, penaliza el tiempo
            }
        };
        grid.appendChild(cell);
    });
}

// Resto de juegos (Simon y Angle) se autocompletan triviales para el MVP:
function playSimon() {
    gameContent.innerHTML = `<p style="margin-top:40px; font-size: 1.2rem; color: var(--accent)">Simulación Completada Automáticamente.<br> Este motor generaría una grilla interactiva recordando <b>${currentGameConfig.sequenceLength}</b> pasos iluminados.<br><em>[Espacio para implementar secuencia iterativa en futura expansión]</em></p>`;
    setTimeout(endLevelSuccess, 2500);
}
function playAngleMatch() {
    gameContent.innerHTML = `<p style="margin-top:40px; font-size: 1.2rem; color: var(--accent)">Demostración de Ángulo Diferencial: <b>${currentGameConfig.angleDiff}º</b>.<br>El algoritmo dibujaría flechas en Canvas.<br><em>[Espacio para implementar motor Canvas]</em></p>`;
    setTimeout(endLevelSuccess, 2000);
}

// Utilidad Timer
function startTimer(seconds) {
    // Si queremos un UI visual
    if (seconds) {
        clearInterval(gameTimer);
        gameTimer = setTimeout(() => {
            endLevelFailure();
        }, seconds * 1000);
    }
}
