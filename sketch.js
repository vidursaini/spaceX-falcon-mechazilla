let gameState = "title";
let booster;
let arms;
let score = 0;
let highScore = 0;
let spacePressedThisRound = false;
let stars = [];
let landingPad;
let windForce = 0;
let catchZoneIndicator;
let difficulty = 1;
// Mobile touch variables
let isMobile = false;
let touchLeft = false;
let touchRight = false;
let touchCatch = false;
let startButton = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

function setup() {
  // Create responsive canvas
  let canvasWidth, canvasHeight;
  
  if (isMobile) {
    // For mobile, use responsive sizing
    canvasWidth = windowWidth;
    canvasHeight = windowHeight;
    
    // Set a minimum size to maintain playability
    canvasWidth = max(canvasWidth, 320);
    canvasHeight = max(canvasHeight, 480);
  } else {
    // For desktop, use fixed size
    canvasWidth = 800;
    canvasHeight = 600;
  }
  
  createCanvas(canvasWidth, canvasHeight);
  
  booster = new Booster();
  arms = new Arms();
  landingPad = new LandingPad();
  catchZoneIndicator = new CatchZoneIndicator();
  
  // Check if device is mobile
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Set up start button dimensions
  startButton.width = min(200, width * 0.5);
  startButton.height = 60;
  startButton.x = width / 2 - startButton.width / 2;
  startButton.y = height / 2 + 120;

  // Create stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height - 30),
      size: random(1, 3),
      brightness: random(150, 255),
    });
  }
  
  // Register touch event handlers
  if (isMobile) {
    registerTouchEvents();
  }
}

// Add window resize handling
function windowResized() {
  let canvasWidth, canvasHeight;
  
  if (isMobile) {
    // For mobile, use responsive sizing
    canvasWidth = windowWidth;
    canvasHeight = windowHeight;
    
    // Set a minimum size to maintain playability
    canvasWidth = max(canvasWidth, 320);
    canvasHeight = max(canvasHeight, 480);
  } else {
    // For desktop, use fixed size
    canvasWidth = 800;
    canvasHeight = 600;
  }
  
  resizeCanvas(canvasWidth, canvasHeight);
  
  // Update start button position
  startButton.width = min(200, width * 0.5);
  startButton.x = width / 2 - startButton.width / 2;
  startButton.y = height / 2 + 120;
  
  // Reposition stars
  for (let i = 0; i < stars.length; i++) {
    stars[i].x = random(width);
    stars[i].y = random(height - 30);
  }
}

function registerTouchEvents() {
  // Add touch event listeners
  let canvasElement = document.querySelector('canvas');
  canvasElement.addEventListener('touchstart', handleTouchStart, false);
  canvasElement.addEventListener('touchend', handleTouchEnd, false);
  canvasElement.addEventListener('touchmove', handleTouchMove, false);
}

function handleTouchStart(event) {
  event.preventDefault();
  
  // Get touch coordinates
  const touch = event.touches[0];
  const rect = event.target.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  if (gameState === "title") {
    // Check if start button was pressed
    if (x >= startButton.x && x <= startButton.x + startButton.width &&
        y >= startButton.y && y <= startButton.y + startButton.height) {
      gameState = "play";
    }
  } else if (gameState === "play") {
    // Check if touch is on the pole area (center of screen)
    const poleLeftX = width / 2 - 40;
    const poleRightX = width / 2 + 40;
    
    if (x >= poleLeftX && x <= poleRightX) {
      // Touch on pole - trigger catch action
      if (!spacePressedThisRound) {
        touchCatch = true;
      }
    } else {
      // Determine if left or right half was touched for movement
      if (x < poleLeftX) {
        touchLeft = true;
        touchRight = false;
      } else if (x > poleRightX) {
        touchLeft = false;
        touchRight = true;
      }
    }
  } else if (gameState === "gameOver") {
    gameState = "title";
    score = 0;
    booster = new Booster();
    arms.reset();
  }
}

function handleTouchEnd(event) {
  event.preventDefault();
  touchLeft = false;
  touchRight = false;
  touchCatch = false;
}

function handleTouchMove(event) {
  event.preventDefault();
  
  if (gameState === "play") {
    // Get touch coordinates
    const touch = event.touches[0];
    const rect = event.target.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    // Check if touch is on the pole area (center of screen)
    const poleLeftX = width / 2 - 40;
    const poleRightX = width / 2 + 40;
    
    if (x >= poleLeftX && x <= poleRightX) {
      // Don't change movement when touching the pole
    } else {
      // Update touch direction based on which half of the screen is touched
      touchLeft = x < poleLeftX;
      touchRight = x > poleRightX;
    }
  }
}

