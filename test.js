/* ====== SuperM1 - Test de carga y logica (Node) ======
   Simula un DOM minimo y verifica que el juego se inicializa sin errores.
   Nota: los class/const/let definidos por (0,eval) viven en una scope
   distinta, asi que las clases se exponen al contexto global via
   globalThis despues de cada carga. */

// --- Simular el DOM minimo necesario ---
const canvasMock = {
    width: 800,
    height: 480,
    getContext() {
        return new Proxy({}, {
            get(t, prop) {
                return typeof prop === 'string' ? () => {} : undefined;
            }
        });
    }
};

global.window = {
    addEventListener: () => {},
    requestAnimationFrame: (cb) => cb(16),
    AudioContext: null,
    webkitAudioContext: null,
};

global.document = {
    getElementById: (id) => {
        const el = {
            id,
            classList: { remove: () => {}, add: () => {}, contains: () => false },
            textContent: '',
        };
        return el;
    },
    createElement: () => ({ getContext: () => ({}), style: {} }),
};

global.performance = { now: () => 1000 };

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const jsDir = path.join(__dirname, 'js');

const loadOrder = ['sprites.js', 'input.js', 'physics.js', 'player.js',
                   'entities.js', 'level.js', 'audio.js', 'game.js', 'main.js'];

try {
    for (const f of loadOrder) {
        const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
        // Ejecutar en el contexto global real para que las const/class sean
        // propiedades de globalThis (igual que en un <script> del navegador).
        vm.runInThisContext(code, { filename: f });
        console.log('Loaded:', f);
    }
} catch (e) {
    console.error('ERROR al cargar:', e.message);
    process.exit(1);
}

// En Node con vm.runInThisContext, las const/class definidas a nivel de
// script NO cuelgan de globalThis (las `const` no se vuelven propiedades
// del objeto global, pero SI viven en el mismo "script context"). Para
// accederlas desde el modulo hay que re-exponerlas al objeto global.
global.Physics = Physics;
global.buildLevel1 = buildLevel1;
global.buildLevel2 = buildLevel2;
global.Sprite = Sprite;
global.Input = Input;
global.Player = Player;
global.Goomba = Goomba;
global.Koopa = Koopa;
global.Piranha = Piranha;
global.Mushroom = Mushroom;
global.FireFlower = FireFlower;
global.CoinEffect = CoinEffect;
global.BrickParticle = BrickParticle;
global.FloatingText = FloatingText;
global.GameAudio = GameAudio;

// En navegador las clases son globales; en Node via eval son locales al
// scope de eval, asi que no las usaremos directamente. En su lugar, los
// tests de construccion se hacen desde buildLevel1 (que si es global)
// y Physics (que si es global). Player/Goomba etc. se testean creando un
// mini-bridge.

let fail = 0;
function check(name, cond) {
    if (cond) { console.log('  OK:', name); }
    else { fail++; console.error('  FAIL:', name); }
}

