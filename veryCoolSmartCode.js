
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
    enemyList: {},
    asteroid: class {
        constructor(){
            var size = Math.random() * (128 - 16) + 16;
            var speed = 0.007; // Math.random() * (10 - 1) + 1;
            var degree = Math.random() * (360 - 1) + 1;
            var xOriginStart = Math.random() * (800 - 0) + 0;
            var yOriginStart = Math.random() * (800 - 0) + 0;

            // this is to guarantee that the asteroid will always start out of bounds
            var randomizeCoordinateOutOfBounds = Math.random() * (4 - 0) + 0;
            if (randomizeCoordinateOutOfBounds < 1){
                xOriginStart += 800;
            }
            else if (randomizeCoordinateOutOfBounds < 2){
                xOriginStart -= 800;
            }
            else if (randomizeCoordinateOutOfBounds < 3){
                yOriginStart += 800;
            }
            else {
                yOriginStart -= 800;  
            }

            this.height = size; // should be dynamic (random number between 16-128)
            this.width = size; // should be dynamic (random number between 16-128)
            this.speed = speed; // should be dynamic (random number between 1-10)

            this.originLocation = {
                // Should randomize both, but at least one component
                // needs to be rendered off screen
                // can have a 0-1 randomized to determine which
                // should start out of bounds
                x: xOriginStart,
                y: yOriginStart
            };
            // allows us to control adjustments to the slope for a specific asteroid
            this.deltaXRandomAugmentationIndex = Math.floor(Math.random() * (7 - 0) + 0);
            this.deltaYRandomAugmentationIndex = Math.floor(Math.random() * (7 - 0) + 0);
            // the **amount** of adjustment to the slope
            this.slopeVarianceScalar = Math.random() * (300 - 1) + 1;
            this.slopeAugmentationList = [0, 1, -1, 2, -2, 3, -3];
            this.location = {
                x: this.originLocation.x,
                y: this.originLocation.y
            };
            this.endLocation = {
                x: 800 - (this.originLocation.x), // inverse of origin location
                y: 800 - (this.originLocation.y) // inverse of end location
            };
            this.color = 'rgb(255 255 255)';
            this.id = Date.now();
            this.rotationValue = degree; // should be dynamic (random number between 1-40* for now)
        };

        render(canvas, ctx){
            // nothing yet
            ctx.fillStyle = this.color;

            // TODO: rotation of Rect in place when drawing
            // this.rotationValue++;
            // if (this.rotationValue > 360){
            //     this.rotationValue = 0;
            // }

            // ctx.rotate((this.rotationValue * Math.PI) / 180);
            ctx.fillRect(
                this.location.x - (0.5 * this.width),
                this.location.y - (0.5 * this.height),
                this.width,
                this.height
            );

            // Reset transformation matrix to the identity matrix
            // ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        updateLocation(){
            // updates the location of the asteroid with
            // some variance in the trajectory to spice things up
            var end = this.endLocation;
            var start = this.originLocation;

            var options = this.slopeAugmentationList;
            var xIndex = this.deltaXRandomAugmentationIndex;
            var yIndex = this.deltaYRandomAugmentationIndex;
            var amount = this.slopeVarianceScalar;

            var deltaY = end.y - start.y + (options[yIndex] * amount);
            var deltaX = end.x - start.x + (options[xIndex] * amount);

            this.location.x = this.location.x + (deltaX * this.speed);
            this.location.y = this.location.y + (deltaY * this.speed);
        }

        checkAsteroidOutOfBounds(){
            // may actually want to or this as an optimization
            return (
                Math.abs(this.location.x - this.originLocation.x) > 1600 &&
                Math.abs(this.location.y - this.originLocation.y) > 1600
            )
        }
    },
    asteroidList: {},
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
    var asteroidTimerDefault = 3 * 60;
    var asteroidTimer = 3 * 60; // multiplied by 60 because 60fps

    setInterval(function(){
        // update player location based on activeKey
        Game.player.updatePlayerLocation();
        Game.render.refreshBackgroundCanvas(canvas, ctx);
        Game.render.renderPlayerSprite(canvas, ctx);

        // decrement asteroid timer
        asteroidTimer--;

        if (asteroidTimer <= 0){
            // create new asteroid
            // and add to active list
            var newAsteroid = new Game.asteroid();
            asteroidTimer = asteroidTimerDefault;
            Game.asteroidList[newAsteroid.id] = newAsteroid;
        }

        // render all active projectiles
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

        for (var i in Game.asteroidList){
            var asteroid = Game.asteroidList[i];

            // cleanup out of bounds asteroids
            if (asteroid.checkAsteroidOutOfBounds()){
                delete Game.asteroidList[asteroid.id];
                delete asteroid;
            }

            asteroid.updateLocation();
            asteroid.render(canvas, ctx);
        }

    }, (1000 / 60));
};