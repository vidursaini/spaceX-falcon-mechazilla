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
  createCanvas(800, 600);
  booster = new Booster();
  arms = new Arms();
  landingPad = new LandingPad();
  catchZoneIndicator = new CatchZoneIndicator();
  
  // Check if device is mobile
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Set up start button dimensions
  startButton.width = 200;
  startButton.height = 60;
  startButton.x = width / 2 - startButton.width / 2;
  startButton.y = height / 2 + 200;

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
    // Determine if left or right half was touched
    if (x < width / 2) {
      touchLeft = true;
    } else {
      touchRight = true;
    }
    
    // Trigger catch action if not already triggered this round
    if (!spacePressedThisRound) {
      touchCatch = true;
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
    
    // Update touch direction based on which half of the screen is touched
    touchLeft = x < width / 2;
    touchRight = x >= width / 2;
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
  let poleStartY = 250;

  // Draw main tower structure
  for (let i = 0; i < 30; i++) {
    let shade = map(i, 0, 30, 100, 150);
    fill(shade);
    rect(385 + i, poleStartY, 2, 330); // Shorter height
  }

  // Add structural details to make it look like launch tower
  stroke(100);
  strokeWeight(1);
  // Cross beams
  for (let y = poleStartY + 50; y < 580; y += 70) {
    line(380, y, 420, y);
    line(380, y + 10, 420, y + 10);
  }

  // Vertical support lines
  line(380, poleStartY, 380, 580);
  line(420, poleStartY, 420, 580);

  // Base structure
  fill(120);
  noStroke();
  rect(370, 580, 60, 20);
}

/** Displays the title screen with instructions */
function drawTitle() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Falcon Landing Simulator", width / 2, height / 3);

  textSize(24);
  
  if (isMobile) {
    text("Touch left/right side to move", width / 2, height / 2);
    text("Tap anywhere to catch at the right moment", width / 2, height / 2 + 40);
  } else {
    text("Use ← → to move the booster", width / 2, height / 2);
    text("Press SPACE to catch at the right moment", width / 2, height / 2 + 40);
  }
  
  text(
    "Align the red dot with the red target rectangle",
    width / 2,
    height / 2 + 80
  );
  text(
    "Land in the green zone when arms are closed",
    width / 2,
    height / 2 + 120
  );
  
  if (isMobile) {
    // Draw start button
    fill(50, 150, 255);
    rect(startButton.x, startButton.y, startButton.width, startButton.height, 10);
    fill(255);
    textSize(28);
    text("START", width / 2, startButton.y + startButton.height/2);
  } else {
    text("Press any key to start", width / 2, height / 2 + 160);
  }

  if (keyIsPressed && !isMobile) {
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
  textSize(48);
  text("GAME OVER", width / 2, height / 3);

  textSize(32);
  text("Score: " + score, width / 2, height / 2 - 20);
  text("High Score: " + highScore, width / 2, height / 2 + 20);

  textSize(24);
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
    this.y = 580;
  }

  display() {
    // Draw landing surface
    fill(50, 50, 50);
    rect(0, this.y, this.width, this.height);

    // Draw landing markings
    fill(30, 30, 30);
    for (let i = 0; i < width; i += 40) {
      rect(i, this.y, 20, this.height);
    }

    // Draw SpaceX-style landing pad
    fill(80);
    ellipse(400, this.y, 100, 10); // Center landing pad

    // Draw landing pad markings
    fill(255);
    rect(370, this.y - 2, 60, 4);

    // Draw "X" marking
    stroke(255);
    strokeWeight(3);
    line(390, this.y - 5, 410, this.y + 5);
    line(410, this.y - 5, 390, this.y + 5);
    noStroke();
  }
}

class Arms {
  constructor() {
    this.y = 300;
    this.height = 20; // Reduced height for cleaner look
    this.isOpen = true;
    this.leftX = 280; // Start position for left side
    this.rightX = 520; // Start position for right side
    this.targetLeftX = this.leftX;
    this.targetRightX = this.rightX;
  }

