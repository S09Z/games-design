// Entry point
document.addEventListener('DOMContentLoaded', function() {
    // Initialize and start the game
    var game = new Game.Game();
    game.start();

    // Expose for debugging
    window._game = game;
});
