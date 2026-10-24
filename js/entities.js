/* ====== SuperM1 — Entidades del juego ====== */

// Clase base para objetos dinamicos
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.remove = false;
    }

    update(level, game) {}
    draw(ctx, cameraX) {}
}

// ====== ENEMIGOS ======

class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.vx = -1;
        this.squished = false;
        this.squishTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.deadly = true;
    }

    update(level, game) {
        if (this.squished) {
            this.squishTimer += 1 / 60;
            if (this.squishTimer > 0.5) this.remove = true;
            return;
        }

        this.vy = Math.min(this.vy + Physics.GRAVITY, Physics.MAX_FALL_SPEED);
        const col = Physics.moveAndCollide(this, level);
        if (col.hitWallL || col.hitWallR) {
            this.vx = -this.vx;
        }

        // Animacion de caminata
        this.animTimer += 1 / 60;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = 1 - this.animFrame;
        }

        // Fuera de pantalla por abajo
        if (this.y > level.height * level.tileSize + 60) {
            this.remove = true;
        }
    }

    squish(game) {
        if (this.squished) return;
        this.squished = true;
        this.vx = 0;
        this.vy = 0;
        game.score += 100;
        game.audio.playSound('stomp');
        game.updateHUD();
    }

    draw(ctx, cameraX) {
        if (this.remove) return;
        const drawX = Math.round(this.x - cameraX) - 2; // centrar sprite 32px
        const drawY = Math.round(this.y);

        if (this.squished) {
            // Aplastado: escala Y reducida
            ctx.save();
            ctx.translate(drawX, drawY + 18);
            ctx.scale(1, 0.35);
            drawSprite(ctx, Sprite.goomba, 0, 0, 2);
            ctx.restore();
        } else {
            ctx.save();
            if (this.animFrame === 1) {
                const cx = drawX + 16;
                ctx.translate(cx, 0);
                ctx.scale(-1, 1);
                ctx.translate(-cx, 0);
            }
            drawSprite(ctx, Sprite.goomba, drawX, drawY - 4, 2);
            ctx.restore();
        }
    }
}

class Koopa extends Entity {
    constructor(x, y) {
        super(x, y, 28, 44);
        this.vx = -1;
        this.state = 'walk'; // walk | shell | kicked
        this.animFrame = 0;
        this.animTimer = 0;
        this.shellTimer = 0;
    }

    // Con caparazon al aire el hitbox es mas bajo
    get shellLike() {
        return this.state !== 'walk';
    }

    update(level, game) {
        // El caparazon quieto revive al koopa a los pocos segundos
        if (this.state === 'shell') {
            this.shellTimer += 1 / 60;
            if (this.shellTimer > 5) {
                this.state = 'walk';
                this.height = 44;
                this.y -= 16;
                this.shellTimer = 0;
                this.vx = Math.random() < 0.5 ? -1 : 1;
                Physics.unstick(this, level);
            }
        }

        this.vy = Math.min(this.vy + Physics.GRAVITY, Physics.MAX_FALL_SPEED);
        const col = Physics.moveAndCollide(this, level);
        if (col.hitWallL || col.hitWallR) {
            if (this.state === 'walk') this.vx = -this.vx;
        }

        this.animTimer += 1 / 60;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = 1 - this.animFrame;
        }

