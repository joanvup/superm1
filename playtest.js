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

/* Fila de la superficie por la que se camina en una columna: el tile solido
   MAS BAJO cuya cima este libre. Se usa el mas bajo (no el mas alto) porque
   los bloques flotantes (ladrillos con hueco debajo) no son escalones: por
   debajo se pasa caminando. */
function standTop(level, tx) {
    for (let ty = level.height - 1; ty >= 0; ty--) {
        if (!level.isSolid(tx, ty)) continue;
        if (level.isSolid(tx, ty - 1)) continue; // sin sitio para estar de pie
        return ty;
    }
    return null;
}

/* Audita un nivel: devuelve cuantos obstaculos resultan imposibles con la
   fisica actual (escalones demasiado altos y huecos inalcanzables). */
function auditLevel(name, L) {
    const floorRow = L.height - 2;
    const flagTx = Math.floor(L.flagX / TS);

    // Huecos: columnas donde no hay ninguna superficie
    const gaps = [];
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

    // Peldanos: diferencia de altura entre superficies de columnas contiguas
    const steps = [];
    for (let tx = 1; tx < L.width; tx++) {
        const a = standTop(L, tx - 1);
        const b = standTop(L, tx);
        if (a === null || b === null) continue;
        const rise = (a - b) * TS; // > 0 = escalon hacia arriba
        if (rise >= TS) steps.push({ tx, rise, riseTiles: rise / TS });
    }

    console.log(`\n=== 2.${name} ALTURAS (salto maximo ${(MAX_RISE / TS).toFixed(2)} tiles, ` +
        `alcance ${MAX_REACH.toFixed(0)}px) ===`);

    const blockers = steps.filter(s => s.rise > MAX_RISE && s.tx < flagTx);
    console.log('  Escalones mas altos que el salto (antes de la meta):');
    if (blockers.length === 0) console.log('    (ninguno)');
    for (const s of blockers) {
        console.log(`    tx=${String(s.tx).padStart(3)}  subir ${s.riseTiles.toFixed(1)} tiles ` +
            `(${s.rise}px) > ${(MAX_RISE / TS).toFixed(2)} tiles  <-- BLOQUEA EL PASO`);
    }

    console.log('  Huecos en el tramo jugable:');
    const playGaps = gaps.filter(g => g.x0 < flagTx);
    if (playGaps.length === 0) console.log('    (ninguno)');
    let badGaps = 0;
    for (const g of playGaps) {
        const need = (g.w + 1) * TS;
        const ok = MAX_REACH >= need;
        if (!ok) badGaps++;
        console.log(`    tx ${g.x0}-${g.x1}  ancho ${g.w} tiles (${g.w * TS}px), ` +
            `necesita ~${need}px  ${ok ? 'OK' : '<-- INALCANZABLE'}`);
    }

    // Cimas de bloques inalcanzables desde el suelo (informativo: pueden
    // requerir saltar desde otro bloque)
    const highBlocks = [];
    for (let tx = 0; tx < L.width; tx++) {
        for (let ty = 0; ty < L.height; ty++) {
            if (!L.isSolid(tx, ty) || L.isSolid(tx, ty + 1)) continue;
            const rise = (floorRow - ty) * TS;
            if (rise > TS && rise > MAX_RISE) highBlocks.push({ tx, ty, tile: L.get(tx, ty), rise });
        }
    }
    console.log('  Cimas a las que no se llega desde el suelo (se usan bloques de apoyo):');
    if (highBlocks.length === 0) console.log('    (ninguna)');
    for (const b of highBlocks) {
        console.log(`    tx=${String(b.tx).padStart(3)} fila ${b.ty} tile '${b.tile}'  ` +
            `cima a ${((floorRow - b.ty) * TS / TS).toFixed(1)} tiles`);
    }

    // Techos que anulan el salto: junto a un muro, si hay un bloque bajo justo
    // delante, la cabeza choca antes de subir lo bastante para coronarlo.
    const ceilBlockers = [];
    const PLAYER_H = 28;
    for (const s of steps) {
        if (s.tx >= flagTx) continue;
        const wallTx = s.tx;
        const standRow = standTop(L, wallTx - 1);
        if (standRow === null) continue;

        // Altura del muro en esa columna (filas solidas hacia arriba)
        let wallTop = standRow;
        while (wallTop > 0 && L.isSolid(wallTx, wallTop - 1)) wallTop--;
        const need = (standRow - wallTop) * TS;      // subida necesaria
        if (need <= 0) continue;

        // Techo mas alto entre las columnas de arranque: basta con que UNA
        // este libre, porque el jugador puede saltar desde ella y avanzar en
        // el aire hasta coronar el muro.
        let best = null;
        for (const col of [wallTx - 1, wallTx - 2, wallTx - 3]) {
            let ceiling = null;
            for (let r = standRow - 1; r >= 0; r--) {
                if (!L.isSolid(col, r)) continue;
                ceiling = r;
                break;
            }
            // Sin techo en esa columna hay altura de sobra para tomar carrerilla
            const avail = ceiling === null
                ? Infinity
                : standRow * TS - ((ceiling + 1) * TS + PLAYER_H);
            if (best === null || avail > best) best = avail;
        }
        if (best < need) {
            ceilBlockers.push({ tx: wallTx, need, avail: best });
        }
    }

    console.log('\n  Techos que impiden coronar un muro contiguo:');
    if (ceilBlockers.length === 0) console.log('    (ninguno)');
    for (const c of ceilBlockers) {
        console.log(`    tx=${String(c.tx).padStart(3)}  hay que subir ${c.need}px ` +
            `pero solo hay ${c.avail}px libres  <-- BLOQUEA EL PASO`);
    }

    return { blockers: blockers.length + ceilBlockers.length, badGaps, flagTx };
}

