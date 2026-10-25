/* ====== SuperM1 - Test de la secuencia de la bandera (Game real) ======
   Carga la clase Game real y simula el bucle update() para verificar que al
   tocar la bandera el juego SIEMPRE completa (state -> 'win'), en cualquier
   postura en que Mario llegue (suelo, aire, escalinata, ya pasado el castillo,
   o con una secuencia anterior colgada). Uso: node flagtest.js
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* --- Simular el DOM minimo que necesita Game --- */
let drawCalls = 0;
const makeCtx = () => new Proxy({}, {
    get(t, prop) {
        if (prop === 'globalAlpha' || prop === 'fillStyle' || prop === 'font' || prop === 'textAlign') return 1;
        return (...args) => { drawCalls++; };
    },
    set() { return true; },
});
const makeEl = (id) => ({ id, classList: { add() {}, remove() {}, contains: () => false }, textContent: '' });
global.window = {
    addEventListener: () => {},
    requestAnimationFrame: (cb) => cb(performance.now() + 16),
    AudioContext: null, webkitAudioContext: null,
};
global.document = {
    getElementById: (id) => makeEl(id),
    createElement: () => ({ getContext: makeCtx, style: {} }),
};
global.performance = { now: () => Date.now() };
process.on('uncaughtException', (e) => { console.log('  !!! EXC:', e.message); process.exit(1); });

const jsDir = path.join(__dirname, 'js');
for (const f of ['sprites.js', 'input.js', 'physics.js', 'player.js',
                 'entities.js', 'level.js', 'audio.js', 'game.js']) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), { filename: f });
}
global.Game = Game; global.Player = Player; global.buildLevel1 = buildLevel1;

let failures = 0
function check(name, cond) {
    console.log(`  ${cond ? 'OK  ' : 'FAIL'} ${name}`);
    if (!cond) failures++;
}

/* Simula un Game hasta que gana o se agota el tiempo. */
function simulate(setup, capMs = 2500) {
    const canvas = { width: 800, height: 480, getContext: makeCtx };
    const game = new Game(canvas);
    game.state = 'playing';
    game.player.flagReached = false;
    game.player.inputLocked = false;
    game.flagSeq = null;
    setup(game);

    return new Promise((resolve) => {
        const start = Date.now();
        let frames = 0;
        const tick = () => {
            if (frames++ > 900) return resolve(game);
            game.update(1 / 60);
            game.render();          // ejercita renderCastle / renderFlag / textos
            if (game.state !== 'playing') return resolve(game);
            if (Date.now() - start > capMs) return resolve(game);
            setTimeout(tick, 8);
        };
        tick();
    });
}

