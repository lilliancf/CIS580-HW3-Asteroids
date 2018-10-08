// Screen dimensions
const WIDTH = 600
const HEIGHT = 600

// Create the canvas and context
var screen = document.createElement('canvas');
var screenCtx = screen.getContext('2d');
screen.height = HEIGHT;
screen.width = WIDTH;
document.getElementById("gamespace").appendChild(screen);

// Create the back buffer and context
var backBuffer = document.createElement('canvas');
var backBufferCtx = screen.getContext('2d');
backBuffer.height = HEIGHT;
backBuffer.width = WIDTH;

/* Game state variables */
var start = null;
var currentInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  w: false,
  a: false,
  s: false,
  d: false,
  e: false
}
var priorInput = {
  space: false,
  left: false,
  right: false,
  up: false,
  down: false
}
var lives = 3;
var score = 0;
var oldScore = 0;
var highScore = 0;
var level = 0;
var newLevel = true;

/* Player variables */
var invin = 0;
var justWarped = false;
var warpTimer = 0;
function Player(x, y) {
  this.x = x;
  this.y = y;
  this.rad = 25;
  this.mass = 75;
  this.v = new vector(0, 0);
}
var p = new Player(WIDTH/2, HEIGHT/2);


/* Bullet variables */
var bullets = [];
var bTimer = 0;
var justFired = false;
timeSinceLastFire = 500;
function Bullet(x, y, dir) {
  this.x = x;
  this.y = y;
  this.dir = dir;
  this.rad = 5;
}

/* Enemy variables */
var astrds = [];
function Astrd(x, y, mass, rad, vx, vy) {
   this.x = x;
   this.y = y;
   this.mass = mass;
   this.v = new vector(vx, vy);
   this.rad = rad;
 }
function vector(x, y, rad) {
  this.x = x;
  this.y = y;
  this.rad = rad;
}

var fireSound = new Audio("sounds\\shoot.wav");
var playerHit = new Audio("sounds\\phit.wav");
var aHit = new Audio("sounds\\ahit.wav")

/** @function handleKeydown
  * Event handler for keydown events
  * @param {KeyEvent} event - the keydown event
  */
function handleKeydown(event) {
  switch(event.key) {
    case ' ':
    case 'ArrowUp':
      currentInput.up = true;
      break;
    case 'ArrowDown':
      currentInput.down = true;
      break;
    case 'ArrowLeft':
      currentInput.left = true;
      break;
    case 'ArrowRight':
      currentInput.right = true;
      break;
    case 'w':
      currentInput.w = true;
      break;
    case 'a':
      currentInput.a = true;
      break;
    case 's':
      currentInput.s = true;
      break;
    case 'd':
      currentInput.d = true;
      break;
    case 'e':
      currentInput.e = true;
      break;
  }
}
// Attach keydown event handler to the window
window.addEventListener('keydown', handleKeydown);
/** @function handleKeyup
  * Event handler for keyup events
  * @param {KeyEvent} event - the keyup event
  */
function handleKeyup(event) {
  switch(event.key) {
    case 'ArrowUp':
      currentInput.up = false;
      break;
    case 'ArrowDown':
      currentInput.down = false;
      break;
    case 'ArrowLeft':
      currentInput.left = false;
      break;
    case 'ArrowRight':
      currentInput.right = false;
      break;
    case 'w':
      currentInput.w = false;
      break;
    case 'a':
      currentInput.a = false;
      break;
    case 's':
      currentInput.s = false;
      break;
    case 'd':
      currentInput.d = false;
      break;
    case 'e':
      currentInput.e = false;
      break;
  }
}
// Attach keyup event handler to the window
window.addEventListener('keyup', handleKeyup);

/** @function startGame
  * starts the game when the player clicks
  * @param {ClickEvent} event - the click event
  */
function startGame(event) {
  if(level === 0) {
    level++;
  }
}
window.addEventListener('click', startGame);

/** @function loop
  * The main game loop
  * @param {DomHighResTimestamp} timestamp - the current system time,
  * in milliseconds, expressed as a double.
  */