const L = buildLevel1();
const r1 = auditLevel('1-1', L);
const L2 = buildLevel2();
const r2 = auditLevel('2-1', L2);

const flagTx = r1.flagTx;
const TOTAL_BLOCKERS = r1.blockers + r1.badGaps + r2.blockers + r2.badGaps;
console.log(`\n  TOTAL obstaculos imposibles: ${TOTAL_BLOCKERS}` +
    (TOTAL_BLOCKERS === 0 ? '  -> ambos niveles son completables' : '  <-- HAY NIVELES BLOQUEADOS'));

/* ---------- 3. bot que intenta pasarse el nivel ---------- */

/* Mirar por delante: ?se puede aterrizar en alguna superficie dentro del
   arco del salto? El bot usa heuristica simple: corre a la derecha y salta
   cuando detecta muro o hueco. Si se atasca 1.5s, informa donde. */
function runBot(seconds = 240, builder = buildLevel1) {
    const level = builder();
    const p = new Player(level.playerStart.x, level.playerStart.y);
    const limit = seconds * 60;

    let holdJump = false;
    let still = 0;
    let lastX = p.x;
    let maxX = p.x;
    let coyote = 0;   // frames desde que perdio el suelo (permite saltar tarde)
    let buffer = 0;   // frames de margen para saltar nada mas aterrizar

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

        // Querer saltar si hay muro o hueco a una distancia de arranque.
        // "buffer": si quiere saltar pero esta en el aire, lo intenta en
        // cuanto aterrice. "coyote": tambien poco despues de dejar el suelo.
        let want = false;
        if (wallDist !== null && wallDist <= 30) want = true;
        else if (gapDist !== null && gapDist <= 34 && gapDist >= 8) want = true;

        if (want) buffer = 8;
        else buffer = Math.max(0, buffer - 1);

        if (p.onGround) coyote = 6;
        else coyote = Math.max(0, coyote - 1);

        const canJump = p.onGround || coyote > 0;
        const wantNow = buffer > 0 && canJump && !holdJump;

        if (wantNow) holdJump = true;
        if (p.onGround && buffer === 0) holdJump = false;
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

console.log('\n=== 3. BARRIDO DE TIMING DE SALTO (prueba autoritativa) ===');
/* Para cada hueco del nivel se prueban TODAS las posiciones de despegue
   (cada pixel) corriendo a tope y manteniendo el salto. Si alguna cruza el
   hueco, un jugador humano puede pasarlo. */
function gapList(L) {
    const out = [];
    let start = null;
    for (let tx = 0; tx < L.width; tx++) {
        const empty = standTop(L, tx) === null;
        if (empty && start === null) start = tx;
        if (!empty && start !== null) {
            if (start * TS < L.flagX) out.push({ x0: start, x1: tx - 1 });
            start = null;
        }
    }
    return out;
}

function clearsGap(L, gap) {
    const farEdgeX = (gap.x1 + 1) * TS;   // borde izquierdo de la orilla lejana
    const nearEdgeX = gap.x0 * TS;        // borde derecho de la orilla cercana
    // Despegar desde una posicion de 0 a 48 px antes del borde cercano.
    // Se toma carrerilla solo hasta estar a ~1 tile del borde (no 40 frames,
    // que ya meteria al jugador dentro del hueco).
    for (let lead = 0; lead <= 48; lead++) {
        const p = new Player(nearEdgeX - TS - lead, L.floorY - 28);
        // Tomar carrerilla hasta que el borde delantero alcance el borde del hueco
        for (let i = 0; i < 30; i++) {
            p.update(inputFor(true, false, true), L, NOOP_GAME);
            if (p.x + p.width >= nearEdgeX - 8) break;   // cerca del borde
            if (!p.onGround) break;                        // se cayó antes
        }
        if (p.x + p.width > nearEdgeX) continue;   // ya dentro del hueco
        // Saltar y mantener pulsado hasta aterrizar
        let cleared = false;
        for (let i = 0; i < 200; i++) {
            p.update(inputFor(true, true, true), L, NOOP_GAME);
            if (!p.alive) break;
            if (p.onGround && p.x + p.width >= farEdgeX) { cleared = true; break; }
            if (p.onGround) break;   // aterrizo antes de la orilla lejana
        }
        if (cleared) return { ok: true, lead };
    }
    return { ok: false };
}

let gapsFail = 0;
for (const [name, builder] of [['1-1', buildLevel1], ['2-1', buildLevel2]]) {
    const L = builder();
    const gaps = gapList(L);
    console.log(`\n  [${name}]`);
    if (gaps.length === 0) console.log('    (sin huecos)');
    for (const g of gaps) {
        const w = g.x1 - g.x0 + 1;
        const r = clearsGap(L, g);
        if (!r.ok) gapsFail++;
        console.log(`    hueco tx ${g.x0}-${g.x1} (${w} tiles): ` +
            (r.ok ? `SUPERABLE (despegando ${r.lead}px antes del borde)`
                  : '<-- NINGUN timing lo cruza'));
    }
}
console.log(`\n  Huecos imposibles: ${gapsFail}` +
    (gapsFail === 0 ? '  -> todos se pueden saltar' : '  <-- HAY HUECOS IMPOSIBLES'));

/* ---------- 4. bot que intenta pasarse el nivel ---------- */

console.log('\n=== 4. RECORRIDO AUTOMATICO (bot corriendo hacia la meta) ===');
console.log('  Nota: es una heuristica sin timing fino; la auditoria de alturas');
console.log('  (seccion 2) es la prueba autoritativa de que el nivel es superable.');

const runs = [
    ['1-1', buildLevel1],
    ['2-1', buildLevel2],
];

let botStuck = 0;
for (const [name, builder] of runs) {
    const lv = builder();
    const goalTx = Math.floor(lv.flagX / TS);
    const bot = runBot(240, builder);
    const reached = Math.floor(bot.maxX / TS);
    console.log(`\n  [${name}] ${bot.res}  |  progreso tx=${reached}/${goalTx}  |  ` +
        `frames=${bot.f}`);
    if (bot.map) bot.map.forEach(l => console.log(l));
    if (bot.res !== 'META ALCANZADA') {
        botStuck++;
        console.log(`    -> faltan ${goalTx - reached} tiles para la bandera`);
    }
}
