# Memoria del Proyecto - SuperM1

> Este archivo es el punto de entrada de contexto. Lee el al inicio de cada sesion para retomar el trabajo con rapidez.

---

## Estructura de esta memoria

| Ruta | Proposito |
|------|-----------|
| `README.md` | Indice general y contexto rapido (este archivo) |
| `sesiones/` | Registro cronologico de lo trabajado en cada sesion |
| `commits.md` | Que hay realmente en cada commit (varios mensajes no describen su contenido) |

---

## Estado actual del proyecto

- **Ultima actualizacion:** 2026-10-24
- **Fase:** Dos niveles completos y jugables (1-1 soleado y 2-1 cueva) con
  enemigos (goomba, koopa, piraña), power-ups, meta animada y musica por tema.
  Pendiente de ampliacion (mas niveles, jefes, tactil)

---

## Objetivo del proyecto

Crear un **juego de plataformas estilo Super Mario Bros** llamado **SuperM1**, en HTML5 + Canvas + JavaScript puro, con pixel art 8-bit generado proceduralmente y audio sintetizado con Web Audio API.

---

## Stack y tecnologias

- **Lenguaje:** JavaScript (ES6+) - sin dependencias externas
- **Renderizado:** HTML5 Canvas 2D (800x480)
- **Pixel art:** Sprites procedurales (matrices de strings, fillRect por pixel)
- **Audio:** Web Audio API (efectos + melodia de fondo sintetizados)
- **Estilo:** Clasico retro 8-bit estilo NES
- **Repositorio:** git en GitHub (github.com/joanvup/superm1), rama `master`

---

## Estructura del codigo

```
superm1/
|-- index.html          <- Entrada: canvas, HUD, overlay
|-- css/style.css       <- Estilos
`-- js/
    |-- sprites.js      <- Sprites pixel art
    |-- input.js        <- Teclado
    |-- physics.js      <- Fisica y colisiones
    |-- player.js       <- Jugador
    |-- entities.js     <- Enemigos y power-ups
    |-- level.js        <- Niveles 1-1 (cielo) y 2-1 (cueva)
    |-- audio.js        <- Audio sintetizado
    |-- game.js         <- Motor del juego
    `-- main.js         <- Bootstrap
```

### Herramientas de test (raiz)

```
superm1/
|-- test.js       <- Test unitario de fisica y logica (node test.js)
|-- playtest.js   <- Auditoria de jugabilidad: fisica, obstaculos y huecos del 1-1 y 2-1
`-- flagtest.js   <- Test de la animacion de la meta (usa la clase Game real)
```

---

## Hitos / Roadmap

- [x] Definir alcance y stack tecnologico
- [x] Crear estructura de carpetas y memoria del proyecto
- [x] Implementar sprites pixel art procedurales
- [x] Implementar input de teclado
- [x] Implementar fisica y colisiones
- [x] Implementar jugador (movimiento, salto, estados)
- [x] Implementar enemigos (goomba, koopa)
- [x] Implementar power-ups (hongo, flor)
- [x] Implementar bloques ?, ladrillos, monedas
- [x] Implementar nivel 1-1
- [x] Implementar audio (efectos + musica)
- [x] Implementar motor, camara, HUD, estados de juego
- [x] Probar el juego en navegador y corregir bugs
- [x] Inicializar repositorio git
- [x] Corregir la jugabilidad (salto y alcance) tras auditoria del nivel
- [x] Corregir la secuencia de la bandera (ya no deja a Mario bloqueado)
- [x] Anadir animacion de la bandera al llegar a la meta (5 fases + castillo)
- [x] Implementar nivel 2-1 (cueva): fondo, estrellas, estalactitas
- [x] Implementar planta piraña (sale/entra de tuberias, no se aplasta)
- [x] Encadenar 1-1 -> 2-1 conservando puntos y vidas + melodia de cueva
- [x] Ampliar la auditoria: techos que anulan el salto y barrido de timings
- [ ] *(Extendible: nivel 2-2, jefes, sonido mejorado, soporte tactil)*

---

## Decisiones importantes

- **JS puro sin frameworks** para maxima portabilidad (abrir `index.html` y jugar).
- **Sprites procedurales** (sin archivos de imagen) - todo se genera por codigo.
- **Tiles de 32px**, sprites 16x16 escalados x2.
- **3 estados del jugador**: normal, super (hongo), fuego (flor).
- **2 niveles encadenados**: 1-1 y 2-1 (cueva), ambos de 140 tiles. Al morir
  se vuelve al 1-1, como en SMB; los puntos y vidas se conservan entre niveles.
- **Tema por nivel** (`Level.theme`): decide fondo, decoracion y melodia.
- **Fisica del salto equilibrada** para que el nivel 1-1 sea superable (salto
  ~4.9 tiles, alcance ~6 tiles) tras auditar los obstaculos con `playtest.js`.
- **Colision de bloques ?** detectada desde el player (`onPlayerHitCeiling`).
- **Koopa con 3 estados**: camina, caparazon, pateado.

---

## Notas de sesiones

Cada sesion de trabajo se documenta en `sesiones/` con un archivo nombrado como:

```
sesiones/YYYY-MM-DD-tema.md
```

- `2026-10-24-inicio-memoria.md` - Creacion de la memoria del proyecto.
- `2026-10-24-desarrollo-superm1.md` - Desarrollo del juego (estructura y codigo completo).
- `2026-10-24-jugabilidad-salto.md` - Auditoria de jugabilidad y correccion de la fisica del salto.
- `2026-10-24-secuencia-bandera.md` - Bug en la secuencia de la bandera (Mario bloqueado) y su arreglo.
- `2026-10-24-animacion-meta.md` - Animacion de la bandera en 5 fases y castillo.
- `2026-10-24-nivel-2.md` - Nivel 2-1 (cueva), planta piraña y niveles encadenados.

---

## Recursos y enlaces

- Repositorio: https://github.com/joanvup/superm1
- Por lo demas el proyecto es 100% self-contained (sin imagenes ni librerias:
  pixel art y audio generados por codigo).

---

### Como mantener esta memoria

1. Al **iniciar** una sesion: lee este `README.md` y el ultimo archivo de `sesiones/`.
2. Al **terminar** una sesion: crea un nuevo archivo en `sesiones/` con lo trabajado.
3. Actualiza este README cuando el estado del proyecto cambie significativamente.
4. Al **comitear**: escribe un mensaje que describa el cambio (no los archivos
   tocados) y anade en el cuerpo la referencia a
   `sesiones/YYYY-MM-DD-tema.md`. Si un commit queda mal descrito, registralo
   en `commits.md`.