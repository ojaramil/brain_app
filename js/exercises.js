// === MOTOR DE GENERACIÓN DE EJERCICIOS (12 Baterías, 10 Niveles c/u = 120 Ejercicios) ===
// Inspirado en BrainHQ y The Brain's Way of Healing. Fomenta la neuroplasticidad mediante
// especificidad, repetición y aumento progresivo de exigencia.

export const categories = [
    {
        id: 'category-attention',
        name: 'Atención y Enfoque',
        desc: 'Mejora la capacidad de concentrarte y filtrar distracciones.',
        icon: '🎯',
        games: [
            {
                id: 'find-odd-one',
                name: 'Discriminación Fina',
                desc: 'Encuentra la letra sutilmente diferente entre distractores.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let gridSize = Math.min(3 + Math.floor(levelNum / 3), 6);
                    let targetCount = gridSize * gridSize;
                    let options = [['O', 'Q'], ['1', 'I'], ['E', 'F'], ['M', 'N'], ['b', 'd'], ['p', 'q']];
                    let pairIndex = Math.min(Math.floor((levelNum - 1) / 2), options.length - 1);
                    let [baseChar, targetChar] = options[pairIndex];
                    return { type: 'find-odd-one', instruction: `Encuentra la única "${targetChar}".`, grid: gridSize, targetIndex: Math.floor(Math.random() * targetCount), baseChar, targetChar, timeLimit: Math.max(15 - levelNum, 5) };
                }
            },
            {
                id: 'stroop',
                name: 'Control Inhibitorio',
                desc: 'Ignora el texto y selecciona el COLOR de la tinta.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let colors = [{ name: 'Rojo', hex: '#ef4444' }, { name: 'Azul', hex: '#3b82f6' }, { name: 'Verde', hex: '#10b981' }, { name: 'Amarillo', hex: '#f59e0b' }, { name: 'Púrpura', hex: '#8b5cf6' }];
                    let activeColors = colors.slice(0, Math.min(3 + Math.floor(levelNum / 3), colors.length));
                    return { type: 'stroop', instruction: 'Selecciona el COLOR de la tinta, no lo que dice el texto.', rounds: 3 + Math.floor(levelNum / 2), colors: activeColors, matchProb: Math.max(0.4 - (levelNum * 0.03), 0.1) };
                }
            },
            {
                id: 'flanker',
                name: 'Atención Selectiva',
                desc: 'Identifica la dirección de la flecha central e ignora las de los lados.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let arrowsCount = 3 + (Math.floor(levelNum / 4) * 2); // 3, 5 o 7 flechas
                    return { type: 'flanker', instruction: '¿Hacia dónde apunta la flecha del CENTRO?', rounds: 5 + Math.floor(levelNum / 2), arrows: arrowsCount, limitTime: Math.max(4 - levelNum * 0.2, 1) };
                }
            }
        ]
    },
    {
        id: 'category-memory',
        name: 'Memoria y Retención',
        desc: 'Refuerza la memoria de trabajo a corto plazo y el registro espacial.',
        icon: '🧠',
        games: [
            {
                id: 'simon-sequence',
                name: 'Secuencia Sonora',
                desc: 'Repite el patrón de cuadrículas iluminadas en el mismo orden.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'simon-sequence', instruction: 'Observa y repite la misma secuencia.', sequenceLength: 2 + Math.floor(levelNum / 1.5), grid: (levelNum > 5) ? 3 : 2, displayTime: Math.max(800 - (levelNum * 50), 300) };
                }
            },
            {
                id: 'pattern-recall',
                name: 'Recall Visual',
                desc: 'Memoriza la posición de los bloques en la cuadrícula.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let gridSquare = Math.min(3 + Math.floor(levelNum / 3), 5); // 3x3, 4x4, 5x5
                    let activeBlocks = 2 + Math.floor(levelNum / 1.5);
                    return { type: 'pattern-recall', instruction: 'Memoriza las posiciones iluminadas.', grid: gridSquare, blocks: activeBlocks, displayTime: Math.max(2000 - (levelNum * 100), 700) };
                }
            },
            {
                id: 'n-back',
                name: 'N-Back Constante',
                desc: 'Determina si la forma actual es igual a la anterior.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let n = levelNum < 5 ? 1 : 2; // 1-back luego 2-back
                    return { type: 'n-back', instruction: `¿Esta forma es igual a la de hace ${n} paso(s)?`, nBack: n, rounds: 6 + levelNum, limitTime: Math.max(3 - levelNum * 0.1, 1.5) };
                }
            }
        ]
    },
    {
        id: 'category-speed',
        name: 'Velocidad Cerebral',
        desc: 'Acelera el procesamiento visual y la velocidad de respuesta neuronal.',
        icon: '⚡',
        games: [
            {
                id: 'sequence-tap',
                name: 'Conexión Numérica',
                desc: 'Haz clic en los números en orden ascendente lo más rápido posible.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let count = Math.min(5 + Math.floor(levelNum * 2), 25);
                    return { type: 'sequence-tap', instruction: `Toca los números en orden del 1 al ${count}.`, count: count, grid: Math.ceil(Math.sqrt(count)) };
                }
            },
            {
                id: 'fast-compare',
                name: 'Comparación Rápida',
                desc: 'Indica si las dos formas en pantalla son idénticas.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'fast-compare', instruction: '¿Son ESTRICTAMENTE idénticos?', rounds: 8 + Math.floor(levelNum / 2), diffProb: 0.5, complexShapes: levelNum > 4, limitTime: Math.max(3 - levelNum * 0.2, 0.8) };
                }
            },
            {
                id: 'visual-sweep',
                name: 'Barridos Visuales',
                desc: 'Identifica si el barrido visual ocurre hacia adentro o hacia afuera.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'visual-sweep', instruction: '¿Las barras convergen (juntas) o divergen (se separan)?', rounds: 5 + Math.floor(levelNum / 2), limitTime: Math.max(2 - levelNum * 0.1, 0.5) };
                }
            }
        ]
    },
    {
        id: 'category-logic',
        name: 'Inteligencia y Lógica',
        desc: 'Activa el córtex prefrontal con cálculos rápidos y flexibilidad cognitiva.',
        icon: '🧩',
        games: [
            {
                id: 'math-speed',
                name: 'Agilidad Matemática',
                desc: 'Resuelve las operaciones aritméticas contrarreloj.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let ops = ['+']; if (levelNum > 3) ops.push('-'); if (levelNum > 7) ops.push('*');
                    return { type: 'math-speed', instruction: 'Elige el resultado correcto rápido.', ops: ops, maxNum: 5 + (levelNum * 3), rounds: 4 + Math.floor(levelNum / 2) };
                }
            },
            {
                id: 'angle-match',
                name: 'Rotación Espacial',
                desc: 'Determina si la forma de la derecha está rotada o reflejada (diferente).',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'angle-match', instruction: '¿Tienen la misma forma sin importar si está rotada?', rounds: 5 + Math.floor(levelNum / 2), level: levelNum };
                }
            },
            {
                id: 'rule-switch',
                name: 'Cambio de Regla',
                desc: 'Sigue la regla indicada (Color o Forma) que cambia repentinamente.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let ruleChangeFreq = Math.max(5 - Math.floor(levelNum / 3), 2);
                    return { type: 'rule-switch', instruction: 'Presta atención a la regla en pantalla (Forma o Color).', rounds: 8 + Math.floor(levelNum / 2), ruleFreq: ruleChangeFreq };
                }
            }
        ]
    }
];
