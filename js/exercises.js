// === MOTOR DE GENERACIÓN DE EJERCICIOS (12 + 10 = 22 Juegos, 220 Niveles) ===
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
                    let arrowsCount = 3 + (Math.floor(levelNum / 4) * 2);
                    return { type: 'flanker', instruction: '¿Hacia dónde apunta la flecha del CENTRO?', rounds: 5 + Math.floor(levelNum / 2), arrows: arrowsCount, limitTime: Math.max(4 - levelNum * 0.2, 1) };
                }
            },
            // NUEVO 1
            {
                id: 'letter-search',
                name: 'Búsqueda Cruzada',
                desc: 'Encuentra todas las vocales dispersas en un mar de caracteres cruzados.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'letter-search', instruction: 'Toca todas las A, E, I, O, U rápido.', level: levelNum, grid: Math.min(4 + Math.floor(levelNum / 2), 6), targetsNum: 2 + Math.floor(levelNum / 2) };
                }
            },
            // NUEVO 2
            {
                id: 'go-no-go',
                name: 'Reacción Selectiva (Go/No-Go)',
                desc: 'Reacciona al estímulo verde, pero frena tus impulsos con el rojo.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'go-no-go', instruction: 'Toca el círculo si es VERDE. NO lo toques si es ROJO.', rounds: 5 + levelNum, timeLimit: Math.max(1.5 - (levelNum * 0.08), 0.5) };
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
                    let gridSquare = Math.min(3 + Math.floor(levelNum / 3), 5);
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
                    let n = levelNum < 5 ? 1 : 2;
                    return { type: 'n-back', instruction: `¿Esta forma es igual a la de hace ${n} paso(s)?`, nBack: n, rounds: 6 + levelNum, limitTime: Math.max(3 - levelNum * 0.1, 1.5) };
                }
            },
            // NUEVO 3
            {
                id: 'memory-match',
                name: 'Pares Ocultos',
                desc: 'Juego clásico de encontrar pares para reforzar recuerdo espacial.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    let pairs = levelNum < 4 ? 3 : (levelNum < 7 ? 6 : 8);
                    return { type: 'memory-match', instruction: 'Encuentra todos los pares idénticos.', pairs: pairs };
                }
            },
            // NUEVO 4
            {
                id: 'reverse-simon',
                name: 'Secuencia Inversa',
                desc: 'Desafía tu memoria repitiendo el patrón hacia ATRÁS.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'reverse-simon', instruction: 'Observa y repite la secuencia al revés (desde el último hasta el primero).', sequenceLength: 2 + Math.floor(levelNum / 2), grid: (levelNum > 6) ? 3 : 2, displayTime: Math.max(900 - (levelNum * 50), 400) };
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
            },
            // NUEVO 5
            {
                id: 'target-clicker',
                name: 'Tiro al Blanco',
                desc: 'Toca los objetos dinámicos antes de que desaparezcan de tu periferia.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'target-clicker', instruction: 'Toca todos los círculos antes de que desaparezcan.', rounds: 5 + levelNum, timeLimit: Math.max(1500 - (levelNum * 100), 500) };
                }
            },
            // NUEVO 6
            {
                id: 'dual-task',
                name: 'Tarea Dual Dividida',
                desc: 'Presta atención a dos datos disonantes al mismo tiempo en milisegundos.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'dual-task', instruction: '¿Es la letra una Vocal Y el número es Par?', rounds: 5 + Math.floor(levelNum / 2) };
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
            },
            // NUEVO 7
            {
                id: 'number-pattern',
                name: 'Patrones Lógicos',
                desc: 'Adivina qué número continúa en la secuencia matemática.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'number-pattern', instruction: '¿Qué número lógica la secuencia?', rounds: 3 + Math.floor(levelNum / 2), level: levelNum };
                }
            },
            // NUEVO 8
            {
                id: 'logic-balance',
                name: 'Silogismos Abstractos',
                desc: 'Analiza oraciones lógicas para definir conclusiones ciertas o falsas.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'logic-balance', instruction: 'Lee la premisa y decide si la deducción es correcta.', rounds: 3 + Math.floor(levelNum / 2), level: levelNum };
                }
            }
        ]
    },
    // NUEVA CATEGORÍA - INTELIGENCIA EMOCIONAL Y SOCIAL
    {
        id: 'category-social',
        name: 'Habilidades Sociales',
        desc: 'Herramientas para la lectura de rostros, empatía visual e inteligencia emocional.',
        icon: '🤝',
        games: [
            // NUEVO 9
            {
                id: 'emotion-match',
                name: 'Empatía y Lectura Emocional',
                desc: 'Identifica la emoción correcta del rostro que corresponda a la indicación.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'emotion-match', instruction: 'Selecciona el rostro que corresponda con la emoción escrita.', rounds: 5 + Math.floor(levelNum / 2) };
                }
            },
            // NUEVO 10
            {
                id: 'face-memory',
                name: 'Memoria de Rastros',
                desc: 'Memoriza la cara mostrada por un segundo y encuéntrala nuevamente.',
                totalLevels: 10,
                generateLevel: (levelNum) => {
                    return { type: 'face-memory', instruction: 'Memoriza el rostro antes de que desaparezca y encuéntralo en el grupo.', rounds: 4 + Math.floor(levelNum / 2), displayTime: Math.max(1200 - (levelNum * 80), 300) };
                }
            }
        ]
    }
];
