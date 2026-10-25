/* ====== SuperM1 — Sprites pixel art generados proceduralmente ======
   Cada sprite es una matriz de strings donde cada carácter es un color.
   ' ' = transparente. Escala: 16x16 píxeles por defecto.
*/

const Sprite = {
    // Paleta de colores
    COLORS: {
        // Mario
        marioRed: '#e52521',
        marioSkin: '#ff9b5e',
        marioBrown: '#7a3a1f',
        marioBlue: '#1f3f8f',
        marioYellow: '#ffe14d',
        marioWhite: '#ffffff',
        marioHair: '#4a2a0a',
        // Enemigos
        goombaBrown: '#8b4513',
        goombaDark: '#5a2d0c',
        goombaSkin: '#f0c090',
        koopaGreen: '#2d8f2d',
        koopaLight: '#6fbf3a',
        koopaSkin: '#ffd890',
        // Power-ups
        mushroomRed: '#e52521',
        mushroomSkin: '#ffe8c8',
        mushroomWhite: '#ffffff',
        mushroomDark: '#8b4513',
        // Bloques
        blockBrown: '#c86a20',
        blockDark: '#7a3a10',
        blockLight: '#f0b050',
        blockGold: '#ffd800',
        // Otros
        pipeGreen: '#2d9f2d',
        pipeDark: '#1a5a1a',
        pipeLight: '#9fff9f',
        brick: '#c06020',
        brickDark: '#7a3010',
        sky: '#5c94fc',
        cloudWhite: '#ffffff',
        cloudGray: '#d0d0d0',
        hillGreen: '#1a9f3a',
        hillDark: '#0a6a1a',
        flagRed: '#e52521',
        flagPole: '#c0c0c0',
        flagBase: '#7a3a10',
        // Tema subterraneo / cuevas
        caveBg: '#1a1a2e',      // fondo de cueva (morado oscuro)
        caveRock: '#5a4a6a',    // roca / estalactita
        caveStar: '#fff6c8',    // estrella
        caveBush: '#3a5a3a',    // arbusto oscuro de cueva
    },

    /* ====== Personaje principal: MARIO ======
       R = gorra/camiseta (roja o blanca)   S = piel
       H = pelo/bigote                      B = overall (azul o rojo)
       Y = botones                          */

    // Mario pequeno - 16x16
    marioIdle: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRRRR..',
        '....HHHSSHSS....',
        '...HSHSSSHSSS...',
        '...HHSHHSSSSSS..',
        '...HHSSSSSSSSS..',
        '....SSSSSSS.....',
        '...RRBRRRR......',
        '..RRRBRRBRRR....',
        '.RRRRBBBBRRRR...',
        'SSRBYYBBYYBRSS..',
        'SSSBYYYYYYBSSS..',
        'SS.BBBBBBBB.SS..',
        '...BBB..BBB.....',
        '..BBBBB.BBBBB...',
    ],

    // Mario corriendo (frame 1)
    marioRun1: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRRRR..',
        '....HHHSSHSS....',
        '...HSHSSSHSSS...',
        '...HHSHHSSSSSS..',
        '...HHSSSSSSSSS..',
        '....SSSSSSS.....',
        '...RRRBBBB......',
        '..RRRBBBBRRR....',
        '.RRRBBBBBBRRRR..',
        'SSRBBBBYYBBRS...',
        'SSSBBBBBBBBS....',
        '..BBBBBBBB......',
        '.BBB....BBB.....',
        'BBBB.....BBB....',
    ],

    // Mario corriendo (frame 2)
    marioRun2: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRRRR..',
        '....HHHSSHSS....',
        '...HSHSSSHSSS...',
        '...HHSHHSSSSSS..',
        '...HHSSSSSSSSS..',
        '....SSSSSSS.....',
        '...RRRBBBB......',
        '..RRRBBBBRRR....',
        '.RRRBBBBBBRRRR..',
        'SSRBBBBYYBBRSS..',
        '.SSBBBBBBBSSS...',
        '..BBBBBBBBBB....',
        '...BBB.BBB......',
        '..BBB...BBB.....',
    ],

    // Mario saltando
    marioJump: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRRRR..',
        '....HHHSSHSS....',
        '...HSHSSSHSSS...',
        '...HHSHHSSSSSS..',
        '...HHSSSSSSSSS..',
        '....SSSSSSS.....',
        '..RRRBBBBRRR....',
        '.RRRBBBBBBRRRR..',
        'SRRBBBBYYBBBRRS.',
        'SSRBBBBBBBBBRSS.',
        'SS.BBBBBBBBBB...',
        '...BBBB.BBBB....',
        '..BBBB...BBBB...',
        '.BBBB.....BBBB..',
    ],

    // Mario grande (super / fuego) - 16x26 (a escala 2 = 52px, coincide con hitbox)
    superMarioIdle: [
        '......RRRRR.....',
        '....RRRRRRRRR...',
        '...RRRRRRRRRRR..',
        '...HHHSSHSS.....',
        '..HSHSSSHSSS....',
        '..HHSHHSSSSSS...',
        '..HHSSSSSSSSS...',
        '...SSSSSSSS.....',
        '....RRRRRR......',
        '..RRRRRRRRRR....',
        '.RRRRRRRRRRRR...',
        '.RRRBBBBBBRRR...',
        '.RRBBBBBBBBRR...',
        'SSBYYYYBBYYYYBSS',
        'SSBYYYYBBYYYYBSS',
        'SSBBBBBBBBBBBBSS',
        'SS.BBBBBBBBBB.SS',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '...BBBB..BBBB...',
        '...BBBB..BBBB...',
        '...BBBB..BBBB...',
        '..BBBBB..BBBBB..',
        '..BBBB....BBBB..',
        '.BBBBB....BBBBB.',
    ],

    // Mario grande corriendo (frame 1) - pies abiertos
    superMarioWalk1: [
        '................',
        '......RRRRR.....',
        '....RRRRRRRRR...',
        '...RRRRRRRRRRR..',
        '...HHHSSHSS.....',
        '..HSHSSSHSSS....',
        '..HHSHHSSSSSS...',
        '..HHSSSSSSSSS...',
        '...SSSSSSSS.....',
        '....RRRRRR......',
        '..RRRRRRRRRR....',
        '.RRRRRRRRRRRR...',
        '.RRRBBBBBBRRR...',
        '.RRBBBBBBBBRR...',
        'SSBYYYYBBYYYYBSS',
        'SSBYYYYBBYYYYBSS',
        'SSBBBBBBBBBBBBSS',
        'SS.BBBBBBBBBB.SS',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '...BBBB..BBBB...',
        '...BBBB..BBBB...',
        '..BBBB....BBBB..',
        '.BBBB......BBBB.',
        '.BBBB......BBBB.',
        'BBBB........BBBB',
    ],

    // Mario grande corriendo (frame 2) - pies juntos
    superMarioWalk2: [
        '................',
        '......RRRRR.....',
        '....RRRRRRRRR...',
        '...RRRRRRRRRRR..',
        '...HHHSSHSS.....',
        '..HSHSSSHSSS....',
        '..HHSHHSSSSSS...',
        '..HHSSSSSSSSS...',
        '...SSSSSSSS.....',
        '....RRRRRR......',
        '..RRRRRRRRRR....',
        '.RRRRRRRRRRRR...',
        '.RRRBBBBBBRRR...',
        '.RRBBBBBBBBRR...',
        'SSBYYYYBBYYYYBSS',
        'SSBYYYYBBYYYYBSS',
        'SSBBBBBBBBBBBBSS',
        'SS.BBBBBBBBBB.SS',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '....BBBBBBBB....',
        '....BBBBBBBB....',
        '...BBBB..BBBB...',
        '..BBBBB..BBBBB..',
    ],

    // Mario grande saltando - piernas encogidas
    superMarioJump: [
        '................',
        '......RRRRR.....',
        '....RRRRRRRRR...',
        '...RRRRRRRRRRR..',
        '...HHHSSHSS.....',
        '..HSHSSSHSSS....',
        '..HHSHHSSSSSS...',
        '..HHSSSSSSSSS...',
        '....RRRRRR......',
        '..RRRRRRRRRR....',
        '.RRRRRRRRRRRR...',
        'SRRRBBBBBBRRRS..',
        'SSRBBBBBBBBRSS..',
        'SSBYYYYBBYYYYBSS',
        '.SBYYYYBBYYYYBS.',
        '..BBBBBBBBBBBB..',
        '..BBBBBBBBBBBB..',
        '...BBBBBBBBBB...',
        '...BBBBBBBBBB...',
        '..BBBBBBBBBBB...',
        '.BBBBBBB.BBBBB..',
        '.BBBBB....BBBB..',
        'BBBB.......BBBB.',
        'BBBB........BBB.',
        '................',
        '................',
    ],

    /* ====== ENEMIGOS ====== */

    // Goomba — 16x16
    goomba: [
        '................',
        '................',
        '....KKKKKKKK....',
        '..KKKKKKKKKKKK..',
        '.KKKKKKKKKKKKKK.',
        '.KKSSKKKKSSKKKK.',
        '.KKSSKKKKSSKKKK.',
        '.KKKKKKKKKKKKKK.',
        '.KKKKKSSKKKKKKK.',
        '.KKKKSSSSKKKKKK.',
        '.KKKKSSKKSSKKKK.',
        '.KKKKKSSSSKKKKK.',
        '..KKKKKKKKKKKK..',
        '...KKKKKKKKKK...',
        '...KKK..KKK.....',
        '................',
    ],

    // Koopa Troopa — 16x16
    koopa: [
        '................',
        '....GGGGGGGG....',
        '...GGGGGGGGGG...',
        '...GGLLLLLLGG...',
        '..GGLLSSSSLLGG..',
        '..GGLLSSSSLLGG..',
        '..GGGGGGGGGGGG..',
        '..GGSGGGGGGSSG..',
        '...SSSGGGGSSS...',
        '....SSGGGGSS....',
        '...GGGGGGGGGG...',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GG..GGGG..GG..',
        '..GG..GGGG..GG..',
        '................',
    ],

    // Caparazon de Koopa — 16x16
    koopaShell: [
        '................',
        '................',
        '....GGGGGGGG....',
        '...GGGGGGGGGG...',
        '..GGGLLLLLLGGG..',
        '..GGGLLLLLLGGG..',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '.GGGGGGGGGGGGGG.',
        '.GGGGGGGGGGGGGG.',
        '.GGGGGGGGGGGGGG.',
        '.GGGGGGGGGGGGGG.',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '................',
        '................',
    ],

    // Planta Piraña — 16x16
    piranha: [
        '....GGGGGGGG....',
        '...GGGGGGGGGG...',
        '..GGGGGGGGGGGG..',
        '.GGGRRGGGGRRGGG.',
        '.GGGRRGGGGRRGGG.',
        '.GGGGGGGGGGGGGG.',
        '.GGGWWGGGGWWGGG.',
        '.GGGWWGGGGWWGGG.',
        '.GGGGGGGGGGGGGG.',
        '....GGGGGGGG....',
        '....GGGGGGGG....',
        '....GGGGGGGG....',
        '....GGGGGGGG....',
        '....GGGGGGGG....',
        '....GG.GG.GG....',
        '................',
    ],

    /* ====== POWER-UPS ====== */

    // Super hongo — 16x16
    mushroom: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRR....',
        '...RWRRRRRRWR...',
        '..RWRRRRRRRRWR..',
        '..RWRRRRRRRRWR..',
        '..RWWWWWWWWWWR..',
        '...WWWWWWWWWW...',
        '....MMMMMMMM....',
        '...MMMMMMMMMM...',
        '...MMMM..MMMM...',
        '...MMMM..MMMM...',
        '...MMMMMMMMMM...',
        '...MMMMMMMMMM...',
        '....MMMMMMMM....',
        '................',
    ],

    // Flor de fuego — 16x16
    fireFlower: [
        '.....RRRRRR.....',
        '....RRRRRRRR....',
        '..RRWWWWWWWWRR..',
        '..RRWWWWWWWWRR..',
        '..RRRRRRRRRRRR..',
        '...RRRRRRRRRR...',
        '....RRRRRRRR....',
        '...GGGGGGGGGG...',
        '...GGGGGGGGGG...',
        '....GGGGGGGG....',
        '...GGGGGGGGGG...',
        '...GGG.GGG.GGG..',
        '...GGG.GGG.GGG..',
        '...GG..GGG..GG..',
        '..GGG..GGG..GGG.',
        '................',
    ],

    // Estrella (invincible) — 16x16
    star: [
        '................',
        '.......YY.......',
        '......YYYY......',
        '......YYYY......',
        '.....YYYYYY.....',
        '....YYYYYYYY....',
        '....YYYYYYYY....',
        '...YYYYYYYYYY...',
        '...YWWYYYYWWY...',
        '..YYWWWYYWWWYY..',
        '..YYYYYYYYYYYY..',
        '.YYYYYYYYYYYYYY.',
        '.YYYYYYYYYYYYYY.',
        '..YYYYYYYYYYYY..',
        '................',
        '................',
    ],

    // Moneda — 16x16
    coin: [
        '................',
        '....YYYYYYYY....',
        '...YYYYYYYYYY...',
        '..YYYYYYYYYYYY..',
        '..YYWWWYYWWWYY..',
        '.YYYYWWYYWWYYYY.',
        '.YYYYYWWWWYYYYY.',
        '.YYYYYWWWWYYYYY.',
        '.YYYYYWWWWYYYYY.',
        '.YYYYWWYYWWYYYY.',
        '..YYWWWYYWWWYY..',
        '..YYYYYYYYYYYY..',
        '...YYYYYYYYYY...',
        '....YYYYYYYY....',
        '................',
        '................',
    ],

    /* ====== TILES y OBJETOS ====== */

    // Bloque interrogante (16x16)
    questionBlock: [
        'MMMMMMMMMMMMMMMM',
        'MDDDDDDDDDDDDDDM',
        'MDDWWWWWWWWWWWDM',
        'MDDWWMMMMMMMWWDM',
        'MDDWMMMMMMMMWWDM',
        'MDDWMYYYMMYYYWDM',
        'MDDWMYYYYYYYYWDM',
        'MDDWMYYYMMYYYWDM',
        'MDDWMMMMYYMMWWDM',
        'MDDWMMMYYMMWWWDM',
        'MDDWMMMMYYMMWWDM',
        'MDDWMMMMMMMMWWDM',
        'MDDWMMMMMMMMWWDM',
        'MDDWWWWWWWWWWWDM',
        'MDDDDDDDDDDDDDDM',
        'MMMMMMMMMMMMMMMM',
    ],

    // Bloque ya usado (16x16)
    usedBlock: [
        'MMMMMMMMMMMMMMMM',
        'MDDDDDDDDDDDDDDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDMMMMMMMMMMMMDM',
        'MDDDDDDDDDDDDDDM',
        'MMMMMMMMMMMMMMMM',
    ],

    // Bloque solido de piedra (16x16)
    solidBlock: [
        'WDDDDDDDDDDDDDDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DWMMMMMMMMMMMMDM',
        'DMMMMMMMMMMMMMDM',
        'MMeeeeeeeeeeeeee',
        'MMMMMMMMMMMMMMMM',
    ].map(r => r.replace(/e/g, 'D')),

    // Ladrillo (16x16)
    brick: [
        'MMMMMMMMMMMMMMMM',
        'MbbbbdbbbbbdbbbM',
        'MbbbbdbbbbbdbbbM',
        'dbbbbbbbbbbbbbbd',
        'bbbbbdbbbbbdbbbb',
        'bbbbbdbbbbbdbbbb',
        'dbbbbbbbbbbbbbbd',
        'MbbbbdbbbbbdbbbM',
        'MbbbbdbbbbbdbbbM',
        'dbbbbbbbbbbbbbbd',
        'bbbbbdbbbbbdbbbb',
        'bbbbbdbbbbbdbbbb',
        'dbbbbbbbbbbbbbbd',
        'MbbbbdbbbbbdbbbM',
        'MMMMMMMMMMMMMMMM',
        'MMMMMMMMMMMMMMMM',
    ],

    /* Tuberia verde: 4 piezas de 8x8 (escala 4 = 32px).
       Se eligen segun posicion: boca arriba o cuerpo, columna izq o der. */
    pipeTopL: [
        'PPPPPPPP',
        'PPLLLLLL',
        'PPLLLLLL',
        'PPPPPPPP',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
    ],
    pipeTopR: [
        'PPPPPPPP',
        'LLLLLLDP',
        'LLLLLLDP',
        'PPPPPPPP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
    ],
    pipeBodyL: [
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
        'PWLLLLLL',
    ],
    pipeBodyR: [
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
        'LLLLLDDP',
    ],

    // Banderin de meta (16x12). F = color de la bandera. El borde vertical
    // derecho queda unido al asta y la hipotenusa apunta hacia arriba-izquierda.
    flagBanner: [
        'FFFFFFFFFFFFFFFF',
        '.FFFFFFFFFFFFFFF',
        '..FFFFFFFFFFFFFF',
        '...FFFFFFFFFFFFF',
        '....FFFFFFFFFFFF',
        '.....FFFFFFFFFFF',
        '......FFFFFFFFFF',
        '.......FFFFFFFFF',
        '........FFFFFFFF',
        '.........FFFFFFF',
        '..........FFFFFF',
        '...........FFFFF',
    ],

    // Bandera de meta (asta + triangulo verde), 16x16
    flag: [
        '..GGGGGGGGGGGG..',
        '..GWWWWWWWWWWG..',
        '..GWWWWWWWWWWG..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
        '..GWWWWWWWWWWW..',
    ],

    // Castillo simple (16x16). M = ladrillo, D = oscuro, U = puerta
    castle: [
        'DM.MD..DD..DM.MD',
        'DMMMMMMMMMMMMMMD',
        'DMMMMMMMMMMMMMMD',
        'DMDDMDMDDMDMDDMD',
        'DMDDMDMDDMDMDDMD',
        'DMDDMDMDDMDMDDMD',
        'DMMMMMMMMMMMMMMD',
        'DMDDMMMMMMDDMMMD',
        'DMDDMMMMMMDDMMMD',
        'DMDDDUUUUDDMMMDD',
        'DMDDDUUUUDDMMMDD',
        'DMDDDUUUUDDMMMDD',
        'DMDDDUUUUDDMMMDD',
        'DMDDDUUUUDDMMMDD',
        'DMDDDUUUUDDMMMDD',
        'DMMMMMMMMMMMMMMD',
    ],

    /* ====== ESCENARIO ====== */

    // Nube (16x12)
    cloud: [
        '................',
        '......WWWW......',
        '....WWWWWWWW....',
        '..WWWWWWWWWWWW..',
        '.WWWWWWWWWWWWWW.',
        '.WWCCWWWWCCWWWW.',
        'WWWCCWWWWCCWWWWW',
        'WWWWWWWWWWWWWWWW',
        '.WWWWWWWWWWWWWW.',
        '..WWWWWWWWWWWW..',
        '...WWWWWWWWWW...',
        '................',
    ],

    // Arbusto (16x12)
    bush: [
        '................',
        '................',
        '.....NNNN.......',
        '...NNNNNNNN.....',
        '..NNNNNNNNNNN...',
        '.NNNNNNNNNNNNN..',
        '.NNNNNNNNNNNNNN.',
        '.NNNQDNNNNQDNNN.',
        'NNNNQDNNNNQDNNNN',
        'NNNNNNNNNNNNNNNN',
        '..NNNNNNNNNNNN..',
        '................',
    ],

    // Colina (32x16)
    hill: (function() {
        const rows = [];
        for (let y = 0; y < 16; y++) {
            let row = '';
            for (let x = 0; x < 32; x++) {
                // Forma de colina
                const dx = x - 15.5;
                const dy = y - 8;
                const dist = Math.sqrt(dx * dx / (15 * 15) + dy * dy / (8 * 8));
                if (dist <= 1.0) {
                    row += dist > 0.86 ? 'Q' : 'N';
                } else {
                    row += '.';
                }
            }
            rows.push(row);
        }
        return rows;
    })(),

    // Estrella (8x8) para el fondo de cueva
    star: [
        '....D...',
        '..DD.DD.',
        '...DDD..',
        '.DDDDDD.',
        '..DDDDD.',
        '...DDD..',
        '..DD.DD.',
        'D...D...',
    ],

    // Estalactita (16x12) cuelga del techo de la cueva
    stalactite: [
        '.....CCCCC.....',
        '....CCCCCCC....',
        '....CC.CCC.....',
        '...CC..CCCC....',
        '...CC...CC.....',
        '..CC....CC.....',
        '..CC....CC.....',
        '..C.....CC.....',
        '.CC.....CC.....',
        'CC......CC.....',
        'C.......CC.....',
        'C.......C......',
    ],

    // Arbusto de cueva (16x12), mas oscuro que el de arriba
    caveBush: [
        '................',
        '................',
        '................',
        '................',
        '......CCC.......',
        '....CCCCCCC.....',
        '...CCCCCCCCC....',
        '..CCCCCCCCCCC...',
        '.CCCCCCCCCCCCC..',
        '.CCCCCCCCCCCCC..',
        '.CCCCCCCCCCCCC..',
        '................',
    ],
};

