/* ====== SuperM1 - Analisis de jugabilidad (Node, headless) ======
   Mide la fisica real del salto y deja que un bot recorra el nivel para
   detectar puntos donde Mario no puede avanzar.

   Uso:
     node playtest.js                     informe con la fisica actual
     node playtest.js --jump=-13          prueba con otra velocidad de salto
     node playtest.js --jump=-13 --speed=4
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- carga del juego (mismo truco que test.js) ---------- */
global.window = { addEventListener: () => {}, AudioContext: null, webkitAudioContext: null };
global.document = { getElementById: () => ({ classList: { add() {}, remove() {} }, textContent: '' }) };

const jsDir = path.join(__dirname, 'js');
for (const f of ['physics.js', 'player.js', 'level.js']) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), { filename: f });
}

/* sobrescrituras por linea de comandos: --jump=-13 --speed=4.5 */
const ALIAS = { jump: 'JUMP_VELOCITY', speed: 'RUN_SPEED', gravity: 'GRAVITY' };
for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([A-Za-z_]+)=(-?[\d.]+)$/);
    if (m) {
        const key = ALIAS[m[1]] || m[1].toUpperCase();
        Physics[key] = parseFloat(m[2]);
    }
}

const TS = 32;
const VERBOSE = process.argv.includes('--verbose');

const NOOP_GAME = {
    audio: { playSound() {} },
    updateHUD() {},
    onPlayerHitCeiling() {},
    resetLevel() {},
};

function inputFor(right, jump, run) {
    return { getAxisX: () => (right ? 1 : 0), getJump: () => jump, getRun: () => run };
}

/* ---------- 1. medidas de salto ---------- */

/* Salto desde el reposo: deja al jugador asentarse en el suelo (2 frames),
   despues pulsa salto y lo mantiene hasta aterrizar. */
function measureJump(run, holdFrames = Infinity) {
    const L = buildLevel1();
    const p = new Player(64, L.floorY - 28);
    const startX = p.x;
    const groundY = p.y;

    for (let i = 0; i < 3; i++) p.update(inputFor(false, false, false), L, NOOP_GAME);

    let apex = 0;
    let airborne = 0;
    for (let i = 0; i < 400; i++) {
        const hold = i < holdFrames;
        p.update(inputFor(true, hold, run), L, NOOP_GAME);
        apex = Math.max(apex, groundY - p.y);
        if (!p.onGround) airborne++;
        if (i > 2 && p.onGround) break;
    }
    return { height: apex, distance: p.x - startX, airborne };
}

const jumpWalk = measureJump(false);
const jumpRun = measureJump(true);
const jumpTap = measureJump(false, 2); // soltar el boton casi inmediato

console.log('=== 1. FISICA DEL SALTO ===');
console.log(`  GRAVITY=${Physics.GRAVITY}  JUMP_VELOCITY=${Physics.JUMP_VELOCITY}  ` +
    `MOVE=${Physics.MOVE_SPEED}  RUN=${Physics.RUN_SPEED}`);
console.log(`  Salto normal (mantenido)... ${jumpWalk.height.toFixed(1)}px = ` +
    `${(jumpWalk.height / TS).toFixed(2)} tiles   (vuelo ${jumpWalk.airborne} frames)`);
console.log(`  Salto corriendo............ ${jumpRun.height.toFixed(1)}px = ` +
    `${(jumpRun.height / TS).toFixed(2)} tiles, alcance horizontal ${jumpRun.distance.toFixed(0)}px ` +
    `= ${(jumpRun.distance / TS).toFixed(2)} tiles`);
console.log(`  Salto minimo (toque corto).. ${jumpTap.height.toFixed(1)}px = ` +
    `${(jumpTap.height / TS).toFixed(2)} tiles`);

const MAX_RISE = jumpWalk.height;
const MAX_REACH = jumpRun.distance;

/* ---------- 2. superficies del nivel ---------- */

/* altura de la superficie mas alta sobre la que se puede estar de pie en una
   columna: primer tile solido cuya cima esta libre (tile superior vacío). */
function standTop(level, tx) {
    for (let ty = 0; ty < level.height; ty++) {
        if (!level.isSolid(tx, ty)) continue;
        if (level.isSolid(tx, ty - 1)) continue; // no se puede estar encima
        return ty;
    }
    return null;
}