function loop(timestamp) {
  if(!start) start = timestamp;
  var elapsedTime = timestamp - start;
  start = timestamp;
  update(elapsedTime);
  // render into back buffer
  render(backBufferCtx);
  // flip buffers
  screenCtx.drawImage(backBuffer, 0, 0);
  window.requestAnimationFrame(loop);
}

/** @function update
  * Updates the game's state
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function update(elapsedTime) {
  if (level > 0) {
    if (newLevel) {
      spawnAsteriod(level-3,(level-1)%5,(level%4)*2);
      newLevel = false;
    }
    pFireBullet(elapsedTime);
    movePlayer(elapsedTime);
    warpPlayer(elapsedTime);
    moveBullets(elapsedTime);
    moveAsteriod(elapsedTime);
    checkCollision(elapsedTime);
    updateState();
  }
}

/** @function pFireBullet
  * If the player presses WASD, they fire a bullet.
  * If they hold the button down, it will autofire at a slow rate
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function pFireBullet(elapsedTime) {
  if(currentInput.w || currentInput.a || currentInput.s || currentInput.d) {
    if (timeSinceLastFire > 350) {
      timeSinceLastFire = 0;
      if (currentInput.w) {
        bullets.push(new Bullet(p.x, p.y-p.rad,'u'));
        fireSound.play();
      }
      else if(currentInput.a) {
        bullets.push(new Bullet(p.x-p.rad, p.y,'l'));
        fireSound.play();
      }
      else if (currentInput.s) {
        bullets.push(new Bullet(p.x, p.y+p.rad,'d'));
        fireSound.play();
      }
      else if(currentInput.d) {
        bullets.push(new Bullet(p.x+p.rad, p.y,'r'));
        fireSound.play();
      }
    }
  }
  timeSinceLastFire += elapsedTime;
}

/** @function movePlayer
  * Moves the player left, right, up and down based on keyboard input
  * When the player reaches the edge, warps them to the other side of the screen
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function movePlayer(elapsedTime) {
  if(currentInput.left) {
    p.x -= 0.2 * elapsedTime;
  }
  if(currentInput.right) {
    p.x += 0.2 * elapsedTime;
  }
  if(currentInput.up) {
    p.y -= 0.2 * elapsedTime;
  }
  if(currentInput.down) {
    p.y += 0.2 * elapsedTime;
  }

  if(p.x < 0) {
    p.x = WIDTH-1;
  }
  else if(p.x > WIDTH) {
    p.x = 1;
  }

  if(p.y < 0) {
    p.y = HEIGHT - 1;
  }
  else if(p.y > HEIGHT) {
    p.y = 0;
  }
}

/** @function warpPlayer
  * Moves the player to a random unoccupied position
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function warpPlayer(elapsedTime) {
  if(currentInput.e && warpTimer <= 0) {
    warpTimer = 300;
    justWarped = true;
    var newpos = getValidCoords(p.rad);
    p.x = newpos.x;
    p.y = newpos.y;
  }
  else {
    warpTimer -= elapsedTime;
    justWarped = false;
  }
}

/** @function moveBullets
  * Moves the player bullets in the direction they were fired
  * Reomves bullets that have gone off screen
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function moveBullets(elapsedTime) {
  for (var i = 0; i < bullets.length; i++) {
    switch(bullets[i].dir) {
      case 'u':
        bullets[i].y -= 0.28*elapsedTime;
        break;
      case 'd':
        bullets[i].y += 0.28*elapsedTime;
        break;
      case 'l':
        bullets[i].x -= 0.28*elapsedTime;
        break;
      case 'r':
       bullets[i].x += 0.28*elapsedTime;
       break;
    }
    if(bullets[i].x < 0 || bullets[i].x > WIDTH || bullets[i].y < 0 || bullets[i].y > HEIGHT) {
      bullets.splice(i,1);
    }
  }
}

/** @function spawnAsteriod
  * Creates new asteriods with a random mass and speed
  * at random unoccupied positions
  * @param {int} large - number of large asteriods to spawn
  * @param {int} med - number of medium asteriods to spawn
  * @param {int} small - number of small asteriods to spawn
  */
