/* ====== SuperM1 — Nivel y tiles ======

   Codigos de tile:
     '.' vacio          'X' suelo solido     'S' bloque de piedra
     'B' ladrillo       '?' bloque ? (moneda) 'm' bloque ? (hongo)
     'f' bloque ? (flor) 'u' bloque usado     'P' tuberia (solido)
     'o' moneda recolectable
   Decoracion de fondo (nubes, colinas, arbustos) y entidades se guardan
   en listas aparte para poder dibujarlas detras/delante de los tiles. */

class Level {
    constructor(width = 140) {
        this.tileSize = 32;
        this.width = width;  // en tiles
        this.height = 15;    // en tiles -> 480 px
        this.grid = [];
        this.decor = [];    // { type, x, y } en tiles
        this.spawns = [];   // { type, x, y } en pixels
        this.particles = [];
        this.coins = [];    // monedas estaticas {x, y, taken}
        this.flagX = 0;     // pixels
        this.poleX = 0;     // eje del asta (pixels)
        this.poleTopY = 0;  // cima del asta (pixels)
        this.castleX = 0;   // pixels
        this.castleW = 0;   // pixels
        this.castleH = 0;   // pixels
        this.playerStart = { x: 64, y: 0 };
        this.theme = 'overworld'; // overworld | underground (cambia fondo y musica)

        for (let y = 0; y < this.height; y++) {
            this.grid.push(new Array(this.width).fill('.'));
        }
    }

    // ----- helpers de construccion -----

    set(tx, ty, ch) {
        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
            this.grid[ty][tx] = ch;
        }
    }

    get(tx, ty) {
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return '.';
        return this.grid[ty][tx];
    }

    isSolid(tx, ty) {
        const t = this.get(tx, ty);
        return t === 'X' || t === 'S' || t === 'B' || t === '?' ||
               t === 'm' || t === 'f' || t === 'u' || t === 'P';
    }

    // Suelo desde tx0 hasta tx1 (inclusive) con `depth` filas
    ground(tx0, tx1, depth = 2) {
        for (let x = tx0; x <= tx1; x++) {
            for (let d = 0; d < depth; d++) {
                this.set(x, this.height - 1 - d, 'X');
            }
        }
    }

    row(tx0, tx1, ty, ch) {
        for (let x = tx0; x <= tx1; x++) this.set(x, ty, ch);
    }

    // Tuberia de `hTiles` de alto en la columna tx
    pipe(tx, hTiles) {
        const bottom = this.height - 3; // sobre el suelo
        const topRow = bottom - hTiles + 1;
        for (let y = topRow; y <= bottom; y++) {
            this.set(tx, y, 'P');
            this.set(tx + 1, y, 'P');
        }
        return topRow;
    }

    coin(tx, ty) {
        this.coins.push({ x: tx * this.tileSize + 2, y: ty * this.tileSize + 2, taken: false });
    }

    coinRow(tx0, tx1, ty) {
        for (let x = tx0; x <= tx1; x++) this.coin(x, ty);
    }

    spawn(type, tx, ty) {
        this.spawns.push({
            type,
            x: tx * this.tileSize,
            y: ty * this.tileSize,
        });
    }

    addDecor(type, tx, ty, scale = 1) {
        this.decor.push({ type, x: tx * this.tileSize, y: ty * this.tileSize, scale });
    }

    // Altura (en pixels) de la cima del suelo
    get floorY() {
        return (this.height - 2) * this.tileSize;
    }
}

