/* ====== SuperM1 — Audio sintetizado con Web Audio API ======
   Todos los efectos son generados por codigo (ondas simples), sin archivos. */

class GameAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicOn = false;
        this.musicTimer = null;
    }

    // El contexto de audio solo puede crearse tras un gesto del usuario
    ensureContext() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                this.enabled = false;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    // Tono simple
    tone(freq, start, duration, type, volume) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t0 = this.ctx.currentTime + start;

        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(volume || 0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    // Barrido de frecuencia
    sweep(from, to, duration, type, volume) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t0 = this.ctx.currentTime;

        osc.type = type || 'square';
        osc.frequency.setValueAtTime(from, t0);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
        gain.gain.setValueAtTime(volume || 0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    playSound(name) {
        if (!this.enabled) return;
        if (!this.ensureContext()) return;

        switch (name) {
            case 'jump':
                this.sweep(320, 640, 0.18, 'square', 0.06);
                break;
            case 'coin':
                this.tone(988, 0, 0.08, 'square', 0.07);
                this.tone(1319, 0.07, 0.22, 'square', 0.07);
                break;
            case 'stomp':
                this.sweep(300, 90, 0.12, 'square', 0.09);
                break;
            case 'kick':
                this.sweep(500, 120, 0.15, 'sawtooth', 0.08);
                break;
            case 'powerup':
                [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.06, 0.15, 'square', 0.07));
                break;
            case 'shrink':
                [784, 622, 466].forEach((f, i) => this.tone(f, i * 0.08, 0.18, 'square', 0.07));
                break;
            case 'break':
                this.sweep(200, 60, 0.2, 'sawtooth', 0.09);
                break;
            case 'bump':
                this.tone(140, 0, 0.1, 'square', 0.07);
                break;
            case 'die':
                [523, 494, 440, 349, 294, 220].forEach((f, i) => this.tone(f, i * 0.12, 0.22, 'square', 0.08));
                break;
            case 'flag':
                [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.08, 0.18, 'triangle', 0.08));
                break;
            // Descenso por el asta: barrido descendente
            case 'slide':
                this.sweep(1200, 300, 0.7, 'triangle', 0.05);
                break;
            // Fanfarria al completar el nivel
            case 'levelClear':
                [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
                    this.tone(f, i * 0.13, 0.3, 'square', 0.08));
                break;
            case '1up':
                [659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.1, 0.25, 'square', 0.08));
                break;
        }
    }

    // Bucle melodico sencillo de fondo
    startMusic() {
        if (!this.enabled || this.musicOn) return;
        if (!this.ensureContext()) return;
        this.musicOn = true;

        // Melodia: [frecuencia, duracion]
        const notes = [
            [659, 0.15], [659, 0.3], [659, 0.15], [523, 0.15], [659, 0.3],
            [784, 0.6], [392, 0.6], [523, 0.4], [784, 0.4], [659, 0.4],
            [587, 0.2], [494, 0.3], [523, 0.2], [440, 0.3], [494, 0.2],
            [392, 0.4], [330, 0.4], [440, 0.4], [494, 0.4], [392, 0.5],
        ];

        let step = 0;
        this.musicTimer = setInterval(() => {
            if (!this.musicOn || !this.ctx) return;
            const [freq, dur] = notes[step % notes.length];
            this.tone(freq, 0, dur * 0.9, 'square', 0.03);
            step++;
        }, 190);
    }

    stopMusic() {
        this.musicOn = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopMusic();
        return this.enabled;
    }
}