function spawnAsteriod(large, med, small) {
  for(var l = 0; l < large; l++) {
    var lc = getValidCoords(101)
    var xdir = Math.round(Math.random()) * 2 - 1
    var ydir = Math.round(Math.random()) * 2 - 1
    astrds.push(new Astrd(lc.x, lc.y, Math.floor(Math.random()*51)+80, 40, xdir*Math.random()/7, ydir*Math.random()/7));
  }
  for(var m = 0; m < med; m++) {
    var mc = getValidCoords(31)
    var xdir = Math.round(Math.random()) * 2 - 1
    var ydir = Math.round(Math.random()) * 2 - 1
    astrds.push(new Astrd(mc.x, mc.y, Math.floor(Math.random()*51)+30, 30, xdir*Math.random()/7, ydir*Math.random()/7));
  }
  for(var s = 0; s < small; s++) {
    var sc = getValidCoords(21)
    var xdir = Math.round(Math.random()) * 2 - 1
    var ydir = Math.round(Math.random()) * 2 - 1
    astrds.push(new Astrd(sc.x, sc.y, Math.floor(Math.random()*21)+10, 20, xdir*Math.random()/8, ydir*Math.random()/8));
  }
}

/** @function moveAsteriod
  * Moves the asteriods based on their velocity vectors
  * If an asteriod reaches the edge of the screen, warps it to the other side
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function moveAsteriod(elapsedTime) {
  for(var i = 0; i < astrds.length; i++) {
    astrds[i].x += astrds[i].v.x * elapsedTime;
    astrds[i].y += astrds[i].v.y * elapsedTime;

    if(astrds[i].x < 0) {
      astrds[i].x = WIDTH-1;
    }
    else if(astrds[i].x > WIDTH) {
      astrds[i].x = 1;
    }

    if(astrds[i].y < 0) {
      astrds[i].y = HEIGHT - 1;
    }
    else if(astrds[i].y > HEIGHT) {
      astrds[i].y = 0;
    }
  }
}

/** @function getValidCoords
  * Finds a a positon for an object of a given size where it is not colliding
  * with anything
  * @param {int} size - the radius of the object you want to find a position for
  * @return {vector} - a vector containing the new positon
  */
function getValidCoords(size) {
  var xcoord;
  var ycoord;
  var v;

  do {
    xcoord = Math.floor(Math.random() * WIDTH);
    ycoord = Math.floor(Math.random() * HEIGHT);
    v = new vector(xcoord, ycoord, size);
  } while(isCollidingAstrds(v) || isCollidingPlayer(v));

  return new vector(xcoord, ycoord);
}

/** @function isCollidingAstrds
  * Checks to see if the given object is colliding with any asteriods
  * @param {int} obj - the object you want to check collisions for
  * @return {int/bool} - the index plus one (to prevent false negatives) of the
  * asteriod that is colliding with the object if one exists. Otherwise, returns false
  */
function isCollidingAstrds(obj) {
    for(var i = 0; i < astrds.length; i++) {
      if (!(obj === astrds[i])) {
        var distanceSquared = Math.pow(obj.x - astrds[i].x, 2) + Math.pow(obj.y - astrds[i].y, 2);
        if(distanceSquared < Math.pow(obj.rad + astrds[i].rad, 2)) {
          return i+1;
        }
      }
    }
    return false;
}

/** @function isCollidingPLayer
  * Checks to see if the given object is colliding with the player
  * @param {int} obj - the object you want to check collisions for
  * @return {bool} - True if it is colliding, Otherwise, false
  */
function isCollidingPlayer(obj) {
  var distanceSquared = Math.pow(obj.x - p.x, 2) + Math.pow(obj.y - p.y, 2);
  if(distanceSquared < Math.pow(obj.rad + p.rad, 2)) {
    return true;
  }
  return false;
}

