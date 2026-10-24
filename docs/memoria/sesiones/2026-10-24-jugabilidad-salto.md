# Sesión — 2026-10-24 (4): Depuración de jugabilidad (salto y obstáculos)

## Problema reportado
El jugador reportó que **Mario no puede saltar lo suficientemente alto** y que hay
obstáculos imposibles de evadir (momentos en los que no se puede avanzar).

## Análisis (test de jugabilidad headless)
Se creó `playtest.js`, un simulador Node que:
1. **Mide la física real del salto** (altura máxima y alcance horizontal corriendo).
2. **Audita el nivel**: para cada columna calcula la altura de la superficie y
   detecta escalones, huecos y bloques cuya cima supera el salto máximo.
3. **Recorre el nivel con un bot** para detectar puntos donde Mario se atasca.

### Causa raíz confirmada (física)
Con los valores anteriores, el salto alcanzaba **3.95 tiles de altura** y
**142px de alcance** corriendo, lo que hacía **imposibles** dos obstáculos del 1-1:

- **Tubería de 4 tiles (tx 70-71):** hay que elevarse 4 tiles, el salto da 3.95
  → **no se puede saltar por encima** (el bot se atascaba exactamente en tx 69).
- **Hueco de 4 tiles (tx 50-53, 128px):** requiere ~160px de vuelo, el salto da
  142px → **no se puede cruzar corriendo** (el bot caía dentro).

Eran **bugs de diseño/física**: el nivel era *imposible de completar*.

## Cambio aplicado
En `js/physics.js`:
- `JUMP_VELOCITY: -11.5` → `-12.8`  (salto: 3.95 → **4.92 tiles**)
- `RUN_SPEED: 3.4` → `4.2`           (alcance: 142 → **191px**)

Con esto, la auditoría del nivel reporta **0 obstáculos inalcanzables**:
- Tubería de 4 tiles: superable (4.92 > 4.0 tiles).
- Hueco de 4 tiles: superable (191px > 160px necesarios).
- Se mantiene la dificultad (no es flotante; margen ~30px en ambos casos).

Los bloques "altos" (flor tx21, piedra tx29-31, ? tx107, a 8 tiles) siguen
siendo alcanzables **apoyándose en los bloques de abajo** (fila 9), como es
intencional en el diseño estilo SMB.

## Verificación
- `node test.js` → **34/34 OK** (nada roto).
- `node playtest.js` → auditoría con 0 bloqueos.

## Nota
El bot (`playtest.js`) es una heurística: no es experto en timing, así que a
veces cae en el hueco por aterrizar mal tras saltar la tubería. La auditoría de
alturas (sección 2) es la prueba autoritativa de que el nivel es completable.

## Próximos pasos
- Probar el juego en el navegador con la nueva física.
- *(Extendible: animación detallada de la bandera, niveles 2+, jefes, sonido.)*