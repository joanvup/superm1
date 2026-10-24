# Sesión — 2026-10-24 (6): Animación detallada de la meta

## Objetivo
Sustituir la secuencia de meta básica por la animación clásica de Super Mario Bros.

## Qué se hizo

### Secuencia en 5 fases (`js/game.js`, `checkFlag`)
| Fase | Qué hace |
|------|----------|
| `grab`  | Mario se agarra al asta y se centra en ella |
| `slide` | Se desliza por el asta mientras el banderín baja a velocidad constante |
| `hop`   | Saltito corto para soltarse del asta |
| `walk`  | Camina hacia la puerta del castillo |
| `enter` | Entra por la puerta y se desvanece (`alpha` -> 0) |

- **Puntos por altura** (como en SMB): agarrar el asta más arriba da más puntos,
  de ~862 (abajo) a ~4900 (cima). Se muestra un texto flotante con la cifra.
- **Robusto por diseño**: el `switch` incluye un `default` que remata la
  secuencia siempre, así que ningún estado corrupto puede volver a dejar a
  Mario bloqueado (el bug de la sesión anterior).
- El **temporizador se detiene** y **el mundo se congela** (enemigos y
  colisiones en pausa) durante la cinemática.
- `win()` libera `inputLocked`.

### Renderizado
- **El castillo ahora se dibuja** (`renderCastle`); el sprite `Sprite.castle`
  existía pero nunca se renderizaba.
- El asta se dibuja con brillo, esfera en la cima y bloque de base.
- Nuevo sprite `Sprite.flagBanner` (banderín triangular) que se une al asta por
  su borde vertical y **desciende con la animación**.
- Datos nuevos en `Level`: `poleX`, `poleTopY`, `castleW`, `castleH`.

### Soporte
- `Player`: flags `climbing` y `alpha`; nuevo método `advanceAnimation()` para
  animar sin aplicar física; `update()` sale temprano si `inputLocked` (la
  cinemática mueve a Mario directamente).
- `entities.js`: partícula `FloatingText` (texto de puntos que sube y se esfuma).
- `audio.js`: sonidos `slide` (barrido al bajar) y `levelClear` (fanfarria).

## Verificación (`flagtest.js` ampliado)
- **7 escenarios** de llegada a la meta (suelo, aire subiendo/cayendo, ya
  pasado el castillo, secuencia previa colgada) -> todos terminan en `win`.
- **Animación**: recorre `grab -> slide -> hop -> walk -> enter` en orden; el
  banderín desciende 242 -> 360 px, nunca sube y llega hasta abajo; Mario
  entra al castillo con `alpha = 0`; los enemigos quedan congelados.
- **Puntos**: crecen de forma monótona con la altura (862 -> 4115 pts) y no
  superan 5000.
- **Agarre a nivel de suelo**: el banderín igualmente recorre toda su
  trayectoria (antes se animaba a medias).
- El smoke test ahora también llama a `render()`, así que `renderCastle`,
  `renderFlag` y `FloatingText` se ejercitan de verdad.
- `node test.js` -> 34/34 OK. `node playtest.js` -> sin cambios de jugabilidad.

## Próximos pasos
- *(Extendible: niveles 2+, jefes, soporte táctil, música de victoria.)*