function draw() {
  drawBackground();
  drawPole();
  if (gameState === "title") {
    drawTitle();
  } else if (gameState === "play") {
    playGame();
  } else if (gameState === "gameOver") {
    drawGameOver();
  }
}

/** Draws the background with sky, stars and ground */
function drawBackground() {
  background(10, 10, 40);

  // Draw stars with twinkle effect
  for (let star of stars) {
    fill(star.brightness + random(-20, 20));
    noStroke();
    ellipse(star.x, star.y, star.size);
  }

  // Draw wind indicator
  if (gameState === "play") {
    drawWindIndicator();
  }

  landingPad.display();
}

function drawWindIndicator() {
  let windStrength = abs(windForce);
  let windDirection = windForce > 0 ? "→" : "←";

  // Draw wind strength meter
  fill(255);
  textAlign(LEFT);
  textSize(16);
  text("Wind: " + windDirection.repeat(ceil(windStrength)), 50, 110);
}

/** Draws the centered vertical pole */
function drawPole() {
  // Start tower just above catch zone
  let poleStartY = height * 0.4;
  let poleWidth = width * 0.1;
  let centerX = width / 2;
  
  // Calculate pole dimensions
  let poleLeftX = centerX - poleWidth / 2;
  let poleRightX = centerX + poleWidth / 2;
  let poleHeight = height - poleStartY - 20;

  // Draw main tower structure
  for (let i = 0; i < poleWidth; i++) {
    let shade = map(i, 0, poleWidth, 100, 150);
    fill(shade);
    rect(poleLeftX + i, poleStartY, 2, poleHeight);
  }

  // Add structural details to make it look like launch tower
  stroke(100);
  strokeWeight(1);
  
  // Cross beams - space them evenly
  let beamSpacing = poleHeight / 8;
  for (let y = poleStartY + beamSpacing; y < height - 20; y += beamSpacing) {
    line(poleLeftX - 5, y, poleRightX + 5, y);
    line(poleLeftX - 5, y + 10, poleRightX + 5, y + 10);
  }

  // Vertical support lines
  line(poleLeftX - 5, poleStartY, poleLeftX - 5, height - 20);
  line(poleRightX + 5, poleStartY, poleRightX + 5, height - 20);

  // Base structure
  fill(120);
  noStroke();
  rect(poleLeftX - 15, height - 20, poleWidth + 30, 20);
}

/** Displays the title screen with instructions */
function drawTitle() {
  fill(255);
  textAlign(CENTER, CENTER);
  
  // Responsive text sizes
  let titleSize = min(48, width / 16);
  let instructionSize = min(24, width / 32);
  let smallTextSize = min(18, width / 42);
  
  textSize(titleSize);
  text("Falcon Landing Simulator", width / 2, height / 3);

  textSize(instructionSize);
  if (isMobile) {
    text("Touch left/right side to move", width / 2, height / 2 - 40);
    text("Touch the pole to catch at the right moment", width / 2, height / 2);
    text("Land in the green zone when arms are closed", width / 2, height / 2 + 40);
  } else {
    text("Use LEFT/RIGHT arrows to move", width / 2, height / 2 - 40);
    text("Press SPACE to catch at the right moment", width / 2, height / 2);
    text("Land in the green zone when arms are closed", width / 2, height / 2 + 40);
  }

  // Draw start button
  fill(30, 144, 255);
  rect(startButton.x, startButton.y, startButton.width, startButton.height, 10);
  
  fill(255);
  textSize(min(32, width / 24));
  text("START", width / 2, startButton.y + startButton.height / 2);
  
  // Draw share button
  let shareButtonY = startButton.y + startButton.height + 20;
  fill(29, 161, 242); // Twitter blue
  rect(width / 2 - startButton.width / 2, shareButtonY, startButton.width, 40, 10);
  
  fill(255);
  textSize(smallTextSize);
  text("Share Your Score on X", width / 2, shareButtonY + 20);
  
  // Handle keyboard input for desktop
  if (!isMobile && keyIsPressed) {
    gameState = "play";
  }
}