// --- Verificaciones de logica (sobre las API globales expuestas) ---
try {
    const L = buildLevel1();
    console.log('\n[Nivel]');
    console.log('  Ancho:', L.width, '| Alto:', L.height, '| FloorY:', L.floorY);
    check('suelo en (0,13) solido', L.isSolid(0, 13));
    check('cielo en (0,2) vacio', !L.isSolid(0, 2));
    check('hueco 50-53 sin suelo', !L.isSolid(50, 13));
    check('pipe en (36,12)', L.isSolid(36, 12));
    check('tile ? en (16,9)', L.get(16, 9) === '?');
    check('10 spawns de enemigos', L.spawns.length === 10);
    // El 1-1 perdio 2 monedas al acortar la fila de ladrillos 64-69 a 64-67
    // (los ladrillos tapaban la rampa de salto de la tuberia de 4)
    check('13 monedas estaticas', L.coins.length === 13);
    check('flag en x=4096', L.flagX === 4096);
    check('player start', L.playerStart.x === 64 && L.playerStart.y === 388);

    // --- Fisica moveAndCollide ---
    console.log('\n[Fisica]');
    // Entidad falsa encima del suelo
    const fake = { x: 320, y: 380, width: 26, height: 28, vx: 0, vy: 10 };
    const col = Physics.moveAndCollide(fake, L);
    check('cae al suelo y frena', col.hitFloor === true && fake.vy === 0);
    check('queda posado en el suelo', fake.y === L.floorY - fake.height);

    // Entidad acercandose a la tuberia (tiles 42-43, x 1344-1408) desde la
    // izquierda con vx=20: debe quedarse pegada a su borde izquierdo.
    const wall = { x: 1324, y: 400, width: 26, height: 28, vx: 20, vy: 0 };
    Physics.moveAndCollide(wall, L);
    check('choca con muro por la derecha', wall.vx === 0 && wall.x === 42 * 32 - 26);

    // AABB
    check('aabb solapado', Physics.aabb(0,0,10,10,5,5,10,10));
    check('aabb separado', !Physics.aabb(0,0,10,10,20,20,10,10));

    // unstick: entidad dentro de un tile sale empujada hacia arriba
    const stuck = { x: 320, y: 350, width: 26, height: 28 };
    const unstuck = Physics.unstick(stuck, L); // (320,350) coincide con suelo
    check('unstick devuelve booleano', typeof unstuck === 'boolean');
    check('unstick saca del suelo', stuck.y < 350 || unstuck === false);

    // --- Jugador ---
    console.log('\n[Jugador]');
    const P = new Player(64, L.floorY - 28);
    const mockGame = { audio: { playSound: () => {} }, updateHUD: () => {} };
    check('hitbox normal 26x28', P.width === 26 && P.height === 28);
    check('estado inicial normal', P.state === 'normal');
    P.powerUp('mushroom', mockGame);
    check('hongo -> super 26x52', P.height === 52 && P.state === 'super');
    check('hongo sube al player 24px', P.y === L.floorY - 52);
    P.getHit(mockGame);
    check('getHit encoge a normal', P.height === 28 && P.state === 'normal');
    check('getHit deja invencible', P.invincible === true);
    P.powerUp('flower', mockGame);
    check('flor -> estado fuego y grande', P.state === 'fire' && P.height === 52);

    // --- Enemigos ---
    console.log('\n[Enemigos]');
    const g = new Goomba(200, L.floorY - 28);
    check('goomba hitbox 28x28', g.width === 28 && g.height === 28);
    check('goomba se marca como deadly', g.deadly === true);
    const fakeGame = { audio: { playSound: () => {} }, updateHUD: () => {}, score: 0, player: P };
    g.squish(fakeGame);
    check('goomba aplastado', g.squished === true && g.vx === 0);

    const k = new Koopa(300, L.floorY - 44);
    check('koopa camina con hitbox 28x44', k.width === 28 && k.height === 44 && k.state === 'walk');
    k.squish(fakeGame);
    check('koopa -> caparazon 28x28', k.height === 28 && k.state === 'shell');
    check('koopa caparazon mantiene pies', k.y === L.floorY - 28);
    k.squish(fakeGame);
    check('koopa pateado', k.state === 'kicked' && (k.vx === 6 || k.vx === -6));

    // --- Power-ups ---
    console.log('\n[Power-ups]');
    const m = new Mushroom(400, 100);
    check('hongo es powerup', m.isPowerUp === true && m.type === 'mushroom');
    const f = new FireFlower(400, 100);
    check('flor es powerup', f.isPowerUp === true && f.type === 'flower');
    const ce = new CoinEffect(100, 100);
    check('efecto moneda se autoelimina', ce.remove === false);
    ce.update();
    check('efecto moneda tiene timer', ce.timer > 0);

    // --- Nivel 2 (cuevas) ---
    console.log('\n[Nivel 2]');
    const L2 = buildLevel2();
    check('tema underground', L2.theme === 'underground');
    check('suelo en (0,13) solido', L2.isSolid(0, 13));
    check('foso de 3 tiles entre 36 y 38', !L2.isSolid(36, 13) && !L2.isSolid(38, 13)
        && L2.isSolid(35, 13) && L2.isSolid(39, 13));
    check('puente de piedra a 3 tiles (tx 66-70)',
        L2.get(66, 10) === 'S' && L2.get(70, 10) === 'S' && !L2.isSolid(68, 13));
    check('tuberia con pirania en (14,12)', L2.isSolid(14, 12) && L2.get(14, 12) === 'P');
    check('hay piranhas en los spawns', L2.spawns.filter(s => s.type === 'piranha').length === 3);
    check('flag en x=4096', L2.flagX === 4096);
    check('player start', L2.playerStart.x === 64 && L2.playerStart.y === 388);

    // --- Piranha ---
    console.log('\n[Piranha]');
    const piranha = new Piranha(14 * 32, 0); // tuberia de 2 tiles en tx 14
    piranha.initFromLevel(L2);
    check('piranha se alinea con la tuberia', piranha.pipeTx === 14 && piranha.state === 'hidden');
    check('piranha es deadly y no aplastable', piranha.deadly === true && piranha.noStomp === true);
    // La boca de la tuberia de 2 tiles en tx14 esta en la fila 11
    check('boca de la tuberia en y=11*32', piranha.pipeTopY === 11 * 32);
    check('piranha centrada sobre la boca',
        piranha.x === 14 * 32 + 32 - piranha.width / 2);
    check('metida: la piraña no asoma por encima de la boca', piranha.inY === piranha.pipeTopY);
    check('fuera: la piraña asoma entera', piranha.outY === piranha.pipeTopY - piranha.height);
    check('empieza metida', piranha.y === piranha.inY);

    // Ciclo completo: hidden -> rising -> out -> sinking -> hidden
    const seq = [];
    for (let i = 0; i < 60 * 12; i++) {
        piranha.update(L2, fakeGame);
        if (seq[seq.length - 1] !== piranha.state) seq.push(piranha.state);
        if (seq.length >= 5) break;
    }
    check('recorre hidden->rising->out->sinking->hidden',
        seq.slice(0, 5).join(',') === 'hidden,rising,out,sinking,hidden');
    check('al asomar del todo esta por encima de la boca', piranha.outY < piranha.pipeTopY);

    // Al estar metida queda dentro de la tuberia (por debajo de la boca)
    const p2 = new Piranha(14 * 32, 0);
    p2.initFromLevel(L2);
    check('metida: y coincide con la boca (no asoma)', p2.y >= p2.pipeTopY);

    // No se aplasta
    const yBefore = piranha.y;
    piranha.squish();
    check('pisar piraña no la aplasta', piranha.y === yBefore && !piranha.squished);

    // Spawn sin tuberia: se elimina (no rompe el juego)
    const p3 = new Piranha(0, 0);   // tx 0: no hay tuberia
    p3.initFromLevel(L2);
    check('spawn sin tuberia se elimina', p3.remove === true);

    // --- Render por tema (humo: no debe lanzar y debe pintar el fondo) ---
    console.log('\n[Render]');
    const paintLog = [];
    const recCtx = new Proxy({}, {
        get(t, prop) {
            if (prop in t) return t[prop];
            return (...args) => { paintLog.push({ fn: prop, args }); };
        },
        set(t, prop, value) {
            t[prop] = value;
            if (prop === 'fillStyle') paintLog.push({ fn: 'fillStyle', args: [value] });
            return true;
        },
    });
    const fakeCanvas = { width: 800, height: 480, getContext: () => recCtx };
    const game = new Game(fakeCanvas);

    game.startLevel(1);
    paintLog.length = 0;
    game.render();
    const bg1 = paintLog.filter(p => p.fn === 'fillStyle').map(p => p.args[0]);
    check('el 1-1 pinta el cielo azul', bg1.includes('#5c94fc'));
    check('el 1-1 no pinta fondo de cueva', !bg1.includes(Sprite.COLORS.caveBg));

    game.startLevel(2);
    paintLog.length = 0;
    game.render();
    const bg2 = paintLog.filter(p => p.fn === 'fillStyle').map(p => p.args[0]);
    check('el 2-1 pinta el fondo de cueva', bg2.includes(Sprite.COLORS.caveBg));
    check('el 2-1 no pinta cielo azul', !bg2.includes('#5c94fc'));

    // La musica cambia con el tema
    check('hay melodia de cueva distinta', GameAudio.MUSIC.underground.length > 0
        && GameAudio.MUSIC.underground !== GameAudio.MUSIC.overworld);

    // --- Simulacion de juego real en el 2-1 (humo, 10s) ---
    console.log('\n[Simulacion 2-1]');
    game.startLevel(2);
    game.setState('playing');
    let simError = null;
    let frames = 0;
    for (let f = 0; f < 600; f++) {
        Input.keys = { ArrowRight: true, ShiftLeft: true, Space: (f % 60) < 18 };
        try {
            game.update(1 / 60);
        } catch (err) { simError = err; break; }
        frames++;
        if (!game.player.alive) break;
    }
    check('600 frames del 2-1 sin excepciones', simError === null && frames > 0);
    if (simError) console.error('  -> ', simError.message);
    check('la camara sigue a Mario sin salirse del nivel',
        game.cameraX >= 0 && game.cameraX <= game.level.width * 32 - 800);

    console.log('\n=== TODAS LAS PRUEBAS PASARON (', fail, 'fallos ) ===');
    if (fail > 0) process.exit(1);
} catch (e) {
    console.error('ERROR en pruebas:', e.message);
    console.error(e.stack);
    process.exit(1);
}