  display() {
    push();
    strokeWeight(2);

    // Animate arm movement
    if (this.isOpen) {
      this.targetLeftX = 280; // Open position
      this.targetRightX = 520; // Open position
    } else {
      this.targetLeftX = 380; // Closed position
      this.targetRightX = 420; // Closed position
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
    this.y = 300;
    this.height = 20; // Match arms height
  }

  display() {
    // Draw catch zone indicator
    noFill();
    stroke(0, 255, 0, 100);
    strokeWeight(2);
    rect(380, this.y, 40, this.height);

    // Draw red target area
    fill(255, 0, 0, 100);
    stroke(255, 0, 0);
    rect(380, this.y - 2, 40, this.height + 4); // Cover entire catch zone width

    strokeWeight(1);
  }

  isInCatchZone(booster) {
    return (
      booster.y + booster.catchingOffset >= this.y &&
      booster.y + booster.catchingOffset <= this.y + this.height &&
      booster.x + booster.width / 2 > 380 &&
      booster.x + booster.width / 2 < 420
    );
  }
}

class Booster {
  constructor() {
    this.width = 50;
    this.height = 250;
    this.catchingOffset = 50; // Catching point at y + 50 (top half)
    this.x = random(50, width - 100); // Random x-position at top
    this.y = -this.height; // Start above canvas
    this.vy = 2 + min(score * 0.15, 3); // Faster speed increase
    this.fireParticles = [];
  }

  update() {
    // Apply wind force
    this.x += windForce;

    if (!isMobile) {
      // Desktop controls
      if (keyIsDown(LEFT_ARROW)) {
        this.x -= 5;
      } else if (keyIsDown(RIGHT_ARROW)) {
        this.x += 5;
      }
    } else {
      // Mobile controls
      if (touchLeft) {
        this.x -= 5;
      } else if (touchRight) {
        this.x += 5;
      }
    }

    this.x = constrain(this.x, 0, width - this.width);
    this.y += this.vy; // Fall downward
  }

  updateFireParticles() {
    // Add new fire particles
    for (let i = 0; i < 3; i++) {
      this.fireParticles.push({
        x: this.x + this.width / 2 + random(-15, 15),
        y: this.y + this.height,
        size: random(5, 15),
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
    rect(this.x, this.y, this.width, this.height - 20); // Main body

    // SpaceX logo
    fill(0);
    textSize(12);
    textAlign(CENTER);
    text("SpaceX", this.x + this.width / 2, this.y + 30);

    // Draw details - black stripes like Falcon 9
    fill(30);
    rect(this.x, this.y + 50, this.width, 10); // Black stripe
    rect(this.x, this.y + 120, this.width, 10); // Black stripe
    rect(this.x, this.y + 190, this.width, 10); // Black stripe

    // Grid fins
    fill(80);
    // Left grid fin
    rect(this.x - 10, this.y + 60, 10, 30);
    // Right grid fin
    rect(this.x + this.width, this.y + 60, 10, 30);

    // Draw engine section
    fill(50); // Dark gray engines
    rect(this.x - 10, this.y + this.height - 20, this.width + 20, 20); // Engine base

    // Draw engine nozzles
    fill(30);
    for (let i = -15; i <= 15; i += 10) {
      ellipse(this.x + this.width / 2 + i, this.y + this.height - 10, 8, 8); // Nozzles
    }

    // Draw top interstage circle
    fill(200);
    ellipse(this.x + this.width / 2, this.y, 5, 5); // Top circle

    pop(); // Restore drawing state

    // Draw catching point
    fill(255, 0, 0); // Red
    ellipse(this.x + this.width / 2, this.y + this.catchingOffset, 10, 10); // Catching marker
  }

  drawFireParticles() {
    noStroke();
    for (let p of this.fireParticles) {
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      ellipse(p.x, p.y, p.size);
    }
  }
}
