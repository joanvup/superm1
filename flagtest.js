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
const makeCtx = () => new Proxy({}, { get: () => () => {} });
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
        const won = g.state === 'win';
        const noLock = !g.player.inputLocked || won;
        console.log(`  ${won ? 'CORRECTO' : 'FALLA  '} ${name}  (state=${g.state})`);
        check(`  -> termina en win`, won);
        check(`  -> no deja bloqueado`, noLock);
    }

    console.log(failures === 0 ? '\n=== TODAS LAS PRUEBAS DE BANDERA PASARON ===' : `\n=== ${failures} FALLOS ===`);
    process.exit(failures === 0 ? 0 : 1);
})();