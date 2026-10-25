# Correspondencia commits / sesiones - SuperM1

> Los mensajes de los commits `6515179` y `da5cc9a` no describen el trabajo que
> contienen (los genero una herramienta externa). Ya estan pusheados, asi que la
> decision fue **no reescribir el historial** y documentar aqui la correspondencia.
> Esta tabla es la fuente fiable de que hay en cada commit.

---

## Mapa commit -> trabajo real

| Commit | Mensaje del commit | Que contiene realmente | Sesion |
|--------|--------------------|------------------------|--------|
| `276cfd6` | Initial commit: SuperM1 game structure and logic | Estructura completa del juego (todos los modulos `js/`, `css/`, `index.html`) **mas** `test.js`, `server.js`, `run.bat`, `package.json`. Agrupa el trabajo de 3 sesiones | 1, 2, 3 |
| `4e92efe` | docs: Actualizar roadmap, memoria de sesion y soporte Git | Solo documentacion: nota de la sesion 3 y roadmap. *Aunque el mensaje menciona "soporte Git", no toca nada de Git* | 3 |
| `6010a75` | refactor: add headless playtest simulator and update player physics to make 1-1 level fully clearable | **Exacto.** `playtest.js` nuevo + ajuste de fisica en `js/physics.js` + nota de sesion | 4 |
| `6515179` | feat: implement game loop, level management, and project documentation for SuperM1 | **Inexacto.** Es el **fix de la bandera** que dejaba a Mario bloqueado: `win()` directo en lugar de `setTimeout`, `flagtest.js` nuevo y nota de sesion | 5 |
| `da5cc9a` | feat: add player, audio, sprites, and core game logic modules | **Inexacto.** Es la **animacion de la meta en 5 fases**: `checkFlag` reescrito (+222 lineas en `game.js`), render del castillo, sprite `flagBanner`, `FloatingText`, sonidos `slide`/`levelClear`, flags `climbing`/`alpha`, `advanceAnimation()` y nota de sesion | 6 |
| `d0a5164` | docs: add project documentation and commit history mapping in memoria | **Exacto.** Crea `commits.md`, actualiza `README.md` de memoria y las notas de sesion 4 y 5 | 6 |
| `9580e25` | feat: nivel 2-1 (cueva), planta pirana y niveles encadenados | **Exacto.** Nivel 2-1, `Piranha`, encadenado 1-1 -> 2-1, musica de cueva, auditoria ampliada y correccion de varios obstaculos imposibles (tambien en el 1-1) | 7 |

---

## Notas de aclaracion

- **No se anadio ningun modulo nuevo en `da5cc9a`** pese a lo que dice su
  mensaje: `player.js`, `audio.js`, `sprites.js` y `game.js` existen desde
  `276cfd6`. Ese commit modifica modulos existentes, no los anade.
- **El trabajo de la sesion 3 esta repartido**: el codigo (`test.js`,
  `server.js`, refactor de fisica) fue al commit inicial `276cfd6`, y solo la
  documentacion fue a `4e92efe`.
- El **fix de la bandera** de la sesion 5 tambien afecto a `js/game.js`, asi que
  la version actual de ese archivo es la suma de `6515179` (fix) + `da5cc9a`
  (animacion).

---

## Decision: no reescribir el historial

`6515179` y `da5cc9a` ya estan en `origin/master`, por lo que corregir sus
mensajes requeriria `git push --force` sobre historial compartido. Se decide
dejarlos y usar esta tabla como referencia.

### Para los proximos commits
- Describir el **cambio**, no los archivos tocados
  ("fix: Mario ya no queda bloqueado al tocar la bandera", no "update game.js").
- Usar el prefijo correcto: `fix:` para bugs, `feat:` para funcionalidad nueva,
  `docs:` para documentacion, `test:` para pruebas.
- Mencionar la sesion de `docs/memoria/sesiones/` correspondiente en el cuerpo
  del mensaje, para enlazar historial y memoria en ambas direcciones.