/** Main gameplay loop */
function playGame() {
  // Update wind force
  if (random() < 0.01) {
    windForce = random(-1, 1) * difficulty;
  }

  // Display score and wind
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text("Score: " + score, 50, 50);

  fill(30, 144, 255);
  text("High Score: " + highScore, 50, 80);

  // Update and display game elements
  booster.update();
  booster.updateFireParticles();
  booster.display();

  catchZoneIndicator.display();
  arms.display();

  // Handle desktop controls
  if (!isMobile && keyIsPressed && keyCode === 32 && !spacePressedThisRound) {
    spacePressedThisRound = true;
    arms.close();

    if (catchZoneIndicator.isInCatchZone(booster)) {
      score++;
      if (score > highScore) {
        highScore = score;
      }
      difficulty = 1 + score * 0.2;
      booster = new Booster();
      arms.reset();
    } else {
      gameState = "gameOver";
    }
  }
  
  // Handle mobile touch catch
  if (isMobile && touchCatch && !spacePressedThisRound) {
    spacePressedThisRound = true;
    arms.close();

    if (catchZoneIndicator.isInCatchZone(booster)) {
      score++;
      if (score > highScore) {
        highScore = score;
      }
      difficulty = 1 + score * 0.2;
      booster = new Booster();
      arms.reset();
    } else {
      gameState = "gameOver";
    }
    
    touchCatch = false;
  }

  if ((!isMobile && (!keyIsPressed || keyCode !== 32)) || 
      (isMobile && !touchCatch)) {
    spacePressedThisRound = false;
  }

  if (booster.y + booster.height >= 580) {
    gameState = "gameOver";
  }
}

/** Displays the game-over screen */
function drawGameOver() {
  fill(255);
  textAlign(CENTER, CENTER);
  
  // Responsive text sizes
  let titleSize = min(48, width / 16);
  let scoreSize = min(32, width / 24);
  let instructionSize = min(24, width / 32);
  
  textSize(titleSize);
  text("GAME OVER", width / 2, height / 3);

  textSize(scoreSize);
  text("Score: " + score, width / 2, height / 2 - 20);
  text("High Score: " + highScore, width / 2, height / 2 + 20);

  textSize(instructionSize);
  if (isMobile) {
    text("Tap anywhere to restart", width / 2, height / 2 + 80);
  } else {
    text("Press any key to restart", width / 2, height / 2 + 80);
  }

  if (keyIsPressed && !isMobile) {
    gameState = "title";
    score = 0;
    booster = new Booster();
    arms.reset();
  }
  // We don't check touchCatch here since it's handled in handleTouchStart
}

/** Landing Pad class */
class LandingPad {
  constructor() {
    this.width = width;
    this.height = 20;
    this.y = height - this.height;
  }

  display() {
    // Draw landing surface
    fill(50, 50, 50);
    rect(0, this.y, this.width, this.height);

    // Draw landing markings
    fill(30, 30, 30);
    let markingWidth = width / 20;
    for (let i = 0; i < width; i += markingWidth * 2) {
      rect(i, this.y, markingWidth, this.height);
    }

    // Draw SpaceX-style landing pad
    let centerX = width / 2;
    let padWidth = width * 0.25;
    
    fill(80);
    ellipse(centerX, this.y, padWidth, 10); // Center landing pad

    // Draw landing pad markings
    fill(255);
    rect(centerX - padWidth * 0.3, this.y - 2, padWidth * 0.6, 4);

    // Draw "X" marking
    stroke(255);
    strokeWeight(3);
    let xSize = padWidth * 0.1;
    line(centerX - xSize, this.y - 5, centerX + xSize, this.y + 5);
    line(centerX + xSize, this.y - 5, centerX - xSize, this.y + 5);
    noStroke();
  }
}

class Arms {
  constructor() {
    this.y = height * 0.5;
    this.height = 20; // Reduced height for cleaner look
    this.isOpen = true;
    
    // Calculate positions based on screen width
    let centerX = width / 2;
    let openWidth = width * 0.3;
    
    this.leftX = centerX - openWidth; // Start position for left side
    this.rightX = centerX + openWidth; // Start position for right side
    this.targetLeftX = this.leftX;
    this.targetRightX = this.rightX;
    
    // Closed position is near the pole
    this.closedLeftX = centerX - width * 0.05;
    this.closedRightX = centerX + width * 0.05;
  }

  display() {
    push();
    strokeWeight(2);

    // Animate arm movement
    if (this.isOpen) {
      this.targetLeftX = width / 2 - width * 0.3; // Open position
      this.targetRightX = width / 2 + width * 0.3; // Open position
    } else {
      this.targetLeftX = this.closedLeftX; // Closed position
      this.targetRightX = this.closedRightX; // Closed position
    }

    // Smooth movement
    this.leftX = lerp(this.leftX, this.targetLeftX, 0.2);
    this.rightX = lerp(this.rightX, this.targetRightX, 0.2);

    // Draw the continuous horizontal line
    fill(180);
    stroke(100);
    rect(this.leftX, this.y, this.rightX - this.leftX, this.height);

    // Add a subtle gradient effect
    noStroke();
    fill(200, 200, 200, 50);
    rect(this.leftX, this.y + 5, this.rightX - this.leftX, 5);

    pop();
  }