/* ====== Paleta base por carácter ======
   Los sprites usan un carácter por color. Para Mario se puede sobreescribir
   la paleta según su estado (normal / fuego) mediante el argumento `palette`. */
const BASE_PALETTE = {
    B: Sprite.COLORS.marioBlue,   // overall / contorno
    b: Sprite.COLORS.brick,       // cuerpo del ladrillo
    d: Sprite.COLORS.brickDark,    // sombra del ladrillo
    R: Sprite.COLORS.marioRed,    // gorra y camiseta
    S: Sprite.COLORS.marioSkin,   // piel
    H: Sprite.COLORS.marioHair,   // pelo
    W: Sprite.COLORS.marioWhite,
    Y: Sprite.COLORS.marioYellow,
    K: Sprite.COLORS.goombaBrown,
    O: Sprite.COLORS.goombaDark,
    G: Sprite.COLORS.koopaGreen,
    L: Sprite.COLORS.koopaLight,
    D: Sprite.COLORS.blockDark,
    M: Sprite.COLORS.blockBrown,
    '?': Sprite.COLORS.blockDark,
    P: Sprite.COLORS.pipeGreen,
    F: Sprite.COLORS.flagRed,
    C: Sprite.COLORS.cloudGray,
    N: Sprite.COLORS.hillGreen,    // vegetacion
    Q: Sprite.COLORS.hillDark,     // vegetacion oscura
};

/* Paletas alternativas para los estados de Mario */
const MARIO_PALETTES = {
    normal: {},
    super: {},
    fire: { R: '#ffffff', B: '#e52521' }, // blanco + rojo
};

/* ====== Función para dibujar un sprite en el canvas ====== */
function drawSprite(ctx, sprite, x, y, scale, palette) {
    const s = scale || 1;
    for (let row = 0; row < sprite.length; row++) {
        const line = sprite[row];
        for (let col = 0; col < line.length; col++) {
            const ch = line[col];
            if (ch === '.' || ch === ' ') continue;
            const color = (palette && palette[ch]) || BASE_PALETTE[ch] || '#ffffff';
            ctx.fillStyle = color;
            ctx.fillRect(x + col * s, y + row * s, s, s);
        }
    }
}

/* ====== Devuelve la paleta de Mario según su estado ====== */
function getMarioColors(state) {
    return MARIO_PALETTES[state] || MARIO_PALETTES.normal;
}