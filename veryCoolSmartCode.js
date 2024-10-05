
/**
 * WHEN THE WINDOW LOADS
 */
window.addEventListener('load', async function(){
    // need this to wait for the font to load
    await document.fonts.ready;
    // setup before rendering even starts
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    Game.render.showTitleScreen(canvas, ctx);

    var callback = function(e){
        if (e.key === 'Enter' || e.key === 'Return'){
            main();
        }
        window.removeEventListener('keydown', callback);
    };

    window.addEventListener('keydown', callback);

    window.setTimeout(function(){
        Game.render.showTitleScreen(canvas, ctx);
    }, 200);
});

// This is our Game
var Game = {
    /**
     * Player character meta data/info/options
     */
    score: class {
        constructor() {
            this.value = 0; // int value to track Game score
            this.width = 48;
            this.height = 48;
            this.location = {
                x: Number((800 / 2) - (0.3 * this.width)),
                y: Number((800 / 12) - (0.5 * this.height))
            },
            this.color = 'rgb(255 255 255)';
        };

        /**
         * 
         * @param {HTMLCanvasElement} canvas - html canvas el 
         * @param {CanvasRenderingContext2D} ctx - 2d context
         */
        renderScore(canvas, ctx){
            ctx.fillStyle = this.color;
            // right now just render a rectangle, but want to
            // build number vector graphic based on value

            var displayScoreText = this.value;

            var characterCount = String(displayScoreText).length;
            // adjust the horizontal location by number of characters
            var xOffset = (characterCount - 1) * -15;

            ctx.font = "30px 'Press Start 2P'";

            ctx.fillText(
                displayScoreText,
                this.location.x + xOffset,
                this.location.y
            );
        }

        updateScore(additiveValue){
            // point value scalar
            var scalar = 3;
            this.value += (additiveValue * scalar);
        }

    },
    restart: function(event){
        // prevent player from accidentally restarting
        if (event.key === 'r' || event.key === 'R'){
            window.removeEventListener('keydown', Game.restartHandler);

            Game.asteroidList = [];
            Game.render.clearScreen();
            main();
        }
    },
    endGame: function(){
        // reset player location and score
        Game.player.location = {x: 400, y: 400};
        // Game.activeScore = null;

        // clear asteroids
        for (var i in Game.asteroidList){
            var asteroid = Game.asteroidList[i];
            delete Game.asteroidList[asteroid.id];
            delete asteroid;
        }


        // clear projectiles
        for (var i in Game.projectilesList){
            var projectile = Game.projectilesList[i];
            delete Game.projectilesList[projectile.id];
            delete projectile;
        }

        // prevent duplicating the interval
        clearInterval(Game.mainLoop);

        Game.render.clearScreen();

        // display game over
        Game.render.gameOverMenu();

        Game.restartHandler = function(event){
            Game.restart(event);
        };

        Game.restartListener = window.addEventListener('keydown', Game.restartHandler)
    },
    player: {
        name: 'Scooter',
        alive: true,
        location: {
            x: 400,
            y: 400
        },
        spriteImage: document.getElementById("scooter-img"),
        color: 'rgb(255 255 255)',
        speed: 10,
        spriteWidth: 48,
        spriteHeight: 48,
        orientation: 0,
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
            this.deltaX = deltaX;
            this.deltaY = deltaY;
            this.spriteImage = document.getElementById("projectile-img");
        };

        // update canvas ctx with new location for projectile
        render(canvas, ctx){
            ctx.fillStyle = this.color;
            ctx.drawImage(
                this.spriteImage,
                this.location.x - (0.5 * this.width),
                this.location.y - (0.5 * this.height),
                this.width,
                this.height
            );
        }

        // updates then projectile line equation trajectory and multiplying by speed scalar
        updateLocation(){
            // sets a minimum projectile speed
            if (Math.abs(this.deltaX) < 15){
                if (this.deltaX <= 0){
                    this.deltaX = -15;
                }
                else {
                    this.deltaX = 15;
                }
            }
            if (Math.abs(this.deltaY) < 15){
                if (this.deltaY <= 0){
                    this.deltaY = -15;
                }
                else {
                    this.deltaY = 15;
                }
            }
            
            this.location.x = this.location.x + (this.deltaX * this.speed);
            this.location.y = this.location.y + (this.deltaY * this.speed);
        }

        /**
         * Checks if the projectile 'collides' with the asteroid
         * @param {asteroid} asteroid - asteroid class instance to check
         * @returns {Boolean} - result of calc true/false
         */
        checkCollisionWithAsteroid(asteroid){
            var xDiff = Math.abs(asteroid.location.x - this.location.x);
            var yDiff = Math.abs(asteroid.location.y - this.location.y);
            var collisionOffset = (asteroid.width / 2);

            if (xDiff <= collisionOffset && yDiff <= collisionOffset){
                return true;
            }
            return false;
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
            this.effectiveSpeed = 0;
            this.rotateClockwise = Math.random() > 0.5;
            this.spriteImage = document.getElementById("asteroid-img");

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

            if (this.rotateClockwise){
                this.rotationValue++;
                if (this.rotationValue > 360){
                    this.rotationValue = 0;
                }
            }
            else {
                this.rotationValue--;
                if (this.rotationValue < 0){
                    this.rotationValue = 360;
                }
            }
            
            // Matrix transformation
            ctx.translate(
                this.location.x,
                this.location.y
            );
            ctx.rotate((this.rotationValue * Math.PI) / 180);
            ctx.translate(-this.location.x, -this.location.y);

            // Rotated rectangle
            ctx.drawImage(
                this.spriteImage,
                this.location.x - (0.5 * this.width),
                this.location.y - (0.5 * this.height),
                this.width,
                this.height
            );

            // Reset transformation matrix to the identity matrix
            ctx.setTransform(1, 0, 0, 1, 0, 0);
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

            this.effectiveSpeed = (deltaX * this.speed) + (deltaY * this.speed) / 2;

            this.location.x = this.location.x + ((deltaX * this.speed) / 2);
            this.location.y = this.location.y + ((deltaY * this.speed) / 2);
        }

        checkAsteroidOutOfBounds(){
            // may actually want to or this as an optimization
            return (
                Math.abs(this.location.x - this.originLocation.x) > 1600 &&
                Math.abs(this.location.y - this.originLocation.y) > 1600
            )
        }

        checkCollisionWithPlayer(){
            var xDiff = Math.abs(Game.player.location.x - this.location.x);
            var yDiff = Math.abs(Game.player.location.y - this.location.y);
            
            if (this.width > Game.player.spriteWidth){
                var collisionOffset = (this.width / 2);
            }
            else {
                var collisionOffset = (Game.player.spriteWidth / 2);
            }

            if (xDiff <= collisionOffset && yDiff <= collisionOffset){
                return true;
            }
            return false;
        }
    },
    asteroidList: {},
    activeScore: null,
    controls: {
        /**
         * Sets up all controls logic
         */
        configureControlsListeners: function(){     
            // update the active key to be used at next frame update       
            window.addEventListener("keydown", function(e){
                Game.controls.keyActive = e.key;
            });

            // handle firing
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
            Game.player.orientation = 0;
        },
        handlePressA: function(){
            // Moving the player 'left' in the canvas window
            if (Game.player.location.x - (Game.player.speed * 2) > 0){
                Game.player.location.x -= Game.player.speed;
            }
            Game.player.orientation = 270;
        },
        handlePressS: function(){
            // Moving the player 'down' in the canvas window
            if (Game.player.location.y + (Game.player.speed * 2) < 800){
                Game.player.location.y += Game.player.speed;
            }
            Game.player.orientation = 180;
        },
        handlePressD: function(){
            // Moving the player 'right' in the canvas window
            if (Game.player.location.x + (Game.player.speed * 2) < 800){
                Game.player.location.x += Game.player.speed;
            }
            Game.player.orientation = 90;
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
     * Displays title screen on game load
     * @param {HTMLCanvasElement} canvas - HTML canvas element
     * @param {CanvasRenderingContext2D} ctx - 2d canvas ctx
     */
    showTitleScreen: function(canvas, ctx){
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, 800, 800);

        // Draw a menu box border
        ctx.fillStyle = "rgb(255 255 255)";
        ctx.fillRect(
            canvas.width / 4 - 5,
            canvas.height / 4 - 5,
            canvas.width / 2 + 10,
            canvas.height / 2 + 10
        );

        // Draw a menu box
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(
            canvas.width / 4,
            canvas.height / 4,
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.fillStyle = "rgb(255 255 255)";
        var titleText = "DESTROID";
        var xOffset = -120;
        var yOffset = 40;

        ctx.font = "30px 'Press Start 2P'";
        ctx.fillText(
            titleText,
            400 + xOffset,
            400 - yOffset
        );

        var messageText = "PRESS 'ENTER' TO START";
        var xOffset = -150;
        var yOffset = -100;

        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText(
            messageText,
            400 + xOffset,
            400 - yOffset
        );
    },

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
        // ctx.fillRect(
        //     Game.player.location.x - (0.5 * Game.player.spriteWidth), // x location of player on canvas
        //     Game.player.location.y - (0.5 * Game.player.spriteHeight), // y location of player on canvas
        //     Game.player.spriteWidth, // sprite width
        //     Game.player.spriteHeight // sprite height
        // );


        // Matrix transformation
        ctx.translate(
            Game.player.location.x,
            Game.player.location.y
        );
        ctx.rotate((Game.player.orientation * Math.PI) / 180);
        ctx.translate(-Game.player.location.x, -Game.player.location.y);

        ctx.drawImage(
            Game.player.spriteImage,
            Game.player.location.x - (0.5 * Game.player.spriteWidth), // x location of player on canvas
            Game.player.location.y - (0.5 * Game.player.spriteHeight), // y location of player
            Game.player.spriteWidth, // sprite width
            Game.player.spriteHeight // sprite height on canvas
        );

        // Reset transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },

    /**
     * Re render the background canvas
     */
    refreshBackgroundCanvas: function(canvas, ctx){
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    /**
     * Renders a game over menu, that displays score and
     * prompts the user to play again
     */
    gameOverMenu: function(){
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        // Draw a menu box border
        ctx.fillStyle = "rgb(255 255 255)";
        ctx.fillRect(
            canvas.width / 4 - 5,
            canvas.height / 4 - 5,
            canvas.width / 2 + 10,
            canvas.height / 2 + 10
        );

        // Draw a menu box
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(
            canvas.width / 4,
            canvas.height / 4,
            canvas.width / 2,
            canvas.height / 2
        );

        // Write "GAME OVER"
        ctx.fillStyle = "rgb(255 255 255)";
        ctx.font = "30px 'Press Start 2P'";
        var xOffset = 60;
        var yOffset = 20;
        ctx.fillText(
            "GAME OVER",
            canvas.width / 4 + xOffset,
            canvas.height / 3 + yOffset
        );

        // Write Press 'R' To Play Again
        ctx.fillStyle = "rgb(255 255 255)";
        ctx.font = "14px 'Press Start 2P'";
        var xOffset = 42;
        var yOffset = 20;
        ctx.fillText(
            "PRESS 'R' TO PLAY AGAIN",
            canvas.width / 4 + xOffset,
            canvas.height / 2 - yOffset
        );
    },

    /**
     * Clears the active screen in canvas
     */
    clearScreen: function(){
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};

/**
 * Main Game Loop
 */
const main = function(){
    // setup before rendering even starts
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // instantiate score class
    var score = new Game.score();
    Game.activeScore = score;

    // Set up event listeners
    Game.controls.configureControlsListeners();

    // rendering canvas
    Game.render.renderCanvasInit(canvas, ctx);

    // rendering player to screen
    Game.render.renderPlayerSprite(canvas, ctx);

    score.renderScore(canvas, ctx);

    // everything below here will be part of the game loop
    var asteroidTimerDefault = 2 * 60;

    // Move this to Game object
    // reduce timer as player accumulates score
    // to increase rate of asteroid spawn
    var asteroidTimer = 2 * 60; // multiplied by 60 because 60fps
    var numberAsteroidsToSpawn = 1;
    var decrementValueBasedOnScore = 0;


    Game.mainLoop = setInterval(function(){
        // update player location based on activeKey
        Game.player.updatePlayerLocation();
        Game.render.refreshBackgroundCanvas(canvas, ctx);
        Game.render.renderPlayerSprite(canvas, ctx);

        // decrement asteroid timer by 1 always
        asteroidTimer--;
        // want to do a calc to spawn more asteroids at once
        // if we are getting higher up in score
        if (Game.activeScore.value > (0.5 * asteroidTimerDefault)) {
            // whole number that is the number of times
            // (0.5 * asteroid timer) goes into Total score
            if (numberAsteroidsToSpawn < Game.activeScore.value / (0.5 * asteroidTimerDefault)){
                // increment the number of asteroids to spawn
                // will start spawning 2 asteroids at once
                numberAsteroidsToSpawn++;
            }
            decrementValueBasedOnScore = Math.floor(decrementValueBasedOnScore % (0.5 * asteroidTimerDefault));
            // asteroidTimer -= decrementValueBasedOnScore; 
        }
        else {
            // default handler when under 60 points
            decrementValueBasedOnScore = Game.activeScore.value;
            // asteroidTimer = asteroidTimer - decrementValueBasedOnScore;
        }

        // as game progresses, speed up rate of asteroid spawn

        

        if (asteroidTimer <= 0){
            // create new asteroid
            // and add to active list
            var spawnCountIndex = 0;

            var spawnAsteroidRecursive = function(count){
                if (count === numberAsteroidsToSpawn){
                    return;
                }
                var newAsteroid = new Game.asteroid();
                asteroidTimer = asteroidTimerDefault;
                Game.asteroidList[newAsteroid.id] = newAsteroid;
                count++;

                // need this to prevent asteroids from sharing id
                // which would deleting multiple at once on destruction
                setTimeout(function(){
                    spawnAsteroidRecursive(count);
                }, 50)
            }

            spawnAsteroidRecursive(spawnCountIndex);
            // reset asteroid timer
            asteroidTimer = asteroidTimerDefault;
        }

        // render all active projectiles
        for (var i in Game.projectilesList){
            var projectile = Game.projectilesList[i];

            // check each asteroid to see if projectile is
            // colliding

            for (var j in Game.asteroidList){
                var asteroid = Game.asteroidList[j];
                if (projectile.checkCollisionWithAsteroid(asteroid)){
                    // destroy projectile
                    delete Game.projectilesList[projectile.id];
                    delete projectile;

                    // destroy asteroid
                    delete Game.asteroidList[asteroid.id];
                    delete asteroid;

                    // need to increment player.score
                    // for now just have a static +1 added
                    // but will want to calculate the new score
                    // based on asteroid size and speed

                    var addScoreValue = 1 + Math.abs(Math.round(asteroid.effectiveSpeed / (asteroid.width/10)));
                    score.updateScore(addScoreValue);

                    return;
                }
            }

            if (projectile){
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
        }

        // loop and update location and render for
        // all active asteroids
        for (var i in Game.asteroidList){
            var asteroid = Game.asteroidList[i];

            // cleanup out of bounds asteroids
            if (asteroid.checkAsteroidOutOfBounds()){
                delete Game.asteroidList[asteroid.id];
                delete asteroid;
            }

            if (asteroid.checkCollisionWithPlayer()){
                // end game
                Game.endGame();
            }
            else {
                asteroid.updateLocation();
                asteroid.render(canvas, ctx);
            }
        }

        score.renderScore(canvas, ctx);

    }, (1000 / 60));
};