const L = buildLevel1();
const floorRow = L.height - 2; // fila superior del suelo = 13

/* huecos: columnas donde no hay ninguna superficie */
const gaps = [];
{
    let start = null;
    for (let tx = 0; tx < L.width; tx++) {
        const empty = standTop(L, tx) === null;
        if (empty && start === null) start = tx;
        if (!empty && start !== null) {
            gaps.push({ x0: start, x1: tx - 1, w: tx - start });
            start = null;
        }
    }
    if (start !== null) gaps.push({ x0: start, x1: L.width - 1, w: L.width - start });
}

/* peldanos: diferencia de altura entre superficies de columnas contiguas */
const steps = [];
for (let tx = 1; tx < L.width; tx++) {
    const a = standTop(L, tx - 1);
    const b = standTop(L, tx);
    if (a === null || b === null) continue;
    const rise = (a - b) * TS; // > 0 = escalon hacia arriba
    if (rise >= TS) steps.push({ tx, rise, riseTiles: rise / TS });
}

const flagTx = Math.floor(L.flagX / TS);

console.log('\n=== 2. ALTURAS DEL NIVEL (comparadas con el salto de ' +
    `${(MAX_RISE / TS).toFixed(2)} tiles) ===`);
const blockers = steps.filter(s => s.rise > MAX_RISE && s.tx < flagTx);
console.log(`  Escalones de superficie demasiado altos para el salto (antes de la meta):`);
if (blockers.length === 0) console.log('    (ninguno)');
for (const s of blockers) {
    console.log(`    tx=${String(s.tx).padStart(3)}  hay que subir ${s.riseTiles.toFixed(1)} tiles ` +
        `(${s.rise}px) > ${(MAX_RISE / TS).toFixed(2)} tiles  <-- BLOQUEA EL PASO`);
}

console.log('\n  Huecos (ancho necesario vs alcance del salto corriendo ' +
    `${MAX_REACH.toFixed(0)}px):`);
if (gaps.length === 0) console.log('    (ninguno)');
for (const g of gaps) {
    const need = (g.w + 1) * TS;
    const inPlay = g.x0 < flagTx;
    const ok = MAX_REACH >= need;
    console.log(`    tx ${g.x0}-${g.x1}  ancho ${g.w} tiles (${g.w * TS}px), necesita ~${need}px  ` +
        `${!inPlay ? '(fuera del tramo jugable)' : ok ? 'OK' : '<-- INALCANZABLE'}`);
}

/* bloques cuya cima esta por encima del salto: no se pueden pisar */
const highBlocks = [];
for (let tx = 0; tx < L.width; tx++) {
    for (let ty = 0; ty < L.height; ty++) {
        if (!L.isSolid(tx, ty) || L.isSolid(tx, ty + 1)) continue;
        const rise = (floorRow - ty) * TS;
        if (rise > TS && rise > MAX_RISE) highBlocks.push({ tx, ty, tile: L.get(tx, ty), rise });
    }
}
console.log('\n  Cimas de bloques a las que no se puede subir desde el suelo:');
if (highBlocks.length === 0) console.log('    (ninguna)');
for (const b of highBlocks) {
    console.log(`    tx=${String(b.tx).padStart(3)} fila ${b.ty} tile '${b.tile}'  ` +
        `cima a ${((floorRow - b.ty) * TS / TS).toFixed(1)} tiles`);
}

/* ---------- 3. bot que intenta pasarse el nivel ---------- */

/* Mirar por delante: ?se puede aterrizar en alguna superficie dentro del
   arco del salto? El bot usa heuristica simple: corre a la derecha y salta
   cuando detecta muro o hueco. Si se atasca 1.5s, informa donde. */