/** @function isCollidingBullet
  * Checks to see if the given object is colliding with any bullets
  * @param {int} obj - the object you want to check collisions for
  * @return {int/bool} - the index plus one (to prevent false negatives) of the
  * bullet that is colliding with the object if one exists. Otherwise, returns false
  */
function isCollidingBullet(obj) {
  for (var i = 0; i < bullets.length; i++) {
    var distanceSquared = Math.pow(obj.x - bullets[i].x, 2) + Math.pow(obj.y - bullets[i].y, 2);
    if(distanceSquared < Math.pow(obj.rad + bullets[i].rad, 2)) {
      return i+1;
    }
  }
  return false;
}

/** @function checkCollision
  * Checks to see if any asteriods are colliding with other asteriods, the player,
  * or bullets, and handles the collision accordingly
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function checkCollision(elapsedTime) {
  for (var i = 0; i < astrds.length; i++) {
    var index = isCollidingAstrds(astrds[i])
    if(index) {
      bounceObj(astrds[i], astrds[index-1]);
      moveObjsApart(astrds[i], astrds[index-1]);
    }
    if(isCollidingPlayer(astrds[i])) {
      bounceObj(p, astrds[i]);
      moveObjsApart(p, astrds[i]);
      if (invin <= 0) {
        lives--;
        playerHit.play();
        invin = 1000;
      }
    }
    invin -= elapsedTime
    index = isCollidingBullet(astrds[i])
    if(index) {
      splitAstrds(index-1, i);
    }
  }
}

/** @function bounceObj
  * Calculates the new velocities of two objects as if they elastically collided
  * and updates their veloicties accordingly
  * @param {object with mass and velocity vector} obj1 - one object involved in the
  * collision
  * @param {object with mass and velocity vector} obj2 - the other object involved in the
  * collision
  */
function bounceObj(obj1, obj2) {
  if(obj1 === p) {
    obj2.v.x *= -1;
    obj2.v.y *= -1;
    return;
  }

  var nv1 = new vector();
  var nv2 = new vector();

  var massSum = (obj1.mass + obj2.mass)
  var c1 = (obj1.mass - obj2.mass)/massSum
  var c2 = (2*obj2.mass)/massSum
  var c3 = (2*obj1.mass)/massSum
  var c4 = (obj2.mass - obj1.mass)/massSum

  nv1.x = (c1*obj1.v.x) + (c2*obj2.v.x)
  nv1.y = (c1*obj1.v.y) + (c2*obj2.v.y)

  nv2.x = (c3*obj1.v.x) + (c4*obj2.v.x)
  nv2.y = (c3*obj1.v.y) + (c4*obj2.v.y)

  obj1.v.x = nv1.x;
  obj1.v.y = nv1.y;

  obj2.v.x = nv2.x;
  obj2.v.y = nv2.y;
}

/** @function moveObjsApart
  * Takes two objects that are overlaping and adjusts their postions so they are
  * not overlaping
  * @param {object with x and y} obj1 - one object involved in the
  * collision
  * @param {object with x and y} obj1\2 - the other object involved in the
  * collision
  */
function moveObjsApart(obj1, obj2) {
  var dis = Math.sqrt(Math.pow(obj1.x-obj2.x, 2) + Math.pow(obj1.y-obj2.y, 2));
  var overlap = (obj1.rad+obj2.rad) - dis;

  var angle = Math.atan2(obj1.y-obj2.y, obj1.x-obj2.x);

  var overlapx = Math.cos(angle)*overlap;
  var overlapy = Math.sin(angle)*overlap;

  obj1.x += 0.5*overlapx;
  obj1.y += 0.5*overlapy;

  obj2.x -= 0.5*overlapx;
  obj2.y -= 0.5*overlapy;
}

/** @function splitAstrds
  * Splits an asteriod into two pieces that move parrallel to the direction of the bullet
  * if it is large enough. Otherwise, destroys the asteriods
  * @param {int} bi - index of the bullet
  * @param {int} ai - index of the asteroid
  */
