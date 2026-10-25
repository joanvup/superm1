/* ====== SuperM1 - Motor principal del juego ====== */

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = 'menu';
        this.level = null;
        this.player = null;
        this.entities = [];
        this.particles = [];
        this.cameraX = 0;
        this.currentLevel = 1;   // nivel actual (1 = 1-1, 2 = 2-1 cuevas)

        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timerAccum = 0;

        this.audio = new GameAudio();

        this.scoreEl = document.getElementById('score');
        this.coinsEl = document.getElementById('coins');
        this.timeEl = document.getElementById('time');
        this.livesEl = document.getElementById('lives');
        this.worldEl = document.getElementById('world');
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMsg = document.getElementById('overlay-message');

        this.startLevel();
        this.bindKeys();
        this.updateHUD();
    }

    // ----- Inicializacion del nivel -----

    /* Carga el nivel `n` (1 o 2). Devuelve true si el nivel existe. */
    startLevel(n = 1) {
        if (n === 1) this.level = buildLevel1();
        else if (n === 2) this.level = buildLevel2();
        else return false;

        this.currentLevel = n;
        this.entities = [];
        this.particles = [];

        for (const s of this.level.spawns) {
            if (s.type === 'goomba') this.entities.push(new Goomba(s.x, s.y));
            else if (s.type === 'koopa') this.entities.push(new Koopa(s.x, s.y));
            else if (s.type === 'piranha') {
                const p = new Piranha(s.x, s.y);
                p.initFromLevel(this.level);
                this.entities.push(p);
            }
        }

        this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
        this.cameraX = 0;
        this.time = 400;
        this.timerAccum = 0;
        this.flagSeq = null; // estado de la secuencia de la bandera
        this.updateHUD();    // refleja el mundo nuevo (1-1 / 2-1) al instante
        return true;
    }

    /* Reinicia el nivel actual al morir (vuelve al 1-1, como en SMB). */
    resetLevel() {
        this.startLevel(1);
        this.setState('playing');
        this.audio.startMusic(this.level.theme);
    }

    gameOver() {
        this.setState('gameover');
        this.audio.stopMusic();
        this.overlayTitle.textContent = 'GAME OVER';
        this.overlayMsg.textContent = 'Pulsa R para reintentar';
    }

    /* Completar un nivel: si no es el ultimo, pasa al siguiente. */
    win() {
        this.audio.stopMusic();
        if (this.player) this.player.inputLocked = false;

        if (this.currentLevel < 2) {
            // Pasa al nivel siguiente conservando puntuacion y vidas
            const next = this.currentLevel + 1;
            this.audio.playSound('levelClear');
            this.startLevel(next);
            this.setState('playing');
            this.audio.startMusic(this.level.theme);
        } else {
            // Ultimo nivel completado
            this.setState('win');
            this.overlayTitle.textContent = 'FELICIDADES';
            this.overlayMsg.textContent = 'Has completado SuperM1 - Pulsa R para volver a jugar';
        }
    }

    setState(s) {
        this.state = s;
        const showOverlay = s === 'menu' || s === 'paused' || s === 'gameover' || s === 'win';

        if (showOverlay) {
            this.overlay.classList.remove('hidden');
            if (s === 'menu') {
                this.overlayTitle.textContent = 'SUPERM1';
                this.overlayMsg.textContent = 'Pulsa ENTER para comenzar';
            } else if (s === 'paused') {
                this.overlayTitle.textContent = 'PAUSA';
                this.overlayMsg.textContent = 'Pulsa P para continuar';
            }
        } else {
            this.overlay.classList.add('hidden');
        }
    }

    // ----- Eventos -----

    bindKeys() {
        window.addEventListener('keydown', (e) => {
            const code = e.code;
            this.audio.ensureContext();

            if ((this.state === 'menu') && (code === 'Enter' || code === 'Space')) {
                console.log('SUPERM1: Juego iniciado');
                this.setState('playing');
                this.audio.startMusic(this.level.theme);
            }
            else if (this.state === 'paused' && code === Input.CODES.PAUSE) {
                this.setState('playing');
                this.audio.startMusic(this.level.theme);
            }
            else if (this.state === 'playing' && code === Input.CODES.PAUSE) {
                this.setState('paused');
                this.audio.stopMusic();
            }
            else if ((this.state === 'gameover' || this.state === 'win') && code === Input.CODES.RESTART) {
                this.lives = 3;
                this.score = 0;
                this.coins = 0;
                this.resetLevel();
            }
        });
    }

    // ----- Loop principal -----

    start() {
        let lastTime = performance.now();
        const loop = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            this.update(dt);
            this.render();
            Input.endFrame();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // ----- Actualizacion -----

    update(dt) {
        if (this.state !== 'playing') return;

        // Temporizador de nivel (se detiene durante la secuencia de meta)
        this.timerAccum += this.flagSeq ? 0 : dt;
        if (this.timerAccum >= 1) {
            this.timerAccum -= 1;
            this.time--;
            this.updateHUD();
            if (this.time <= 0) {
                this.player.die(this);
                return;
            }
        }

        this.player.update(Input, this.level, this);

        // Durante la secuencia de meta el mundo se congela: ni enemigos ni
        // colisiones (Mario esta en cinematica).
        if (this.flagSeq && !this.flagSeq.done) {
            this.checkFlag();
        } else {
            for (const e of this.entities) e.update(this.level, this);

            // Colisiones con entidades (antes de filtrar)
            this.handleEntityCollisions();
            this.handleCoins();
            this.handlePowerUps();
            this.checkFlag();

            this.entities = this.entities.filter(e => !e.remove);
        }

        for (const p of this.particles) p.update();
        this.particles = this.particles.filter(p => !p.remove);

        // Camara
        const half = this.canvas.width / 2;
        let target = this.player.x - half;
        target = Math.max(0, Math.min(target, this.level.width * this.level.tileSize - this.canvas.width));
        this.cameraX += (target - this.cameraX) * 0.15;
    }

    handleEntityCollisions() {
        const p = this.player;
        if (!p.alive) return;

        for (const e of this.entities) {
            if (e.remove) continue;
            // Los power-ups se recogen en handlePowerUps
            if (e.isPowerUp) continue;
            // Enemigos aplastados no hacen dano
            if (e.squished) continue;

            if (!Physics.aabb(p.x, p.y, p.width, p.height, e.x, e.y, e.width, e.height)) continue;

            // Las plantas pirana no se aplastan: se toque por donde se toque,
            // hacen dano (noStomp).
            const fallingOnto = p.vy > 0 && (p.y + p.height - e.y) < e.height * 0.6;
            if (fallingOnto && !e.noStomp) {
                p.vy = -6;
                e.squish(this);
            } else {
                p.getHit(this);
            }
        }
    }

    handlePowerUps() {
        const p = this.player;
        if (!p.alive) return;

        for (const e of this.entities) {
            if (!e.isPowerUp || e.remove) continue;
            if (Physics.aabb(p.x, p.y, p.width, p.height, e.x, e.y, e.width, e.height)) {
                e.collect(this);
            }
        }
    }

    handleCoins() {
        const p = this.player;
        for (const c of this.level.coins) {
            if (c.taken) continue;
            if (Physics.aabb(p.x, p.y, p.width, p.height, c.x, c.y, 28, 30)) {
                c.taken = true;
                this.coins++;
                this.score += 200;
                this.audio.playSound('coin');
                if (this.coins % 100 === 0) {
                    this.lives++;
                    this.audio.playSound('1up');
                }
                this.particles.push(new CoinEffect(c.x, c.y - 30));
                this.updateHUD();
            }
        }
    }

    // Se llama cuando el jugador golpea el techo de un tile
    onPlayerHitCeiling(player, collision) {
        // Los tiles golpeados vienen en el resultado de la colision
        for (const t of collision.ceilingTiles) {
            const tile = this.level.get(t.tx, t.ty);
            if (tile === '?' || tile === 'm' || tile === 'f' || tile === 'B') {
                this.hitBlock(t.tx, t.ty, tile);
            }
        }
    }

    hitBlock(tx, ty, t) {
        const ts = this.level.tileSize;
        const px = tx * ts;
        const py = ty * ts;

        if (t === 'B') {
            if (this.player.state === 'super' || this.player.state === 'fire') {
                this.level.set(tx, ty, '.');
                this.audio.playSound('break');
                this.spawnBrickParticles(px, py);
                this.score += 50;
            } else {
                this.audio.playSound('bump');
            }
        } else if (t === '?' || t === 'm' || t === 'f') {
            this.level.set(tx, ty, 'u');
            if (t === '?') {
                this.spawnCoinFromBlock(px, py);
            } else if (t === 'm') {
                this.spawnPowerUp('mushroom', px, py);
            } else if (t === 'f') {
                this.spawnPowerUp('flower', px, py);
            }
        }
        this.updateHUD();
    }

    spawnCoinFromBlock(px, py) {
        this.entities.push(new CoinEffect(px, py - 32));
        this.coins++;
        this.score += 200;
        this.audio.playSound('coin');
        if (this.coins % 100 === 0) {
            this.lives++;
            this.audio.playSound('1up');
        }
    }

    spawnPowerUp(type, px, py) {
        let e;
        if (type === 'mushroom') e = new Mushroom(px, py);
        else e = new FireFlower(px, py);
        this.entities.push(e);
    }

    spawnBrickParticles(px, py) {
        for (let i = 0; i < 4; i++) {
            const vx = (i % 2 === 0 ? -1 : 1) * (1.5 + Math.random());
            const vy = -6 + Math.random() * -2;
            this.particles.push(new BrickParticle(px, py, vx, vy));
        }
    }

    /* Secuencia de meta estilo SMB, en fases:
         grab  -> Mario se agarra al asta en la altura a la que llego
         slide -> se desliza hasta el suelo mientras el banderin baja con el
         hop   -> salto corto para soltarse del asta
         walk  -> camina hasta la puerta del castillo
         enter -> entra y desaparece dentro del castillo
       Termina siempre llamando a win() de forma directa (sin setTimeout),
       para no dejar nunca a Mario bloqueado. */
    checkFlag() {
        const p = this.player;

        // Activar la secuencia al tocar el asta
        if (p.alive && p.x + p.width > this.level.flagX && !p.flagReached) {
            p.flagReached = true;
            p.inputLocked = true;
            p.climbing = true;
            p.vx = 0;
            p.vy = 0;
            p.facing = 1;

            // Puntos por la altura a la que agarro el asta (como en SMB:
            // cuanto mas arriba, mas puntos).
            const poleH = this.level.floorY - this.level.poleTopY;
            const reached = Math.max(0, Math.min(1, (this.level.floorY - p.y) / poleH));
            const bonus = Math.round(100 + reached * 4900);
            this.score += bonus;
            this.spawnFloatingText(`+${bonus}`, this.level.flagX - 20, p.y - 20);

            this.flagSeq = {
                phase: 'grab',
                t: 0,
                flagY: this.flagStartY(),
                done: false,
            };
            this.audio.playSound('flag');
            this.updateHUD();
        }

        const seq = this.flagSeq;
        if (!seq || seq.done) return;

        seq.t += 1 / 60;
        p.inputLocked = true;
        p.vx = 0;

        const ts = this.level.tileSize;
        // El asta: Mario queda montado sobre ella (pies en el eje del asta)
        const poleFeetX = this.level.poleX - p.width / 2;

        switch (seq.phase) {
            case 'grab': {
                p.x += (poleFeetX - p.x) * 0.35;  // se centra en el asta
                p.vy = 0;
                if (seq.t > 0.25) { seq.t = 0; seq.phase = 'slide'; this.audio.playSound('slide'); }
                break;
            }

            case 'slide': {
                // Mario se desliza por el asta y el banderin baja a velocidad
                // constante (siempre se anima, aunque agarro el asta abajo).
                const groundY = this.level.floorY - p.height;
                if (p.y < groundY) p.y = Math.min(p.y + 4.5, groundY);
                p.vy = 0;
                seq.flagY = Math.min(this.flagEndY(), seq.flagY + 2);
                p.advanceAnimation(0.09);
                if (p.y >= groundY && seq.flagY >= this.flagEndY()) {
                    p.onGround = true;
                    p.climbing = false;
                    seq.t = 0;
                    seq.phase = 'hop';
                }
                break;
            }

            case 'hop': {
                // Saltito corto para soltarse del asta, mirando a la derecha
                if (seq.t < 0.001) { p.vy = -5.5; p.onGround = false; p.facing = 1; }
                p.vy = Math.min(p.vy + Physics.GRAVITY, Physics.MAX_FALL_SPEED);
                p.y += p.vy;
                const groundY = this.level.floorY - p.height;
                if (p.y >= groundY) { p.y = groundY; p.vy = 0; p.onGround = true; }
                if (p.onGround && seq.t > 0.2) { seq.t = 0; seq.phase = 'walk'; }
                break;
            }

            case 'walk': {
                // Camina hasta la puerta (centro del castillo)
                const doorX = this.doorX() - 40;
                p.x += 2.4;
                p.facing = 1;
                p.advanceAnimation(0.09);
                if (p.x >= doorX) {
                    seq.t = 0;
                    seq.phase = 'enter';
                    this.audio.playSound('levelClear');
                }
                break;
            }

            case 'enter': {
                // Entra por la puerta y se desvanece dentro del castillo
                const target = this.doorX();
                if (p.x < target) {
                    p.x = Math.min(p.x + 2.4, target);
                    p.advanceAnimation(0.09);
                } else {
                    p.alpha = Math.max(0, 1 - seq.t / 0.6);
                }
                if (seq.t > 0.6) {
                    p.hidden = true;
                    seq.done = true;
                    this.win();
                }
                break;
            }
            default: {
                // Fase desconocida o estado corrompido: rematar siempre para no
                // dejar nunca a Mario bloqueado (el bug original).
                p.alpha = 0;
                p.hidden = true;
                seq.done = true;
                this.win();
                break;
            }
        }
    }

    /* Centro de la puerta del castillo (x donde debe desaparecer Mario) */
    doorX() {
        return this.level.castleX + this.level.castleW / 2 - this.player.width / 2;
    }

    /* Posiciones del banderin: arriba (esperando) y abajo (al terminar) */
    flagStartY() { return this.level.poleTopY + 6; }
    flagEndY() { return this.level.floorY - 56; }

    /* Texto flotante de puntos */
    spawnFloatingText(text, x, y) {
        this.particles.push(new FloatingText(text, x, y));
    }

    // ----- Renderizado -----

    render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const cam = Math.floor(this.cameraX);

        // Fondo segun el tema del nivel (cielo azul o cueva oscura)
        ctx.fillStyle = this.level.theme === 'underground'
            ? Sprite.COLORS.caveBg : '#5c94fc';
        ctx.fillRect(0, 0, cw, ch);

        this.renderDecor(ctx, cam);
        this.renderTiles(ctx, cam);

        for (const c of this.level.coins) {
            if (c.taken) continue;
            drawSprite(ctx, Sprite.coin, Math.round(c.x - cam), c.y, 2);
        }

        this.renderCastle(ctx, cam);
        this.renderFlag(ctx, cam);

        for (const e of this.entities) e.draw(ctx, cam);
        this.player.draw(ctx, cam);

        for (const p of this.particles) p.draw(ctx, cam);
    }

    renderDecor(ctx, cam) {
        // Cada tipo de decoracion tiene su propio factor de paralaje.
        // Las estalactitas y los arbustos van a 1.0 porque estan anclados al
        // techo/suelo (que no tiene paralaje): con otro factor flotarian.
        const PARALLAX = { star: 0.15, stalactite: 1, cloud: 0.5, hill: 0.5, bush: 1, caveBush: 1 };

        for (const d of this.level.decor) {
            const factor = PARALLAX[d.type] || 0.5;
            const dx = Math.round(d.x - cam * factor);
            if (dx < -120 || dx > this.canvas.width + 120) continue;
            if (d.type === 'cloud') {
                drawSprite(ctx, Sprite.cloud, dx, d.y, 2 * (d.scale || 1), { G: '#5c94fc' });
            } else if (d.type === 'bush') {
                drawSprite(ctx, Sprite.bush, dx, d.y, 2 * (d.scale || 1));
            } else if (d.type === 'hill') {
                drawSprite(ctx, Sprite.hill, dx, d.y, 2 * (d.scale || 1));
            } else if (d.type === 'star') {
                drawSprite(ctx, Sprite.star, dx, d.y, 2 * (d.scale || 1),
                    { D: Sprite.COLORS.caveStar });
            } else if (d.type === 'stalactite') {
                drawSprite(ctx, Sprite.stalactite, dx, d.y, 2 * (d.scale || 1),
                    { C: Sprite.COLORS.caveRock });
            } else if (d.type === 'caveBush') {
                drawSprite(ctx, Sprite.caveBush, dx, d.y, 2 * (d.scale || 1),
                    { C: Sprite.COLORS.caveBush });
            }
        }
    }

    renderTiles(ctx, cam) {
        const ts = this.level.tileSize;
        const x0 = Math.max(0, Math.floor(cam / ts));
        const x1 = Math.min(this.level.width, x0 + Math.ceil(this.canvas.width / ts) + 1);

        for (let ty = 0; ty < this.level.height; ty++) {
            for (let tx = x0; tx < x1; tx++) {
                const t = this.level.get(tx, ty);
                if (t === '.') continue;

                const px = tx * ts - cam;
                const py = ty * ts;

                switch (t) {
                    case 'X':
                        drawSprite(ctx, Sprite.solidBlock, px, py, 2);
                        break;
                    case 'S':
                        drawSprite(ctx, Sprite.solidBlock, px, py, 2);
                        break;
                    case 'B':
                        drawSprite(ctx, Sprite.brick, px, py, 2);
                        break;
                    case '?':
                        drawSprite(ctx, Sprite.questionBlock, px, py, 2);
                        break;
                    case 'u':
                        drawSprite(ctx, Sprite.usedBlock, px, py, 2);
                        break;
                    case 'P':
                        this.drawPipe(ctx, px, py, tx, ty);
                        break;
                    default:
                        drawSprite(ctx, Sprite.usedBlock, px, py, 2);
                        break;
                }
            }
        }
    }

    drawPipe(ctx, px, py, tx, ty) {
        const above = this.level.get(tx, ty - 1);
        const isTop = above !== 'P';
        const isLeft = this.level.get(tx - 1, ty) === 'P';

        let sprite;
        if (isTop) {
            sprite = isLeft ? Sprite.pipeTopR : Sprite.pipeTopL;
        } else {
            sprite = isLeft ? Sprite.pipeBodyR : Sprite.pipeBodyL;
        }
        drawSprite(ctx, sprite, px, py, 4);
    }

    renderCastle(ctx, cam) {
        const x = Math.round(this.level.castleX - cam);
        if (x > this.canvas.width || x + this.level.castleW < 0) return;
        const y = this.level.floorY - this.level.castleH;
        drawSprite(ctx, Sprite.castle, x, y, 4);
    }

    renderFlag(ctx, cam) {
        const baseY = this.level.floorY;
        const poleX = Math.round(this.level.poleX - cam);
        const topY = this.level.poleTopY;

        // Fuera de pantalla: nada que dibujar
        if (poleX < -80 || poleX > this.canvas.width + 80) return;

        // Posicion del banderin: arriba esperando, y baja con Mario durante
        // el descenso (la fase 'slide' calcula seq.flagY).
        let flagY = this.flagStartY();
        if (this.flagSeq) flagY = this.flagSeq.done ? this.flagEndY() : this.flagSeq.flagY;

        // Asta
        ctx.fillStyle = Sprite.COLORS.flagPole;
        ctx.fillRect(poleX, topY, 6, baseY - topY);
        // Brillo del asta
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(poleX, topY, 2, baseY - topY);

        // Bola en la cima
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(poleX + 3, topY - 4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.arc(poleX + 5, topY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Base del asta
        drawSprite(ctx, Sprite.usedBlock, poleX - 13, baseY - 32, 2);

        // Banderin (sprite) a la izquierda del asta, como en SMB
        drawSprite(ctx, Sprite.flagBanner, Math.round(poleX - 60), Math.round(flagY), 4,
            { F: Sprite.COLORS.flagRed, D: '#9a1010' });
    }

    // ----- HUD -----

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = String(this.score).padStart(6, '0');
        if (this.coinsEl) this.coinsEl.textContent = String(this.coins).padStart(2, '0');
        if (this.timeEl) this.timeEl.textContent = String(this.time).padStart(3, '0');
        if (this.livesEl) this.livesEl.textContent = String(this.lives);
        if (this.worldEl) this.worldEl.textContent = `${this.currentLevel}-1`;
    }
}