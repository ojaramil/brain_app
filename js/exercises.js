// === MOTOR DE GENERACIÓN DE EJERCICIOS (60 NIVELES EN TOTAL) ===
// Inspirado en los principios de Norman Doidge: repetición progresiva, discriminación fina y atención focal.
// Recomendado para neuroplasticidad general y estructurado para no sobreestimular (espectro autista).

export const categories = [
    {
        id: 'visual-attention',
        name: 'Atención Visual Focalizada',
        desc: 'Mejora la capacidad de detectar diferencias sutiles (discriminación fina).',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            // Level 1: grid 3x3, Level 10: grid 6x6. Más nivel, caracteres más parecidos.
            let gridSize = Math.min(3 + Math.floor(levelNum / 3), 6);
            let targetCount = gridSize * gridSize;
            let options = [
                ['O', 'Q'], ['1', 'I'], ['E', 'F'], ['M', 'N'], ['b', 'd'], ['p', 'q']
            ];
            // Niveles más altos usan letras confusas
            let pairIndex = Math.min(Math.floor((levelNum - 1) / 2), options.length - 1);
            let [baseChar, targetChar] = options[pairIndex];

            return {
                type: 'find-odd-one',
                title: `Encuentra la letra "${targetChar}"`,
                instruction: `Haz clic en la única "${targetChar}" escondida entre las "${baseChar}".`,
                grid: gridSize,
                targetIndex: Math.floor(Math.random() * targetCount),
                baseChar,
                targetChar,
                timeLimit: Math.max(20 - levelNum, 5) // El tiempo disminuye
            };
        }
    },
    {
        id: 'working-memory',
        name: 'Memoria de Trabajo Secuencial',
        desc: 'Refuerza la memoria a corto plazo recordando secuencias de patrones.',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            // Level 1: 3 items, Level 10: 7 items. Grid size increases.
            let sequenceLength = Math.min(3 + Math.floor(levelNum / 2), 8);
            let displayTime = Math.max(1000 - (levelNum * 50), 300); // ms por item, más rápido al subir de nivel

            return {
                type: 'simon-sequence',
                title: `Recuerda la Secuencia de ${sequenceLength} pasos`,
                instruction: 'Observa el patrón iluminado y repítelo en el mismo orden.',
                sequenceLength,
                displayTime,
                grid: 4 // Grid 2x2 para todos los niveles por ahora para mantener simpleza visual
            };
        }
    },
    {
        id: 'inhibitory-control',
        name: 'Control Inhibitorio (Stroop)',
        desc: 'Entrena al cerebro para suprimir respuestas automáticas y fomentar el control cognitivo.',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            // Niveles altos: menos tiempo, más colores, más probabilidad de que texto y color de fuente no coincidan.
            let colors = [
                { name: 'Rojo', hex: '#ef4444' },
                { name: 'Azul', hex: '#3b82f6' },
                { name: 'Verde', hex: '#10b981' },
                { name: 'Amarillo', hex: '#f59e0b' },
                { name: 'Púrpura', hex: '#8b5cf6' }
            ];
            // Limitar colores al principio
            let activeColors = colors.slice(0, Math.min(3 + Math.floor(levelNum / 3), colors.length));
            let rounds = 5 + Math.floor(levelNum / 2);
            let timeLimit = Math.max(5000 - (levelNum * 300), 1500); // Tiempo por ronda

            return {
                type: 'stroop',
                title: 'Desafío de Colores',
                instruction: 'Selecciona el COLOR en el que está escrita la palabra, ignorando lo que dice el texto.',
                rounds,
                colors: activeColors,
                timeLimit,
                matchProb: Math.max(0.5 - (levelNum * 0.04), 0.1) // Menos probabilidad de que coincidan a niveles altos
            };
        }
    },
    {
        id: 'sensory-discrimination',
        name: 'Discriminación por Orientación',
        desc: 'Aumenta la plasticidad de los mapas topográficos visuales distinguido rotaciones.',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            // Determinar si una flecha punta hacia el mismo lugar que la flecha objetivo.
            // Más nivel = ángulos más similares.
            let angleDiff = Math.max(90 - (levelNum * 8), 10);
            let rounds = 5 + Math.floor(levelNum / 2);
            let timeLimit = Math.max(10 - (levelNum * 0.5), 3); // Segundos

            return {
                type: 'angle-match',
                title: 'Alineación Precisa',
                instruction: 'Indica si la flecha de la derecha tiene la misma inclinación que la de la izquierda.',
                rounds,
                angleDiff, // El distractor difiere por este ángulo
                timeLimit
            };
        }
    },
    {
        id: 'processing-speed',
        name: 'Velocidad de Procesamiento',
        desc: 'Enseña al cerebro a procesar información más rápido mediante barridos visuales directos.',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            // Tocar los números en orden del 1 al N lo más rápido posible.
            let count = Math.min(9 + Math.floor(levelNum * 1.5), 25);

            return {
                type: 'sequence-tap',
                title: 'Conexión Numérica Rápida',
                instruction: `Haz clic en los números en orden ascendente (del 1 al ${count}).`,
                count,
                grid: Math.ceil(Math.sqrt(count))
            };
        }
    },
    {
        id: 'mental-agility',
        name: 'Agilidad Mental y Matemáticas',
        desc: 'Activa el córtex prefrontal con cálculos rápidos bajo límite de tiempo.',
        totalLevels: 10,
        generateLevel: (levelNum) => {
            let ops = ['+'];
            if (levelNum > 3) ops.push('-');
            if (levelNum > 7) ops.push('*');

            let maxNum = 5 + (levelNum * 2);
            let rounds = 5 + levelNum;
            let timeLimit = Math.max(10 - levelNum * 0.5, 3);

            return {
                type: 'math-speed',
                title: 'Cálculo Rápido',
                instruction: 'Resuelve las operaciones lo más rápido posible antes de que acabe el tiempo.',
                ops,
                maxNum,
                rounds,
                timeLimit
            };
        }
    }
];
