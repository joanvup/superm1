/* ====== SuperM1 - Punto de entrada ====== */

window.addEventListener('load', () => {
    Input.init();
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    window.game = game;
    game.start();
});