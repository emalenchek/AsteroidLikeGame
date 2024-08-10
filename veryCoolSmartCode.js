
/**
 * WHEN THE WINDOW LOADS
 */
window.addEventListener('load', function(){
    main();
});

// This is our Game
var Game = {
    /**
     * Player character meta data/info/options
     */
    player: {
        name: 'Scooter',
        alive: true,
        location: {
            x: 400,
            y: 400
        },
        color: 'rgb(255 255 255)',
        speed: 10,
        spriteWidth: 32,
        spriteHeight: 32,
        updatePlayerLocation: function(){
            // update the player location once every frame
            var activeKey = Game.controls.keyActive;

            switch (activeKey){
                case 'w':
                    Game.controls.handlePressW();
                    break;
                case 'a':
                    Game.controls.handlePressA();
                    break;
                case 's':
                    Game.controls.handlePressS();
                    break;
                case 'd':
                    Game.controls.handlePressD();
                    break;
                default:
                    // do nothing
                    break;
            }

            // now that key press has been handled, we need to reset it
            Game.controls.keyActive = null;
        },
        destroyPlayer: function(){
            // player dies, game over
        }
    },
    projectile: class {
        constructor(deltaY, deltaX, origin) {
            this.height = 8;
            this.width = 8;
            this.speed = 0.1;
            this.strength = 1;
            this.location = {
                x: origin.x,
                y: origin.y
            };
            this.color = 'rgb(255 255 255)';
            this.id = Date.now();
            this.deltaX = deltaX,
            this.deltaY = deltaY
        };

        // update canvas ctx with new location for projectile
        render(canvas, ctx){
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.location.x - (0.5 * this.width),
                this.location.y - (0.5 * this.height),
                this.width,
                this.height
            );
        }

        updateLocation(){
            // nothing yet
            this.location.x = this.location.x + (this.deltaX * this.speed);
            this.location.y = this.location.y + (this.deltaY * this.speed);
        }
    },
    projectilesList: {},
    enemy: class {
        // nothing yet
    },
    enemies: [],
    controls: {
        /**
         * Sets up all controls logic
         */
        configureControlsListeners: function(){     
            // update the active key to be used at next frame update       
            window.addEventListener("keydown", function(e){
                Game.controls.keyActive = e.key;
            });

            // TODO: SHOOTING on mouse click or hold
            window.addEventListener("mousedown", function(e){
                var canvas = document.getElementById("canvas");
                if (e.target === canvas){
                    // need to determine the trajectory of the projectile
                    // need the slope of the line
                    // and the y-intercept
                    var mouseClickLocation = Game.helpers.getMousePositionRelativeToCanvas(canvas, e);
                    var originLocation = Game.player.location;

                    var rise = mouseClickLocation.y - originLocation.y;
                    var run = mouseClickLocation.x - originLocation.x;
                    var projectile = new Game.projectile(rise, run, originLocation);
                    Game.projectilesList[projectile.id] = projectile;
                }
            });
        },
        handlePressW: function(){
            // Moving the player 'up' in the canvas window
            if (Game.player.location.y - (Game.player.speed * 2) > 0){
                Game.player.location.y -= Game.player.speed;
            }
        },
        handlePressA: function(){
            // Moving the player 'left' in the canvas window
            if (Game.player.location.x - (Game.player.speed * 2) > 0){
                Game.player.location.x -= Game.player.speed;
            }
        },
        handlePressS: function(){
            // Moving the player 'down' in the canvas window
            if (Game.player.location.y + (Game.player.speed * 2) < 800){
                Game.player.location.y += Game.player.speed;
            }
        },
        handlePressD: function(){
            // Moving the player 'right' in the canvas window
            if (Game.player.location.x + (Game.player.speed * 2) < 800){
                Game.player.location.x += Game.player.speed;
            }
        },
        keyActive: null, // most recent pressed key
        controlListeners: {} // keeps track of active event listeners
    },
    helpers: {
        getMousePositionRelativeToCanvas: function(canvas, event){
            var rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            return {"x": x, "y": y};
        }
    }
};

Game.render = {
    /**
     * Renders the canvas at the start of the game
     */
    renderCanvasInit: function(canvas, ctx){
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    /**
     * Renders the player sprite to canvas
     * Will need to update this as the
     * player's location changes throughout the game
     */
    renderPlayerSprite: function(canvas, ctx){
        ctx.fillStyle = Game.player.color;
        ctx.fillRect(
            Game.player.location.x - (0.5 * Game.player.spriteWidth), // x location of player on canvas
            Game.player.location.y - (0.5 * Game.player.spriteHeight), // y location of player on canvas
            Game.player.spriteWidth, // sprite width
            Game.player.spriteHeight // sprite height
        );
    },

    /**
     * Re render the background canvas
     */
    refreshBackgroundCanvas: function(canvas, ctx){
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
};

/**
 * Main Game Loop
 */
const main = function(){
    // setup before rendering even starts
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Set up event listeners
    Game.controls.configureControlsListeners();

    // rendering canvas
    Game.render.renderCanvasInit(canvas, ctx);

    // rendering player to screen
    Game.render.renderPlayerSprite(canvas, ctx);

    // everything below here will be part of the game loop

    setInterval(function(){
        // update player location based on activeKey
        Game.player.updatePlayerLocation();
        Game.render.refreshBackgroundCanvas(canvas, ctx);
        Game.render.renderPlayerSprite(canvas, ctx);

        for (var i in Game.projectilesList){
            var projectile = Game.projectilesList[i];

            // check if projectile is out of bounds
            if (
                projectile.location.x < -10 ||
                projectile.location.x > 810 ||
                projectile.location.y < -10 ||
                projectile.location.y > 810
            ){
                delete Game.projectilesList[projectile.id];
                delete projectile;
            }
            else {
                projectile.updateLocation();
                projectile.render(canvas, ctx);
            }
        }

    }, (1000 / 60));
};