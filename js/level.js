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
        this.castleX = 0;   // pixels
        this.playerStart = { x: 64, y: 0 };

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

    // Zona de ladrillos con koopa arriba
    L.row(64, 69, F - 4, 'B');
    L.set(66, F - 4, '?');
    L.coinRow(64, 69, F - 8);
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
    L.castleX = 131 * L.tileSize;

    // Punto de partida del jugador
    L.playerStart = { x: 64, y: F * L.tileSize - 28 };

    // Decoracion final
    L.addDecor('cloud', 96, 2, 2);
    L.addDecor('bush', 98, F - 1, 2);
    L.addDecor('hill', 122, F - 4, 2);

    return L;
}