(async () => {
    const L = buildLevel1();
    console.log('=== SECUENCIA DE LA BANDERA (Game real) ===');
    console.log(`  floorY=${L.floorY}  flagX=${L.flagX}  castleX=${L.castleX}  castleX-20=${L.castleX - 20}`);

    const scenarios = [
        ['pequeno por el suelo',       (g) => { g.player.x = L.flagX - 20; g.player.y = L.floorY - 28; }],
        ['grande por el suelo',        (g) => { g.player.x = L.flagX - 20; g.player.y = L.floorY - 52; }],
        ['en el aire subiendo',        (g) => { g.player.x = L.flagX - 8;  g.player.y = L.floorY - 80; g.player.vy = -4; }],
        ['en el aire cayendo',         (g) => { g.player.x = L.flagX - 6;  g.player.y = L.floorY - 50; g.player.vy = 3; }],
        ['ya paso hacia el castillo',  (g) => { g.player.x = L.castleX - 30; g.player.y = L.floorY - 28; }],
        ['ya paso el castillo',        (g) => { g.player.x = L.castleX + 20; g.player.y = L.floorY - 28; }],
        ['secuencia previa colgada',   (g) => { g.player.x = L.flagX - 10; g.player.y = L.floorY - 28; g.player.flagReached = true; g.flagSeq = { t: 10, done: false }; }],
    ];

    for (const [name, setup] of scenarios) {
        const g = await simulate(setup);
        // Con el encadenado, completar el 1-1 pasa al nivel 2 (playing) en lugar
        // de ganar: ambas son formas validas de "completar la secuencia".
        const advanced = g.state === 'playing' && g.currentLevel === 2;
        const won = g.state === 'win' && g.currentLevel === 2;
        const completed = advanced || won;
        const noLock = !g.player.inputLocked || completed;
        console.log(`  ${completed ? 'CORRECTO' : 'FALLA  '} ${name}  (state=${g.state}, nivel ${g.currentLevel})`);
        check(`  -> completa la secuencia`, completed);
        check(`  -> no deja bloqueado`, noLock);
    }

    /* --- 2. Animacion: fases, descenso del banderin, congelacion del mundo --- */
    console.log('\n=== ANIMACION DE LA META ===');
    {
        const canvas = { width: 800, height: 480, getContext: makeCtx };
        const g = new Game(canvas);
        g.state = 'playing';
        g.currentLevel = 2;      // ultimo nivel: al completar el 1-1, gana (no salta al 2)
        g.player.x = L.flagX - 10;
        g.player.y = L.floorY - 28;

        const phases = [];
        const flagYs = [];
        const enemyX = () => (g.entities[0] ? g.entities[0].x : null);
        let enemyStart = null;
        let frozeWorld = true;

        for (let i = 0; i < 900 && g.state === 'playing'; i++) {
            g.update(1 / 60);
            g.render();
            if (g.flagSeq) {
                if (phases[phases.length - 1] !== g.flagSeq.phase) phases.push(g.flagSeq.phase);
                flagYs.push(g.flagSeq.flagY);
                if (enemyStart === null) enemyStart = enemyX();
                else if (enemyX() !== null && enemyX() !== enemyStart) frozeWorld = false;
            }
        }

        console.log(`  fases: ${phases.join(' -> ')}`);
        console.log(`  banderin: y ${flagYs[0]} -> ${flagYs[flagYs.length - 1]}`);

        const expected = ['grab', 'slide', 'hop', 'walk', 'enter'];
        check('recorre las 5 fases en orden', phases.join(',') === expected.join(','));
        check('el banderin desciende', flagYs[flagYs.length - 1] > flagYs[0] + 100);
        check('el banderin llega abajo', Math.abs(flagYs[flagYs.length - 1] - g.flagEndY()) < 1);
        check('el banderin nunca sube', flagYs.every((y, i) => i === 0 || y >= flagYs[i - 1]));
        check('el mundo se congela (enemigos quietos)', frozeWorld);
        check('gana al completar el ultimo nivel', g.state === 'win' && g.currentLevel === 2);
    }

    /* --- 3. Puntos: crecen con la altura del agarre --- */
    console.log('\n=== PUNTOS POR ALTURA AL AGARRAR ===');
    {
        const scoreAt = (y) => {
            const canvas = { width: 800, height: 480, getContext: makeCtx };
            const g = new Game(canvas);
            g.state = 'playing';
            g.currentLevel = 2;   // ultimo nivel: no salta al 2 al completar
            g.score = 0;
            g.player.x = L.flagX - 10;
            g.player.y = y;
            g.update(1 / 60);
            return g.score;
        };
        // Desde el suelo (agarre mas bajo) hasta casi la cima del asta
        const ys = [];
        for (let y = L.floorY - 28; y > L.poleTopY; y -= 40) ys.push(y);
        const scores = ys.map(scoreAt);
        console.log('  ' + ys.map((y, i) => `y=${y}:${scores[i]}pts`).join('  '));

        const lo = scores[0];
        const hi = scores[scores.length - 1];
        const monotonic = scores.every((s, i) => i === 0 || s >= scores[i - 1]);
        check('los puntos crecen al agarrar mas alto', monotonic);
        check('la diferencia alto/bajo es grande', hi >= 4 * lo);
        check('el maximo no pasa de 5000', Math.max(...scores) <= 5000);
    }

    /* --- 4. Agarrar el asta muy abajo: el banderin debe animarse igual --- */
    console.log('\n=== AGARRE BAJO: EL BANDERIN TAMBIEN SE ANIMA ===');
    {
        const canvas = { width: 800, height: 480, getContext: makeCtx };
        const g = new Game(canvas);
        g.state = 'playing';
        g.currentLevel = 2;   // ultimo nivel: al completar gana
        g.player.x = L.flagX - 10;
        g.player.y = L.floorY - 28;   // agarre a nivel de suelo

        const flagYs = [];
        for (let i = 0; i < 900 && g.state === 'playing'; i++) {
            g.update(1 / 60);
            if (g.flagSeq) flagYs.push(g.flagSeq.flagY);
        }
        console.log(`  banderin: y ${flagYs[0]} -> ${flagYs[flagYs.length - 1]}  (state=${g.state})`);
        check('el banderin recorre su trayectoria', flagYs[flagYs.length - 1] - flagYs[0] > 100);
        check('tarda un rato en bajar (no es instantaneo)', flagYs.length > 40);
        check('gana al completar el ultimo nivel', g.state === 'win' && g.currentLevel === 2);
    }

    console.log(failures === 0 ? '\n=== TODAS LAS PRUEBAS DE BANDERA PASARON ===' : `\n=== ${failures} FALLOS ===`);
    process.exit(failures === 0 ? 0 : 1);
})();