# Sesión — 2026-10-24 (2): Desarrollo del juego SuperM1

## Objetivo
Crear un juego completo estilo Super Mario Bros en HTML5 + Canvas + JavaScript puro, con pixel art 8-bit generado proceduralmente.

## Qué se hizo

### Estructura de archivos creada
```
superm1/
├── index.html               ← Punto de entrada (canvas 800x480, HUD, overlay)
├── css/style.css            ← Estilos del juego (pixelated, overlay, HUD)
└── js/
    ├── sprites.js           ← Sprites pixel art (16x16, matrices de colores)
    ├── input.js             ← Teclado (flechas/WASD/espacio/shift/p/r)
    ├── physics.js           ← Gravedad, colisiones AABB con tiles
    ├── player.js            ← Jugador: movimiento, salto, estados, power-ups
    ├── entities.js          ← Goomba, Koopa, Mushroom, FireFlower, CoinEffect, partículas
    ├── level.js             ← Constructor del nivel 1-1 (140 tiles de ancho)
    ├── audio.js             ← Web Audio API: efectos y melodía de fondo
    ├── game.js              ← Motor: loop, cámara, colisiones, HUD, render
    └── main.js              ← Bootstrap en window.load
```

### Funcionalidades implementadas
- ✅ **Motor de juego**: game loop con requestAnimationFrame, estados (menú, jugando, pausa, game over, win)
- ✅ **Jugador**: movimiento con aceleración/fricción, salto variable (mantener = saltar más alto), correr con Shift, 3 estados (normal/super/fuego)
- ✅ **Enemigos**: Goomba (aplastable), Koopa (3 estados: camina/caparazón/pateado)
- ✅ **Nivel 1-1**: suelo continuo con 2 huecos, escaleras de bloques, tuberías, ladrillos, bloques ?, monedas
- ✅ **Power-ups**: hongo (crece), flor de fuego (estado fuego)
- ✅ **Bloques ?**: golpeables desde abajo, sueltan moneda/hongo/flor; bloques usados visibles
- ✅ **Ladrillos**: rompibles en modo super/fuego (con partículas)
- ✅ **Monedas**: estáticas en el nivel + de bloques ?, contador con 1UP cada 100
- ✅ **Bandera de meta**: al tocarla suma puntos y pasa a estado WIN
- ✅ **Cámara**: seguimiento suavizado del jugador con límites del mundo
- ✅ **HUD**: puntos, monedas, mundo, tiempo (timer regresivo), vidas
- ✅ **Audio**: efectos (salto, moneda, power-up, muerte, stomp, etc.) y música de fondo
- ✅ **Sprites 8-bit**: Mario (4 animaciones + super), goomba, koopa, hongo, flor, moneda, bloques, tubería, bandera, castillo, nubes, arbustos, colinas

## Problemas encontrados y resueltos
1. **Corrupción de escritura**: algunos archivos se escribieron con caracteres corruptos (`levelZero`, `blossom`, `落在`, etc.). Se detectó con grep de no-ASCII y se reescribieron limpios.
2. **Filas de sprites de longitud desigual**: `questionBlock` y `castle` tenían filas de 15 chars en vez de 16. Corregido.
3. **Hitbox vs sprite de Mario grande**: el sprite medía 64px pero el hitbox 52px. Rediseñado a 26 filas (52px a escala 2).
4. **Golpe a bloques ?**: se rediseñó para detectar la colisión de techo desde el player (onPlayerHitCeiling) en vez de un chequeo separado en game.
5. **Encogimiento al recibir daño**: se añade `y += 24` al volver a normal para mantener los pies en el suelo.

## Decisiones tomadas
- **JavaScript puro sin dependencias**: solo HTML5 Canvas + Web Audio API.
- **Pixel art procedural**: los sprites son matrices de strings donde cada char es un color; se dibujan píxel a píxel con fillRect.
- **Tiles de 32px**: cada tile del nivel mide 32x32, los sprites 16x16 se escalan x2.
- **Paleta por estado de Mario**: normal (rojo+azul), super (igual), fuego (blanco+rojo).
- **Nivel único 1-1**: 140 tiles de ancho (4480 px), sin checkpoints.
- **Tuberías por piezas**: sprites de 8x8 para boca y cuerpo, izquierda/derecha.
- **Colisión de bloques ?**: se detecta cuando el jugador golpea el techo, no por proximidad.

## Próximos pasos
- Probar el juego en navegador y corregir bugs de lógica/colisión.
- Verificar el sonido con Web Audio API en distintos navegadores.
- Pulir la dificultad del nivel (posición de enemigos, huecos).
- Añadir animación de la bandera al llegar a la meta.
- Añadir pantalla de "mundo completado" con marcha.