/* ====== SuperM1 — Jugador (Mario) ======

   Estados: 'normal' (pequeno), 'super' (hongo), 'fire' (flor).
   Hitbox: 26x28 pequeno, 26x52 grande. Los sprites miden 32px de ancho a
   escala 2, asi que se centran con un offset de -3 px al dibujar. */

class Player {
    constructor(x, y) {
        this.spawnX = x;
        this.spawnY = y;
        this.x = x;
        this.y = y;
        this.width = 26;
        this.height = 28; // 52 cuando es super o fuego
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1; // 1 derecha, -1 izquierda
        this.state = 'normal'; // normal | super | fire
        this.invincible = false;
        this.invincibleTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.isRunning = false;
        this.jumpHeld = false;
        this.alive = true;
        this.deadTimer = 0;
        this.flagReached = false;
        this.inputLocked = false; // bloquea el control (secuencia de meta)
    }

    get small() {
        return this.state === 'normal';
    }

    get big() {
        return this.state !== 'normal';
    }

    update(input, level, game) {
        if (!this.alive) {
            this.deadTimer += 1 / 60;
            this.vy = this.deadTimer < 0.5 ? -8 : 8;
            this.y += this.vy;
            return;
        }

        // Invencibilidad temporal tras recibir dano
        if (this.invincible) {
            this.invincibleTimer -= 1 / 60;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        const axis = this.inputLocked ? 0 : input.getAxisX();
        const running = !this.inputLocked && input.getRun();
        const speed = running ? Physics.RUN_SPEED : Physics.MOVE_SPEED;
        this.isRunning = running && axis !== 0;

        // Movimiento horizontal
        if (this.inputLocked) {
            this.vx *= Physics.FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        } else if (axis !== 0) {
            this.vx += axis * Physics.ACCELERATION;
            this.vx = Math.max(-speed, Math.min(speed, this.vx));
            this.facing = axis;
        } else {
            this.vx *= Physics.FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Salto
        const jumpDown = !this.inputLocked && input.getJump();
        if (jumpDown && !this.jumpHeld && this.onGround) {
            this.vy = Physics.JUMP_VELOCITY;
            this.onGround = false;
            game.audio.playSound('jump');
        }

        // Salto variable: soltar el boton corta el ascenso
        if (!jumpDown && this.jumpHeld && this.vy < -4) {
            this.vy = -4;
        }
        this.jumpHeld = jumpDown;

        // Gravedad
        this.vy = Math.min(this.vy + Physics.GRAVITY, Physics.MAX_FALL_SPEED);

        // Movimiento + colisiones (ejes separados)
        const collision = Physics.moveAndCollide(this, level);
        this.onGround = collision.hitFloor;

        // Avisar al juego de los bloques golpeados con la cabeza
        if (collision.hitCeiling && game && game.onPlayerHitCeiling) {
            game.onPlayerHitCeiling(this, collision);
        }

        // Limites del mundo
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
        if (this.y > level.height * level.tileSize + 60) {
            this.die(game);
        }

        // Animacion
        this.animTimer += 1 / 60;
        const frameTime = this.isRunning ? 0.07 : 0.12;
        if (this.animTimer > frameTime) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
    }

    die(game) {
        if (!this.alive) return;
        this.alive = false;
        this.deadTimer = 0;
        this.vy = -8;
        game.lives--;
        game.audio.playSound('die');
        game.updateHUD();

        if (game.lives <= 0) {
            setTimeout(() => game.gameOver(), 1500);
        } else {
            setTimeout(() => game.resetLevel(), 2500);
        }
    }

    getHit(game) {
        if (this.invincible || !this.alive) return;
        if (this.big) {
            this.state = 'normal';
            this.height = 28;
            this.invincible = true;
            this.invincibleTimer = 2;
            game.audio.playSound('shrink');
        } else {
            this.die(game);
        }
    }

    // Recoger un power-up
    powerUp(type, game) {
        if (type === 'mushroom') {
            if (this.state === 'normal') {
                this.state = 'super';
                this.grow();
            }
            game.audio.playSound('powerup');
        } else if (type === 'flower') {
            if (this.state === 'normal') {
                this.grow();
            }
            this.state = 'fire';
            game.audio.playSound('powerup');
        } else if (type === 'star') {
            this.invincible = true;
            this.invincibleTimer = 10;
            game.audio.playSound('powerup');
        }
        game.updateHUD();
    }

    // Cambiar a tamano grande manteniendo los pies en el suelo
    grow() {
        this.height = 52;
        this.y -= 24;
    }

    draw(ctx, cameraX) {
        if (!this.alive && this.deadTimer > 2.5) return;

        // Parpadeo durante la invencibilidad
        if (this.invincible && Math.floor(this.invincibleTimer * 10) % 2 === 0) return;

        const drawX = Math.round(this.x - cameraX) - 3; // centrar sprite 32px
        const drawY = Math.round(this.y);
        const colors = getMarioColors(this.state);

        ctx.save();
        if (this.facing === -1) {
            const cx = drawX + 16;
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        let sprite;
        if (this.big) {
            if (!this.onGround) {
                sprite = Sprite.superMarioJump;
            } else if (Math.abs(this.vx) < 0.5) {
                sprite = Sprite.superMarioIdle;
            } else {
                sprite = this.animFrame === 0 ? Sprite.superMarioWalk1 : Sprite.superMarioWalk2;
            }
            drawSprite(ctx, sprite, drawX, drawY, 2, colors);
        } else {
            if (this.onGround) {
                if (Math.abs(this.vx) < 0.5) {
                    sprite = Sprite.marioIdle;
                } else {
                    sprite = this.animFrame === 0 ? Sprite.marioRun1 : Sprite.marioRun2;
                }
            } else {
                sprite = Sprite.marioJump;
            }
            // El sprite pequeno mide 32px y la hitbox 28: se alinea abajo
            drawSprite(ctx, sprite, drawX, drawY - 4, 2, colors);
        }

        ctx.restore();
    }
}
