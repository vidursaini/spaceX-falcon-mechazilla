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
  height: 0,
};

// Initialize Supabase client
const supabaseUrl = "https://zbiielbjamsltdowvsxf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaWllbGJqYW1zbHRkb3d2c3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NDMyMzEsImV4cCI6MjA1NjMxOTIzMX0._pPwVFkh1Jz-QIRQG_lRLvb6Rn54zBS4KHXo-EUkWMg";
let supabase = null;

// Leaderboard state
let showingLeaderboard = false;
let showingLeaderboardForm = false;

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
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

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

  // Initialize Supabase client
  try {
    console.log("Initializing Supabase client...");
    // Create Supabase client
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully");
    setupLeaderboardListeners();
  } catch (error) {
    console.error("Error initializing Supabase:", error);
    showingLeaderboard = false;
    showingLeaderboardForm = false;
  }
}

// Set up event listeners for leaderboard UI
function setupLeaderboardListeners() {
  // Get DOM elements
  const leaderboardForm = document.getElementById("leaderboardForm");
  const leaderboardDisplay = document.getElementById("leaderboardDisplay");
  const finalScoreElement = document.getElementById("finalScore");
  const submitButton = document.getElementById("submitScore");
  const skipButton = document.getElementById("skipSubmission");
  const viewLeaderboardButton = document.getElementById("viewLeaderboard");
  const closeLeaderboardButton = document.getElementById("closeLeaderboard");
  const returnToGameButton = document.getElementById("returnToGame");

  // Submit score button
  submitButton.addEventListener("click", async () => {
    const playerEmail = document.getElementById("playerEmail").value;
    const playerName =
      document.getElementById("playerName").value || "Anonymous";

    if (!playerEmail) {
      alert("Please enter your email");
      return;
    }

    try {
      await submitScore(playerEmail, playerName, score);
      leaderboardForm.style.display = "none";
      showingLeaderboardForm = false;
      fetchAndDisplayLeaderboard();
      leaderboardDisplay.style.display = "block";
      showingLeaderboard = true;
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("Failed to submit score. Please try again.");
    }
  });

  // Skip submission button
  skipButton.addEventListener("click", () => {
    leaderboardForm.style.display = "none";
    showingLeaderboardForm = false;
    gameState = "title";
    score = 0;
    booster = new Booster();
    arms.reset();
  });

  // View leaderboard button
  viewLeaderboardButton.addEventListener("click", () => {
    leaderboardForm.style.display = "none";
    showingLeaderboardForm = false;
    fetchAndDisplayLeaderboard();
    leaderboardDisplay.style.display = "block";
    showingLeaderboard = true;
  });

  // Close leaderboard button
  closeLeaderboardButton.addEventListener("click", () => {
    leaderboardDisplay.style.display = "none";
    showingLeaderboard = false;
    gameState = "title";
    score = 0;
    booster = new Booster();
    arms.reset();
  });

  // Return to game button
  returnToGameButton.addEventListener("click", () => {
    leaderboardDisplay.style.display = "none";
    showingLeaderboard = false;
    gameState = "title";
    score = 0;
    booster = new Booster();
    arms.reset();
  });
}