        if (this.y > level.height * level.tileSize + 60) {
            this.remove = true;
        }
    }

    squish(game) {
        if (this.state === 'walk') {
            this.state = 'shell';
            this.height = 28;
            this.y += 16; // mantener los pies en el suelo
            this.vx = 0;
            this.shellTimer = 0;
            game.score += 100;
            game.audio.playSound('stomp');
        } else if (this.state === 'shell') {
            this.state = 'kicked';
            this.vx = game.player.x < this.x ? 6 : -6;
            this.shellTimer = 0;
            game.score += 200;
            game.audio.playSound('kick');
        } else {
            // Patear el caparazon lanzado lo detiene
            this.vx = 0;
            this.state = 'shell';
            this.shellTimer = 0;
        }
        game.updateHUD();
    }

    draw(ctx, cameraX) {
        if (this.remove) return;
        const drawX = Math.round(this.x - cameraX) - 2;
        const drawY = Math.round(this.y);

        ctx.save();
        if (this.vx > 0) {
            const cx = drawX + 16;
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        if (this.state === 'walk') {
            drawSprite(ctx, Sprite.koopa, drawX, drawY - 4, 2);
        } else {
            // Caparazon: se dibuja alineado con la base del hitbox
            ctx.translate(drawX, drawY + this.height);
            ctx.scale(1, 0.75);
            drawSprite(ctx, Sprite.koopaShell, -2, -28, 2);
        }
        ctx.restore();
    }
}

// ====== POWER-UPS Y RECOLECTABLES ======

class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.vx = 1.5;
        this.spawning = true;
        this.spawnY = y - 28;
        this.isPowerUp = true;
        this.type = 'mushroom';
    }

    update(level, game) {
        if (this.spawning) {
            this.y -= 1;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.spawning = false;
            }
            return;
        }

        this.vy = Math.min(this.vy + Physics.GRAVITY, Physics.MAX_FALL_SPEED);
        const col = Physics.moveAndCollide(this, level);
        if (col.hitWallL || col.hitWallR) this.vx = -this.vx;

        if (this.y > level.height * level.tileSize + 60) this.remove = true;
    }

    collect(game) {
        this.remove = true;
        game.player.powerUp(this.type, game);
    }

    draw(ctx, cameraX) {
        if (this.remove) return;
        drawSprite(ctx, Sprite.mushroom, Math.round(this.x - cameraX) - 2, Math.round(this.y), 2);
    }
}

class FireFlower extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.spawning = true;
        this.spawnY = y - 28;
        this.isPowerUp = true;
        this.type = 'flower';
        this.animTimer = 0;
        this.blink = false;
    }

    update(level, game) {
        // Parpadeo de la flor
        this.animTimer += 1 / 60;
        if (this.animTimer > 0.15) {
            this.animTimer = 0;
            this.blink = !this.blink;
        }

        if (this.spawning) {
            this.y -= 1;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.spawning = false;
            }
        }
    }

    collect(game) {
        this.remove = true;
        game.player.powerUp(this.type, game);
    }

    draw(ctx, cameraX) {
        if (this.remove) return;
        const palette = this.blink ? { R: '#ff8000', W: '#ffe14d' } : null;
        drawSprite(ctx, Sprite.fireFlower, Math.round(this.x - cameraX) - 2, Math.round(this.y), 2, palette);
    }
}

class CoinEffect extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.vy = -6;
        this.timer = 0;
    }

    update() {
        this.timer += 1 / 60;
        this.vy += 0.4;
        this.y += this.vy;
        if (this.timer > 0.4) this.remove = true;
    }

    draw(ctx, cameraX) {
        if (this.remove) return;
        drawSprite(ctx, Sprite.coin, Math.round(this.x - cameraX) - 2, Math.round(this.y), 2);
    }
}

// ====== PARTICULAS ======

/* Texto de puntos que sube y se desvanece */
class FloatingText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.timer = 0;
        this.remove = false;
    }

    update() {
        this.timer += 1 / 60;
        this.y -= 0.9;
        if (this.timer > 1.4) this.remove = true;
    }

    draw(ctx, cameraX) {
        const life = 1 - this.timer / 1.4;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, life * 1.6));
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(this.text, Math.round(this.x - cameraX) + 1, Math.round(this.y) + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.text, Math.round(this.x - cameraX), Math.round(this.y));
        ctx.restore();
    }
}

class BrickParticle {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.remove = false;
    }

    update() {
        this.vy += 0.4;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > 600) this.remove = true;
    }

    draw(ctx, cameraX) {
        ctx.fillStyle = Sprite.COLORS.brick;
        ctx.fillRect(Math.round(this.x - cameraX), Math.round(this.y), 8, 8);
    }
}