  close() {
    this.isOpen = false;
  }

  reset() {
    this.isOpen = true;
  }
}

class CatchZoneIndicator {
  constructor() {
    this.y = height * 0.5;
    this.height = 20; // Match arms height
    this.width = width * 0.1;
    this.x = width / 2 - this.width / 2;
  }

  display() {
    // Draw catch zone indicator
    noFill();
    stroke(0, 255, 0, 100);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.height);

    // Draw red target area
    fill(255, 0, 0, 100);
    stroke(255, 0, 0);
    rect(this.x, this.y - 2, this.width, this.height + 4); // Cover entire catch zone width

    strokeWeight(1);
  }

  isInCatchZone(booster) {
    return (
      booster.y + booster.catchingOffset >= this.y &&
      booster.y + booster.catchingOffset <= this.y + this.height &&
      booster.x + booster.width / 2 > this.x &&
      booster.x + booster.width / 2 < this.x + this.width
    );
  }
}

class Booster {
  constructor() {
    // Make booster size relative to screen size
    this.width = width * 0.06;
    this.height = height * 0.4;
    this.catchingOffset = this.height * 0.2; // Catching point at y + 20% (top half)
    this.x = random(this.width, width - this.width * 2); // Random x-position at top
    this.y = -this.height; // Start above canvas
    this.vy = 2 + min(score * 0.15, 3); // Faster speed increase
    this.fireParticles = [];
  }

  update() {
    // Apply wind force
    this.x += windForce;

    // Movement speed based on screen width
    let moveSpeed = 5;
    if (width > 800) {
      moveSpeed = 5;
    } else {
      moveSpeed = width * 0.006;
    }

    if (!isMobile) {
      // Desktop controls
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or A key
        this.x -= moveSpeed;
      } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or D key
        this.x += moveSpeed;
      }
    } else {
      // Mobile controls
      if (touchLeft) {
        this.x -= moveSpeed;
      } else if (touchRight) {
        this.x += moveSpeed;
      }
    }

    this.x = constrain(this.x, 0, width - this.width);
    this.y += this.vy; // Fall downward
  }

  updateFireParticles() {
    // Add new fire particles
    for (let i = 0; i < 3; i++) {
      this.fireParticles.push({
        x: this.x + this.width / 2 + random(-this.width/3, this.width/3),
        y: this.y + this.height,
        size: random(this.width/10, this.width/3),
        vx: random(-0.5, 0.5),
        vy: random(2, 5),
        alpha: 255,
        color: [random(200, 255), random(100, 150), 0], // Orange-yellow fire
      });
    }

    // Update existing particles
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      let p = this.fireParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.size -= 0.2;
      p.alpha -= 5;

      // Remove dead particles
      if (p.size <= 0 || p.alpha <= 0) {
        this.fireParticles.splice(i, 1);
      }
    }
  }

  display() {
    push(); // Save drawing state

    // Draw fire particles first (behind rocket)
    this.drawFireParticles();

    // Draw booster body with SpaceX-style design
    fill(240); // White body like Falcon 9
    rect(this.x, this.y, this.width, this.height - this.height/12); // Main body

    // SpaceX logo
    fill(0);
    textSize(max(12, this.width/4));
    textAlign(CENTER);
    text("SpaceX", this.x + this.width / 2, this.y + this.height/8);

    // Draw details - black stripes like Falcon 9
    fill(30);
    rect(this.x, this.y + this.height/5, this.width, this.height/25); // Black stripe
    rect(this.x, this.y + this.height/2.5, this.width, this.height/25); // Another stripe

    // Draw grid fins
    fill(120);
    // Left fin
    rect(this.x - this.width/6, this.y + this.height/10, this.width/6, this.height/15);
    // Right fin
    rect(this.x + this.width, this.y + this.height/10, this.width/6, this.height/15);

    // Draw landing legs (folded)
    fill(80);
    rect(this.x - this.width/10, this.y + this.height - this.height/12, this.width/10, this.height/12);
    rect(this.x + this.width, this.y + this.height - this.height/12, this.width/10, this.height/12);

    // Draw engine nozzles
    fill(150);
    let nozzleWidth = this.width / 3;
    let nozzleHeight = this.height / 15;
    ellipse(this.x + this.width/2, this.y + this.height, nozzleWidth, nozzleHeight);

    // Draw the red dot for catching point
    fill(255, 0, 0);
    ellipse(this.x + this.width/2, this.y + this.catchingOffset, 8, 8);

    pop(); // Restore drawing state
  }

  drawFireParticles() {
    // Draw all fire particles
    noStroke();
    for (let p of this.fireParticles) {
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      ellipse(p.x, p.y, p.size);
    }
  }
}