function splitAstrds(bi, ai) {
  if(astrds[ai].rad === 20) {
    astrds.splice(ai, 1);
    score += 20;
  }
  else {
    score += astrds[ai].rad;
    var speed = 0.5*Math.sqrt(astrds[ai].v.x*astrds[ai].v.x + astrds[ai].v.y*astrds[ai].v.y);
    var mass = 0.5*astrds[ai].mass;
    var rad = astrds[ai].rad - 10;
    if (bullets[bi].dir === "u" || bullets[bi].dir === "d") {
      astrds.push(new Astrd(astrds[ai].x+rad, astrds[ai].y, mass, rad, speed, 0))
      astrds.push(new Astrd(astrds[ai].x-rad, astrds[ai].y, mass, rad, -1*speed, 0))
    }
    else {
      astrds.push(new Astrd(astrds[ai].x, astrds[ai].y+rad, mass, rad, 0, speed))
      astrds.push(new Astrd(astrds[ai].x, astrds[ai].y-rad, mass, rad, 0, -1*speed))
    }
    astrds.splice(ai, 1);
  }
  aHit.play();
  bullets.splice(bi, 1);
}

/** @function updateState
  * Checks to see if all the asteriods are gone, and if so moves the game to the next Level
  * Resets the game if the player loses all theit Lives
  */
function updateState() {
  if(astrds.length === 0) {
    if(lives < 9) {
      lives++;
    }
    level++;
    newLevel = true;
  }
  if(lives === 0) {
    oldScore = score;
    if (score > highScore) {
      highScore = score;
    }
    score = 0;
    lives = 3;
    newLevel = true;
    level = 0;
    astrds.length = 0;
    bullets.length = 0;
  }
}

/** @function render
  * Renders the game into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function render(ctx) {
  ctx.fillStyle = "#000033";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (level === 0) {
    if (highScore !== 0) {
      drawScores(ctx);
    }
    drawStart(ctx);
  }
  else {
    drawPlayer(ctx);
    drawBullets(ctx);
    drawAstrds(ctx);
    drawUI(ctx);
  }
}

/** @function drawPlayer
  * Draws the player into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawPlayer(ctx) {
  ctx.beginPath();
  ctx.arc(p.x,p.y,p.rad,0,2*Math.PI);
  ctx.fillStyle = "#003A99";
  ctx.fill();
}

/** @function drawBullets
  * Renders the bullets into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawBullets(ctx) {
  for (var i = 0; i < bullets.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = "#FF0000";
    ctx.arc(bullets[i].x,bullets[i].y,bullets[i].rad,0,2*Math.PI);
    ctx.fill();
  }
}

/** @function drawAstrds
  * Renders the asteriods into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawAstrds(ctx) {
  for(var i = 0; i < astrds.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = "#434323";
    ctx.arc(astrds[i].x,astrds[i].y,astrds[i].rad,0,2*Math.PI);
    ctx.fill();
  }
}

/** @function drawUI
  * Renders the UI elements into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawUI(ctx) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "20px Arial";
  ctx.fillText("Score: "+score.toString(),5,25);
  ctx.fillText("Lives: "+lives.toString(),WIDTH-80,25);
  ctx.font = "30px Arial";
  ctx.fillText("Level "+level.toString(),WIDTH/2-50,HEIGHT-10)
}

/** @function drawStart
  * Renders the text "CLick to start" into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawStart(ctx) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "40px Arial";
  ctx.fillText("Click to Begin",WIDTH/2-120,HEIGHT/2-30);
}

/** @function drawScores
  * Renders the endgame score and high score into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawScores(ctx) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "40px Arial";
  ctx.fillText("Your Score: "+oldScore.toString(),WIDTH/2-120,HEIGHT/2+50);
  ctx.fillText("High Score: "+highScore.toString(),WIDTH/2-120,HEIGHT/2+100);
}

// Start the game loop
window.requestAnimationFrame(loop);
