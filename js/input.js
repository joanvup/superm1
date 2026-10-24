/* ====== SuperM1 — Entrada de teclado ====== */

const Input = {
    keys: {},
    justPressed: {},

    init() {
        window.addEventListener('keydown', (e) => {
            // Evitar scroll con flechas/espacio
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },

    isDown(code) {
        return !!this.keys[code];
    },

    wasPressed(code) {
        return !!this.justPressed[code];
    },

    // Se llama al final de cada frame para limpiar justPressed
    endFrame() {
        this.justPressed = {};
    },

    // Axis horizontal: -1 izquierda, +1 derecha
    getAxisX() {
        let x = 0;
        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) x -= 1;
        if (this.isDown('ArrowRight') || this.isDown('KeyD')) x += 1;
        return x;
    },

    // ¿Saltar?
    getJump() {
        return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW');
    },

    // ¿Correr?
    getRun() {
        return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.isDown('KeyX');
    },
};

// Teclas relevantes para el juego
Input.CODES = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    JUMP: 'Space',
    RUN: 'ShiftLeft',
    PAUSE: 'KeyP',
    RESTART: 'KeyR',
    ENTER: 'Enter',
};