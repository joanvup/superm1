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
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMsg = document.getElementById('overlay-message');

        this.startLevel();
        this.bindKeys();
        this.updateHUD();
    }

    // ----- Inicializacion del nivel -----

    startLevel() {
        this.level = buildLevel1();
        this.entities = [];
        this.particles = [];

        for (const s of this.level.spawns) {
            if (s.type === 'goomba') this.entities.push(new Goomba(s.x, s.y));
            else if (s.type === 'koopa') this.entities.push(new Koopa(s.x, s.y));
        }

        this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
        this.cameraX = 0;
        this.time = 400;
        this.timerAccum = 0;
        this.flagSeq = null; // estado de la secuencia de la bandera
    }

    resetLevel() {
        this.startLevel();
        this.setState('playing');
        this.audio.startMusic();
    }

    gameOver() {
        this.setState('gameover');
        this.audio.stopMusic();
        this.overlayTitle.textContent = 'GAME OVER';
        this.overlayMsg.textContent = 'Pulsa R para reintentar';
    }

    win() {
        this.setState('win');
        this.audio.stopMusic();
        this.overlayTitle.textContent = 'NIVEL COMPLETADO';
        this.overlayMsg.textContent = 'Pulsa R para volver a jugar';
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
                this.audio.startMusic();
            }
            else if (this.state === 'paused' && code === Input.CODES.PAUSE) {
                this.setState('playing');
                this.audio.startMusic();
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

        // Temporizador de nivel
        this.timerAccum += dt;
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

        for (const e of this.entities) e.update(this.level, this);

        // Colisiones con entidades (antes de filtrar)
        this.handleEntityCollisions();
        this.handleCoins();
        this.handlePowerUps();
        this.checkFlag();

        this.entities = this.entities.filter(e => !e.remove);

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

            const fallingOnto = p.vy > 0 && (p.y + p.height - e.y) < e.height * 0.6;
            if (fallingOnto) {
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

    checkFlag() {
        const p = this.player;
        if (p.alive && p.x + p.width > this.level.flagX && !p.flagReached) {
            p.flagReached = true;
            this.flagSeq = {
                t: 0,
                done: false,
            };
            this.audio.playSound('flag');
            this.score += 1000;
            this.updateHUD();
        }

        // Secuencia de la bandera: el jugador baja del asta y camina hasta el
        // castillo. Se completa de forma determinista (sin setTimeout) para que
        // nunca deje a Mario bloqueado (inputLocked) si algo interrumpe el bucle.
        if (this.flagSeq && !this.flagSeq.done) {
            const seq = this.flagSeq;
            seq.t += 1 / 60;
            p.inputLocked = true;
            p.vx = 0;

            // Fase 1: bajar deslizandose por el asta hasta el suelo real.
            // p.y es la esquina superior; el suelo esta en floorY, asi que los
            // pies quedan en p.y + p.height. Bajamos hasta posar en el suelo.
            const floorY = this.level.floorY;
            const feetAtFloor = floorY - p.height;
            if (p.y < feetAtFloor) {
                p.y = Math.min(p.y + 6, feetAtFloor);
                p.vy = 0;
            }
            // Fase 2: caminar hasta el castillo y completar (directo, sin timer).
            else {
                p.x += 2;
                p.facing = 1;
                if (p.x >= this.level.castleX - 20) {
                    seq.done = true;
                    this.win();
                }
            }
        }
    }

    // ----- Renderizado -----

    render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const cam = Math.floor(this.cameraX);

        // Cielo
        ctx.fillStyle = '#5c94fc';
        ctx.fillRect(0, 0, cw, ch);

        this.renderDecor(ctx, cam);
        this.renderTiles(ctx, cam);

        for (const c of this.level.coins) {
            if (c.taken) continue;
            drawSprite(ctx, Sprite.coin, Math.round(c.x - cam), c.y, 2);
        }

        this.renderFlag(ctx, cam);

        for (const e of this.entities) e.draw(ctx, cam);
        this.player.draw(ctx, cam);

        for (const p of this.particles) p.draw(ctx, cam);
    }

    renderDecor(ctx, cam) {
        for (const d of this.level.decor) {
            const dx = Math.round(d.x - cam * 0.5);
            if (dx < -80 || dx > this.canvas.width + 80) continue;
            if (d.type === 'cloud') {
                drawSprite(ctx, Sprite.cloud, dx, d.y, 2 * (d.scale || 1), { G: '#5c94fc' });
            } else if (d.type === 'bush') {
                drawSprite(ctx, Sprite.bush, dx, d.y, 2 * (d.scale || 1));
            } else if (d.type === 'hill') {
                drawSprite(ctx, Sprite.hill, dx, d.y, 2 * (d.scale || 1));
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

    renderFlag(ctx, cam) {
        const fx = Math.round(this.level.flagX - cam);
        const baseY = this.level.floorY;

        // El banderin baja con el jugador durante la secuencia de meta
        let flagY = baseY - 64;
        if (this.flagSeq && !this.flagSeq.done) {
            flagY = Math.min(baseY - 40, Math.max(flagY, this.player.y));
        }

        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(fx + 12, baseY - 180, 8, 184);

        ctx.fillStyle = '#7a3a10';
        ctx.fillRect(fx + 2, baseY, 30, 6);

        ctx.fillStyle = '#2d9f2d';
        ctx.beginPath();
        ctx.moveTo(fx + 12, flagY);
        ctx.lineTo(fx + 48, flagY + 16);
        ctx.lineTo(fx + 12, flagY + 32);
        ctx.closePath();
        ctx.fill();
    }

    // ----- HUD -----

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = String(this.score).padStart(6, '0');
        if (this.coinsEl) this.coinsEl.textContent = String(this.coins).padStart(2, '0');
        if (this.timeEl) this.timeEl.textContent = String(this.time).padStart(3, '0');
        if (this.livesEl) this.livesEl.textContent = String(this.lives);
    }
}