/* ====== Construccion del Nivel 1-1 ====== */
function buildLevel1() {
    const L = new Level();
    const F = L.height - 2; // fila superior del suelo = 13

    // --- Tramo 1: inicio ---
    L.ground(0, 68);
    L.addDecor('cloud', 8, 2, 2);
    L.addDecor('hill', 0, F - 4, 2);
    L.addDecor('bush', 17, F - 1, 2);
    L.spawn('goomba', 22, F - 1);

    // Primeros bloques ?
    L.set(16, F - 4, '?');
    L.coinRow(18, 18, F - 4);

    // Set de ladrillos + ? + hongo
    L.row(20, 21, F - 4, 'B');
    L.set(22, F - 4, 'm');       // hongo
    L.row(23, 24, F - 4, 'B');
    L.addDecor('bush', 23, F - 1, 2);

    // Bloque de flor alto
    L.set(21, F - 8, 'f');
    L.addDecor('cloud', 20, 1, 2);

    // Segunda pareja de goombas
    L.spawn('goomba', 30, F - 1);
    L.spawn('goomba', 31, F - 1);

    // Escalera de bloques de piedra
    L.set(28, F - 4, 'S');
    L.set(29, F - 4, 'S');
    L.set(29, F - 8, 'S');
    L.set(30, F - 8, 'S');
    L.set(30, F - 4, 'S');
    L.set(31, F - 4, 'S');
    L.set(31, F - 8, 'S');

    // Tuberias
    L.pipe(36, 2);
    L.pipe(42, 3);
    L.addDecor('hill', 33, F - 4, 3);
    L.addDecor('cloud', 40, 3, 2);
    L.spawn('goomba', 46, F - 1);

    // --- Tramo 2: hueco + ladrillos altos ---
    L.set(44, F - 4, 'B');
    L.set(45, F - 4, '?');
    L.set(46, F - 4, 'B');
    L.coinRow(44, 46, F - 8);

    // Hueco (sin suelo) entre 50 y 53
    for (let x = 50; x <= 53; x++) {
        for (let d = 0; d < 2; d++) L.set(x, L.height - 1 - d, '.');
    }

    L.ground(54, 90);
    L.spawn('koopa', 57, F - 1);

    // Bloque ? con moneda
    L.set(58, F - 4, '?');
    L.addDecor('bush', 62, F - 1, 2);

    // Zona de ladrillos con koopa arriba. Terminan dos tiles ANTES de la
    // tuberia alta: si llegaran hasta ella, el techo no dejaria ganar altura
    // para coronarla y la tuberia de 4 seria imposible de saltar.
    L.row(64, 67, F - 4, 'B');
    L.set(66, F - 4, '?');
    L.coinRow(64, 67, F - 8);
    L.spawn('goomba', 66, F - 5);

    // Segunda tuberia alta
    L.pipe(70, 4);
    L.addDecor('cloud', 66, 2, 2);

    // --- Tramo 3: escalera final y meta ---
    L.spawn('goomba', 74, F - 1);
    L.spawn('goomba', 75, F - 1);

    // Escalera ascendente clasica (10 bloques)
    for (let i = 0; i < 10; i++) {
        for (let h = 0; h <= i; h++) {
            L.set(78 + i, F - 1 - h, 'S');
        }
    }

    // Escalon + hueco pequeno + plataforma
    L.ground(88, 95);
    for (let x = 86; x <= 87; x++) {
        for (let d = 0; d < 2; d++) L.set(x, L.height - 1 - d, '.');
    }

    // Escalera descendente corta
    for (let i = 0; i < 4; i++) {
        for (let h = 0; h <= 3 - i; h++) {
            L.set(92 + i, F - 1 - h, 'S');
        }
    }

    // Suelo final hasta la meta
    L.ground(96, 134);

    // Monedas de despedida
    L.coinRow(98, 102, F - 4);
    L.spawn('goomba', 100, F - 1);
    L.spawn('koopa', 104, F - 1);
    L.addDecor('cloud', 104, 1, 2);

    // Ultimos bloques
    L.row(106, 108, F - 4, 'B');
    L.set(107, F - 8, '?');
    L.row(110, 113, F - 4, 'B');
    L.set(112, F - 4, 'm');

    // Escalinata final hacia la bandera
    for (let i = 0; i < 8; i++) {
        for (let h = 0; h <= i; h++) {
            L.set(116 + i, F - 1 - h, 'S');
        }
    }

    // Asta de la bandera y castillo
    L.flagX = 128 * L.tileSize;
    L.poleX = L.flagX + 12;                     // eje del asta
    L.poleTopY = L.floorY - 180;                // cima del asta
    L.castleX = 131 * L.tileSize;
    L.castleW = 16 * 4;                         // sprite 16px a escala 4
    L.castleH = 16 * 4;

    // Punto de partida del jugador
    L.playerStart = { x: 64, y: F * L.tileSize - 28 };

    // Decoracion final
    L.addDecor('cloud', 96, 2, 2);
    L.addDecor('bush', 98, F - 1, 2);
    L.addDecor('hill', 122, F - 4, 2);

    return L;
}