// Submit score to Supabase
async function submitScore(email, name, playerScore) {
  try {
    console.log("Submitting score:", email, name, playerScore);

    const { data, error } = await supabase.from("leaderboard").insert([
      {
        player_email: email,
        player_name: name,
        score: playerScore,
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("Score submitted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error submitting score:", error);
    throw error;
  }
}

// Fetch leaderboard data from Supabase
async function fetchAndDisplayLeaderboard() {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(20);

    if (error) throw error;

    // Display the leaderboard data
    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML = "";

    if (data.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="4">No scores yet. Be the first!</td>';
      leaderboardBody.appendChild(row);
    } else {
      data.forEach((entry, index) => {
        const row = document.createElement("tr");
        const date = new Date(entry.created_at).toLocaleDateString();

        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.player_name || "Anonymous"}</td>
          <td>${entry.score}</td>
          <td>${date}</td>
        `;

        leaderboardBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML =
      '<tr><td colspan="4">Failed to load leaderboard. Please try again later.</td></tr>';
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
  let canvasElement = document.querySelector("canvas");
  canvasElement.addEventListener("touchstart", handleTouchStart, false);
  canvasElement.addEventListener("touchend", handleTouchEnd, false);
  canvasElement.addEventListener("touchmove", handleTouchMove, false);
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
    if (
      x >= startButton.x &&
      x <= startButton.x + startButton.width &&
      y >= startButton.y &&
      y <= startButton.y + startButton.height
    ) {
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
  if (showingLeaderboard || showingLeaderboardForm) {
    // Don't draw game elements when showing leaderboard
    return;
  }

  drawBackground();
  drawPole();
  if (gameState === "title") {
    drawTitle();
  } else if (gameState === "play") {
    playGame();
  } else if (gameState === "gameOver") {
    drawGameOver();

    // Show leaderboard form after a short delay
    if (!showingLeaderboardForm) {
      setTimeout(() => {
        document.getElementById("finalScore").textContent = score;
        document.getElementById("leaderboardForm").style.display = "block";
        showingLeaderboardForm = true;
      }, 1000);
    }
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

/** Draws the vertical pole in the center of the screen */
function drawPole() {
  // Calculate pole dimensions
  const poleWidth = 20; // Fixed width for better aesthetics
  const poleHeight = height * 0.7;
  const poleLeftX = width / 2 - poleWidth / 2;
  const poleRightX = poleLeftX + poleWidth;

  // Draw pole with gradient for 3D effect
  push();
  noStroke();

  // Main pole - coming from the bottom
  fill(150);
  rect(poleLeftX, height - poleHeight, poleWidth, poleHeight);

  // Highlight on left edge
  fill(200);
  rect(poleLeftX, height - poleHeight, 3, poleHeight);

  // Shadow on right edge
  fill(100);
  rect(poleRightX - 3, height - poleHeight, 3, poleHeight);

  // Add some details/rungs to the pole
  fill(100);
  for (let y = height - poleHeight + 50; y < height; y += 50) {
    rect(poleLeftX - 5, y, poleWidth + 10, 5);
  }

  // Base structure
  fill(120);
  noStroke();
  rect(poleLeftX - 15, height - 20, poleWidth + 30, 20);
  pop();
}

/** Displays the title screen with instructions */
function drawTitle() {
  // Create a semi-transparent overlay for better text readability
  fill(10, 10, 40, 200);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  // Responsive text sizes
  let titleSize = min(48, width / 16);
  let instructionSize = min(22, width / 36);
  let smallTextSize = min(18, width / 42);

  // Draw title with shadow for better visibility
  push();
  fill(30, 144, 255);
  textSize(titleSize);
  textStyle(BOLD);
  text("Falcon Landing Simulator", width / 2, height / 3);
  pop();

  // Draw instruction panel with background - make it wider
  fill(0, 0, 30, 200);
  rect(width / 2 - 300, height / 2 - 70, 600, 140, 10);

  fill(255);
  textSize(instructionSize);
  if (isMobile) {
    text("Touch left/right side to move", width / 2, height / 2 - 40);
    text("Touch the pole to catch at the right moment", width / 2, height / 2);
    text(
      "Land in the green zone when arms are closed",
      width / 2,
      height / 2 + 40
    );
  } else {
    text("Use LEFT/RIGHT arrows to move", width / 2, height / 2 - 40);
    text("Press SPACE to catch at the right moment", width / 2, height / 2);
    text(
      "Align the red dot with the horizontal arms",
      width / 2,
      height / 2 + 40
    );
  }

  // Draw start button
  fill(30, 144, 255);
  rect(startButton.x, startButton.y, startButton.width, startButton.height, 10);

  fill(255);
  textSize(min(32, width / 24));
  text("START", width / 2, startButton.y + startButton.height / 2);

  // Draw leaderboard button
  let leaderboardButtonY = startButton.y + startButton.height + 20;
  fill(0, 128, 0); // Green color for leaderboard button
  rect(
    width / 2 - startButton.width / 2,
    leaderboardButtonY,
    startButton.width,
    40,
    10
  );

  fill(255);
  textSize(smallTextSize);
  text("View Leaderboard", width / 2, leaderboardButtonY + 20);

  // Fix button click handling - use mousePressed instead of mouseIsPressed
  if (mouseIsPressed) {
    // Start button
    if (
      mouseX >= startButton.x &&
      mouseX <= startButton.x + startButton.width &&
      mouseY >= startButton.y &&
      mouseY <= startButton.y + startButton.height
    ) {
      gameState = "play";
    }

    // Leaderboard button
    if (
      mouseX >= width / 2 - startButton.width / 2 &&
      mouseX <= width / 2 + startButton.width / 2 &&
      mouseY >= leaderboardButtonY &&
      mouseY <= leaderboardButtonY + 40
    ) {
      fetchAndDisplayLeaderboard();
      document.getElementById("leaderboardDisplay").style.display = "block";
      showingLeaderboard = true;
    }
  }

  // Handle keyboard input for desktop - allow arrow keys to start game
  if (!isMobile && keyIsPressed) {
    if (
      keyCode === ENTER ||
      keyCode === 32 ||
      keyCode === LEFT_ARROW ||
      keyCode === RIGHT_ARROW
    ) {
      gameState = "play";
    }
  }
}

/** Main gameplay loop */
function playGame() {
  // Reset space pressed state when game starts
  if (frameCount === 1 || frameCount % 60 === 0) {
    spacePressedThisRound = false;
  }

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

  if (
    (!isMobile && (!keyIsPressed || keyCode !== 32)) ||
    (isMobile && !touchCatch)
  ) {
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

  textSize(titleSize);
  text("GAME OVER", width / 2, height / 3);

  textSize(scoreSize);
  text("Score: " + score, width / 2, height / 2 - 20);
  text("High Score: " + highScore, width / 2, height / 2 + 20);

  // We don't show the "press any key to restart" text anymore
  // since we're showing the leaderboard form instead
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
    let openWidth = 75; // Reduced width by half for better aesthetics

    this.leftX = centerX - openWidth; // Start position for left side
    this.rightX = centerX + openWidth; // Start position for right side
    this.targetLeftX = this.leftX;
    this.targetRightX = this.rightX;

    // Closed position is near the pole
    this.closedLeftX = centerX - 20;
    this.closedRightX = centerX + 20;
  }

  display() {
    push();
    strokeWeight(2);

    // Animate arm movement
    if (this.isOpen) {
      this.targetLeftX = width / 2 - 75; // Open position with fixed width (half the previous width)
      this.targetRightX = width / 2 + 75; // Open position with fixed width (half the previous width)
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
    this.width = 40; // Fixed width for better aesthetics
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
    // Make booster size relative to screen size but maintain aesthetics
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

    // Movement speed based on screen width
    let moveSpeed = 5;
    if (width > 800) {
      moveSpeed = 5;
    } else {
      moveSpeed = width * 0.006;
    }

    if (!isMobile) {
      // Desktop controls
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
        // Left arrow or A key
        this.x -= moveSpeed;
      } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
        // Right arrow or D key
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

// Add a mousePressed function to handle button clicks more reliably
function mousePressed() {
  if (gameState === "title") {
    // Start button
    if (
      mouseX >= startButton.x &&
      mouseX <= startButton.x + startButton.width &&
      mouseY >= startButton.y &&
      mouseY <= startButton.y + startButton.height
    ) {
      gameState = "play";
    }

    // Leaderboard button
    let leaderboardButtonY = startButton.y + startButton.height + 20;
    if (
      mouseX >= width / 2 - startButton.width / 2 &&
      mouseX <= width / 2 + startButton.width / 2 &&
      mouseY >= leaderboardButtonY &&
      mouseY <= leaderboardButtonY + 40
    ) {
      fetchAndDisplayLeaderboard();
      document.getElementById("leaderboardDisplay").style.display = "block";
      showingLeaderboard = true;
    }
  }
}