function runBot(seconds = 240) {
    const level = buildLevel1();
    const p = new Player(level.playerStart.x, level.playerStart.y);
    const limit = seconds * 60;

    let holdJump = false;
    let still = 0;
    let lastX = p.x;
    let maxX = p.x;
    const log = [];

    for (let f = 0; f < limit; f++) {
        const feetRow = Math.floor((p.y + p.height + 1) / TS);
        const frontPx = p.x + p.width;                      // borde delantero

        // Distancia (px) hasta una PARED REAL: un tile solido que ademas esta
        // apoyado en el suelo (tuberia, escalera alta). Los bloques sueltos de
        // ladrillo/? (con hueco debajo) NO son muros: se pasan por debajo.
        let wallDist = null;
        for (let d = 1; d <= 48; d++) {
            const tx = Math.floor((frontPx + d) / TS);
            // ?columna solida que baja hasta el suelo (o al menos 3 tiles)?)
            let height = 0;
            for (let ty = feetRow - 1; ty >= 0; ty--) {
                if (!level.isSolid(tx, ty)) break;
                height++;
            }
            const bottomAtFloor = level.isSolid(tx, feetRow) || level.isSolid(tx, feetRow + 1);
            if (bottomAtFloor && height >= 2) { wallDist = d; break; }
        }
        // Distancia hasta el hueco: primer tile sin ningun solido por debajo.
        let gapDist = null;
        for (let d = 1; d <= 64; d++) {
            const tx = Math.floor((frontPx + d) / TS);
            let anySolid = false;
            for (let ty = feetRow; ty < level.height; ty++) {
                if (level.isSolid(tx, ty)) { anySolid = true; break; }
            }
            if (!anySolid) { gapDist = d; break; }
        }

        // Lanzar el salto solo desde el suelo, cuando el obstaculo esta a una
        // distancia de arranque. Muro: al pie de la pared. Hueco: cerca del
        // borde (entre 8 y 34 px) para despegar sin caerse y sin saltar pronto.
        let want = false;
        if (p.onGround) {
            if (wallDist !== null && wallDist <= 30) want = true;
            else if (gapDist !== null && gapDist <= 34 && gapDist >= 8) want = true;
        }

        if (want && !holdJump) holdJump = true;
        if (p.onGround && !want) holdJump = false;
        if (!p.onGround && p.vy > 0) holdJump = false;

        p.update(inputFor(true, holdJump, true), level, NOOP_GAME);

        if (VERBOSE && f % 6 === 0) {
            console.log(`  f=${f} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} ` +
                `onGround=${p.onGround} vx=${p.vx.toFixed(1)} vy=${p.vy.toFixed(1)} ` +
                `jump=${holdJump} tx=${Math.floor(p.x / TS)} ` +
                `gap=${gapDist} wall=${wallDist}`);
        }

        maxX = Math.max(maxX, p.x);
        still = Math.abs(p.x - lastX) < 0.05 ? still + 1 : 0;
        lastX = p.x;

        if (f % 180 === 0) log.push(Math.floor(p.x / TS));

        if (!p.alive) return { res: 'MUERTO', tx: Math.floor(p.x / TS), maxX, f };
        if (p.x + p.width > level.flagX) return { res: 'META ALCANZADA', maxX, f };
        if (still > 90) {
            return { res: 'ATASCADO', tx: Math.floor(p.x / TS), maxX, f, map: stallMap(level, p) };
        }
    }
    return { res: 'TIEMPO AGOTADO', tx: Math.floor(p.x / TS), maxX, f: limit };
}

function stallMap(level, p) {
    const tx0 = Math.floor(p.x / TS);
    const feetRow = Math.floor((p.y + p.height) / TS);
    const out = [`    Mario en tx=${tx0}, pies en fila ${feetRow}`];
    for (let ty = feetRow - 7; ty <= feetRow + 1; ty++) {
        let line = '    fila ' + String(ty).padStart(2) + '  ';
        for (let d = -3; d <= 6; d++) {
            const tx = tx0 + d;
            const isMario = Math.floor(p.x / TS) === tx && Math.floor(p.y / TS) === ty;
            line += level.isSolid(tx, ty) ? '#' : (isMario ? 'M' : '.');
        }
        out.push(line);
    }
    out.push('    columnas tx=' + (tx0 - 3) + '..' + (tx0 + 6));
    return out;
}

console.log('\n=== 3. RECORRIDO AUTOMATICO (bot corriendo hacia la meta) ===');
const bot = runBot();
console.log(`  ${bot.res}  |  progreso tx=${Math.floor(bot.maxX / TS)}/${flagTx} (meta)  ` +
    `|  frames=${bot.f}`);
if (bot.map) bot.map.forEach(l => console.log(l));
if (bot.res !== 'META ALCANZADA') {
    console.log(`  -> faltan ${flagTx - Math.floor(bot.maxX / TS)} tiles para la bandera`);
}