/* ====== Construccion del Nivel 2-1 (cuevas) ======
   Tema subterraneo: fondo oscuro con estrellas, estalactitas en el techo,
   tuberias con plantas pirania, huecos con plataformas de piedra sobre un
   foso, y una "sala" de bloques para saltar. Enemigos: pirania + goombas. */
function buildLevel2() {
    const L = new Level();
    L.theme = 'underground';
    const F = L.height - 2; // fila superior del suelo = 13

    // Estrellas de fondo (no colisionan, decoracion)
    L.addDecor('star', 2, 1, 1);
    L.addDecor('star', 8, 3, 1);
    L.addDecor('star', 13, 2, 1);
    L.addDecor('star', 19, 4, 1);
    L.addDecor('star', 25, 1, 1);
    L.addDecor('star', 31, 3, 1);
    L.addDecor('star', 37, 2, 1);
    L.addDecor('star', 43, 1, 1);
    L.addDecor('star', 49, 4, 1);
    L.addDecor('star', 55, 2, 1);
    L.addDecor('star', 61, 3, 1);
    L.addDecor('star', 67, 1, 1);
    L.addDecor('star', 73, 4, 1);
    L.addDecor('star', 79, 2, 1);
    L.addDecor('star', 85, 1, 1);
    L.addDecor('star', 91, 3, 1);
    L.addDecor('star', 97, 2, 1);
    L.addDecor('star', 103, 4, 1);
    L.addDecor('star', 109, 1, 1);
    L.addDecor('star', 115, 3, 1);
    L.addDecor('star', 121, 2, 1);
    L.addDecor('star', 127, 1, 1);

    // Estalactitas que cuelgan del techo
    L.addDecor('stalactite', 3, 0, 2);
    L.addDecor('stalactite', 10, 0, 2);
    L.addDecor('stalactite', 17, 0, 2);
    L.addDecor('stalactite', 24, 0, 2);
    L.addDecor('stalactite', 31, 0, 2);
    L.addDecor('stalactite', 38, 0, 2);
    L.addDecor('stalactite', 45, 0, 2);
    L.addDecor('stalactite', 52, 0, 2);
    L.addDecor('stalactite', 59, 0, 2);
    L.addDecor('stalactite', 66, 0, 2);
    L.addDecor('stalactite', 73, 0, 2);
    L.addDecor('stalactite', 80, 0, 2);
    L.addDecor('stalactite', 87, 0, 2);
    L.addDecor('stalactite', 94, 0, 2);
    L.addDecor('stalactite', 101, 0, 2);
    L.addDecor('stalactite', 108, 0, 2);
    L.addDecor('stalactite', 115, 0, 2);
    L.addDecor('stalactite', 122, 0, 2);

    // --- Tramo 1: entrada de la cueva ---
    L.ground(0, 40);
    L.addDecor('caveBush', 5, F - 1, 2);

    // Primeros bloques ? con moneda
    L.set(8, F - 4, '?');
    L.coin(9, F - 5);

    // Tuberia con pirania (baja, para ensenar a esquivarla)
    L.pipe(14, 2);
    L.spawn('piranha', 14, 0); // la posicion la ajusta la propia pirania
    L.spawn('goomba', 18, F - 1);
    L.addDecor('caveBush', 12, F - 1, 2);

    // Bloque ? con hongo
    L.set(20, F - 4, 'm');
    L.coinRow(20, 22, F - 8);
    L.addDecor('caveBush', 22, F - 1, 2);

    // Segunda tuberia con pirania, mas alta
    L.pipe(26, 3);
    L.spawn('piranha', 26, 0);
    L.spawn('goomba', 30, F - 1);
    L.spawn('goomba', 31, F - 1);

    // --- Tramo 2: primer foso (se salta de un salto, como en el 1-1) ---
    for (let x = 36; x <= 38; x++) {
        for (let d = 0; d < 2; d++) L.set(x, L.height - 1 - d, '.');
    }
    L.coinRow(36, 38, F - 4);

    // Suelo retoma en 39
    L.ground(39, 55);
    L.addDecor('caveBush', 44, F - 1, 2);

    // "Sala" de la cueva: dos arcos de ladrillo enmarcando una tuberia con
    // pirania. Los ladrillos bajos quedan SEPARADOS de la tuberia para que
    // haya sitio de sobra de saltarla (si cuelgan justo delante, la cabeza
    // choca antes de coronarla y el nivel se vuelve imposible).
    L.row(44, 45, F - 4, 'B');
    L.row(52, 53, F - 4, 'B');
    L.row(44, 45, F - 8, 'B');
    L.row(52, 53, F - 8, 'B');
    L.set(45, F - 4, '?');
    L.set(52, F - 4, 'm');
    L.pipe(48, 3);
    L.spawn('piranha', 48, 0);
    L.coinRow(46, 51, F - 12);
    L.spawn('goomba', 54, F - 1);
    L.addDecor('caveBush', 43, F - 1, 2);
    L.addDecor('caveBush', 57, F - 1, 2);

    // --- Tramo 3: hueco pequeno (2 tiles) entre 56 y 57 ---
    L.ground(58, 65);

    // Bloque ? con flor
    L.set(60, F - 4, 'f');
    L.coinRow(60, 62, F - 8);
    L.addDecor('caveBush', 62, F - 1, 2);

    // Puente de piedra: a 3 tiles del suelo (alcanzable con margen) sobre un
    // foso de 5 tiles sin suelo
    L.set(66, F - 3, 'S');
    L.set(67, F - 3, 'S');
    L.set(68, F - 3, 'S');
    L.set(69, F - 3, 'S');
    L.set(70, F - 3, 'S');
    L.coinRow(66, 70, F - 7);
    L.ground(71, 134);
    L.spawn('koopa', 74, F - 1);
    L.spawn('goomba', 77, F - 1);
    L.spawn('koopa', 80, F - 1);
    L.addDecor('caveBush', 76, F - 1, 2);
    L.addDecor('caveBush', 82, F - 1, 2);

    // Bloques ? y ladrillos de despedida
    L.set(84, F - 4, '?');
    L.set(85, F - 4, 'B');
    L.set(86, F - 4, 'B');
    L.set(87, F - 4, '?');
    L.coinRow(84, 87, F - 8);
    L.addDecor('caveBush', 88, F - 1, 2);

    // Escalon ascendente corto
    L.set(90, F - 4, 'S');
    L.set(90, F - 8, 'S');
    L.set(91, F - 4, 'S');
    L.set(92, F - 4, 'S');

    // Suelo hasta la meta
    L.ground(93, 110);
    L.spawn('koopa', 96, F - 1);
    L.addDecor('caveBush', 98, F - 1, 2);

    // Escalinata final hacia la bandera
    for (let i = 0; i < 8; i++) {
        for (let h = 0; h <= i; h++) {
            L.set(116 + i, F - 1 - h, 'S');
        }
    }

    // Asta de la bandera y "castillo" de la cueva (misma posicion que el 1-1)
    L.flagX = 128 * L.tileSize;
    L.poleX = L.flagX + 12;                     // eje del asta
    L.poleTopY = L.floorY - 180;                // cima del asta
    L.castleX = 131 * L.tileSize;
    L.castleW = 16 * 4;
    L.castleH = 16 * 4;

    // Punto de partida
    L.playerStart = { x: 64, y: F * L.tileSize - 28 };

    // Decoracion final
    L.addDecor('caveBush', 100, F - 1, 2);
    L.addDecor('stalactite', 126, 0, 2);

    return L;
}