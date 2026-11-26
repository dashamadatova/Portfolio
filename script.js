// Image paths (all files live in the "images" folder)
const ART = {
  puppy: ["images/puppy.png", "images/puppy.png", "images/puppy.png", "images/puppy.png"],
  stool: "images/stool.png",
  room: "images/living_room.jpg",
};

// Fill the website pictures that use data-art="..."
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-art]").forEach((img) => {
    const key = img.dataset.art;
    img.src = key === "p0" ? ART.puppy[0] : ART[key];
  });
});

// ============================================================
// PUPPY ROOM RUNNER
// ============================================================

// ------------------------------------------------------------
// CANVAS
// ------------------------------------------------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ------------------------------------------------------------
// GAME ASSETS
// ------------------------------------------------------------

// Puppy animation frames
const puppyFrames = [new Image(), new Image(), new Image(), new Image()];

puppyFrames[0].src = ART.puppy[0];
puppyFrames[1].src = ART.puppy[1];
puppyFrames[2].src = ART.puppy[2];
puppyFrames[3].src = ART.puppy[3];

// Living room background
const backgroundImage = new Image();
backgroundImage.src = ART.room;

// Stool obstacle
const stoolImage = new Image();
stoolImage.src = ART.stool;

// Main title art
const titleArt = new Image();
titleArt.src = "game_title_art.png";

// Game over sign artwork
const gameOverSignArt = new Image();
gameOverSignArt.src = "game_over_sign_art.png";
// ------------------------------------------------------------
// NEW INTRO ART
// Contains:
// START-CLICK-SPACE
// JUMP OVER THE STOOL!
// ------------------------------------------------------------

const subscriptArt = new Image();
subscriptArt.src = "game_subscript_art.png";

// ------------------------------------------------------------
// BACKGROUND MUSIC
// ------------------------------------------------------------

const backgroundMusic = new Audio("arcade_game_music_classic.mp3");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.35;

// ------------------------------------------------------------
// GAME SETTINGS
// ------------------------------------------------------------

const GROUND_Y = 505;

const gravity = 1900;
const jumpPower = -965;

const worldSpeedStart = 250;
const worldSpeedIncrease = 7;

const animationSpeed = 10;

// ------------------------------------------------------------
// PUPPY
// ------------------------------------------------------------

const puppy = {
  x: 150,
  y: GROUND_Y - 115,

  width: 130,
  height: 115,

  velocityY: 0,

  onGround: true,
};

// ------------------------------------------------------------
// OBSTACLES
// ------------------------------------------------------------

const obstacles = [];

const stoolWidth = 95;
const stoolHeight = 105;

let obstacleTimer = 0;

const obstacleMinDelay = 1.3;
const obstacleMaxDelay = 2.7;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------

let gameStarted = false;
let gameOver = false;

// Short delay before a restart is allowed, so a held or
// mashed key doesn't skip the game-over screen instantly.
const RESTART_DELAY_MS = 600;
let gameOverAt = 0;

let score = 0;
let bestScore = Number(localStorage.getItem("puppyRoomRunnerBest") || 0);

let worldSpeed = worldSpeedStart;

// ------------------------------------------------------------
// ANIMATION STATE
// ------------------------------------------------------------

let currentFrame = 0;
let animationTimer = 0;

// ------------------------------------------------------------
// BACKGROUND PARALLAX
// ------------------------------------------------------------

let backgroundOffset = 0;

// ------------------------------------------------------------
// TIMING
// ------------------------------------------------------------

let lastTime = 0;

// ------------------------------------------------------------
// HTML HUD
// ------------------------------------------------------------

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");

bestElement.textContent = bestScore;

// ------------------------------------------------------------
// RANDOM NUMBER HELPER
// ------------------------------------------------------------

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// ------------------------------------------------------------
// RESET GAME
// ------------------------------------------------------------

function resetGame() {
  puppy.y = GROUND_Y - puppy.height;

  puppy.velocityY = 0;

  puppy.onGround = true;

  obstacles.length = 0;

  obstacleTimer = 0;

  score = 0;

  worldSpeed = worldSpeedStart;

  backgroundOffset = 0;

  currentFrame = 0;

  animationTimer = 0;

  gameOver = false;

  scoreElement.textContent = "0";
}

// ------------------------------------------------------------
// START GAME
// ------------------------------------------------------------

function startGame() {
  resetGame();

  gameStarted = true;

  backgroundMusic.currentTime = 0;

  backgroundMusic.play().catch(() => {
    // Browser may block autoplay.
    // Music will start after another user interaction.
  });
}

// ------------------------------------------------------------
// END GAME
// ------------------------------------------------------------

function endGame() {
  gameOver = true;

  gameOverAt = performance.now();

  gameStarted = false;

  backgroundMusic.pause();

  const finalScore = Math.floor(score);

  if (finalScore > bestScore) {
    bestScore = finalScore;

    localStorage.setItem("puppyRoomRunnerBest", bestScore);

    bestElement.textContent = bestScore;
  }
}

// ------------------------------------------------------------
// JUMP
// ------------------------------------------------------------

function jump() {
  // Start the game from the intro screen
  if (!gameStarted && !gameOver) {
    startGame();

    return;
  }

  // Restart after game over (after a short cooldown)
  if (gameOver) {
    if (performance.now() - gameOverAt >= RESTART_DELAY_MS) {
      startGame();
    }

    return;
  }

  // Normal jump
  if (puppy.onGround) {
    puppy.velocityY = jumpPower;

    puppy.onGround = false;
  }
}

// ------------------------------------------------------------
// KEYBOARD CONTROLS
// ------------------------------------------------------------

window.addEventListener("keydown", function (event) {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp" ||
    event.code === "KeyW"
  ) {
    event.preventDefault();

    // Holding a key fires repeated keydown events.
    // Ignore them so the puppy doesn't bunny-hop or
    // instantly restart after dying.
    if (event.repeat) {
      return;
    }

    jump();
  }
});

// ------------------------------------------------------------
// MOUSE / TOUCH CONTROLS
// ------------------------------------------------------------

canvas.addEventListener("pointerdown", function (event) {
  // Ignore right/middle mouse buttons
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  jump();
});

// Pause the music when the tab is hidden (the game loop
// already stops because requestAnimationFrame is paused).
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    backgroundMusic.pause();
  } else if (gameStarted && !gameOver) {
    backgroundMusic.play().catch(() => {});
  }
});

// ------------------------------------------------------------
// SPAWN OBSTACLE
// ------------------------------------------------------------

function spawnObstacle() {
  obstacles.push({
    x: WIDTH + 50,

    y: GROUND_Y - stoolHeight,

    width: stoolWidth,

    height: stoolHeight,
  });
}

// ------------------------------------------------------------
// UPDATE OBSTACLES
// ------------------------------------------------------------

function updateObstacles(deltaTime) {
  obstacleTimer -= deltaTime;

  if (obstacleTimer <= 0) {
    spawnObstacle();

    obstacleTimer = randomRange(obstacleMinDelay, obstacleMaxDelay);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];

    obstacle.x -= worldSpeed * deltaTime;

    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// UPDATE PUPPY
// ------------------------------------------------------------

function updatePuppy(deltaTime) {
  puppy.velocityY += gravity * deltaTime;

  puppy.y += puppy.velocityY * deltaTime;

  if (puppy.y >= GROUND_Y - puppy.height) {
    puppy.y = GROUND_Y - puppy.height;

    puppy.velocityY = 0;

    puppy.onGround = true;
  }
}

// ------------------------------------------------------------
// UPDATE ANIMATION
// ------------------------------------------------------------

function updateAnimation(deltaTime) {
  if (!puppy.onGround) {
    currentFrame = 0;

    return;
  }

  animationTimer += deltaTime;

  if (animationTimer >= 1 / animationSpeed) {
    animationTimer = 0;

    currentFrame++;

    if (currentFrame >= puppyFrames.length) {
      currentFrame = 0;
    }
  }
}

// ------------------------------------------------------------
// UPDATE BACKGROUND
// ------------------------------------------------------------

function updateBackground(deltaTime) {
  backgroundOffset -= worldSpeed * 0.15 * deltaTime;

  if (Math.abs(backgroundOffset) >= WIDTH) {
    backgroundOffset = 0;
  }
}

// ------------------------------------------------------------
// UPDATE SCORE
// ------------------------------------------------------------

function updateScore(deltaTime) {
  score += deltaTime * 10;

  scoreElement.textContent = Math.floor(score);
}

// ------------------------------------------------------------
// UPDATE GAME
// ------------------------------------------------------------

function update(deltaTime) {
  if (!gameStarted || gameOver) {
    return;
  }

  worldSpeed += worldSpeedIncrease * deltaTime;

  updatePuppy(deltaTime);

  updateAnimation(deltaTime);

  updateObstacles(deltaTime);

  updateBackground(deltaTime);

  updateScore(deltaTime);

  checkCollisions();
}

// ------------------------------------------------------------
// COLLISION DETECTION
// ------------------------------------------------------------

function checkCollisions() {
  // Slightly shrink the collision boxes
  // so the game feels more forgiving.

  const puppyPaddingX = 25;
  const puppyPaddingY = 12;

  const puppyLeft = puppy.x + puppyPaddingX;

  const puppyRight = puppy.x + puppy.width - puppyPaddingX;

  const puppyTop = puppy.y + puppyPaddingY;

  const puppyBottom = puppy.y + puppy.height - puppyPaddingY;

  for (const obstacle of obstacles) {
    const obstacleLeft = obstacle.x + 10;

    const obstacleRight = obstacle.x + obstacle.width - 10;

    const obstacleTop = obstacle.y + 8;

    const obstacleBottom = obstacle.y + obstacle.height;

    const collision =
      puppyRight > obstacleLeft &&
      puppyLeft < obstacleRight &&
      puppyBottom > obstacleTop &&
      puppyTop < obstacleBottom;

    if (collision) {
      endGame();

      return;
    }
  }
}

// ------------------------------------------------------------
// DRAW BACKGROUND
// ------------------------------------------------------------

function drawBackground() {
  if (backgroundImage.complete && backgroundImage.naturalWidth) {
    const imageWidth = WIDTH;
    const imageHeight = HEIGHT;

    ctx.drawImage(
      backgroundImage,
      backgroundOffset,
      0,
      imageWidth,
      imageHeight,
    );

    ctx.drawImage(
      backgroundImage,
      backgroundOffset + imageWidth,
      0,
      imageWidth,
      imageHeight,
    );

    // Extra copy for seamless scrolling
    ctx.drawImage(
      backgroundImage,
      backgroundOffset - imageWidth,
      0,
      imageWidth,
      imageHeight,
    );
  } else {
    // Fallback background
    ctx.fillStyle = "#e8dfcf";

    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

// ------------------------------------------------------------
// DRAW PUPPY
// ------------------------------------------------------------

function drawPuppy() {
  const frame = puppyFrames[currentFrame];

  if (frame && frame.complete && frame.naturalWidth) {
    ctx.drawImage(frame, puppy.x, puppy.y, puppy.width, puppy.height);
  } else {
    // Simple fallback puppy
    ctx.fillStyle = "#b9794f";

    ctx.fillRect(puppy.x, puppy.y, puppy.width, puppy.height);
  }
}

// ------------------------------------------------------------
// DRAW OBSTACLES
// ------------------------------------------------------------

function drawObstacles() {
  for (const obstacle of obstacles) {
    if (stoolImage.complete && stoolImage.naturalWidth) {
      ctx.drawImage(
        stoolImage,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
      );
    } else {
      // Fallback stool
      ctx.fillStyle = "#8b5a3c";

      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }
}

// ------------------------------------------------------------
// ROUNDED RECTANGLE HELPER
// (ctx.roundRect isn't available in older browsers,
//  e.g. Safari before 16, which would crash the draw loop)
// ------------------------------------------------------------

function roundedRectPath(x, y, w, h, r) {
  ctx.beginPath();

  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);

    return;
  }

  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ------------------------------------------------------------
// DRAW INTRO SCREEN
// ------------------------------------------------------------

function drawStartScreen() {
  // Dark translucent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";

  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Intro panel
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";

  roundedRectPath(WIDTH / 2 - 330, HEIGHT / 2 - 190, 660, 380, 28);

  ctx.fill();

  // ----------------------------------------------------------
  // GAME TITLE ART
  // ----------------------------------------------------------

  if (titleArt.complete && titleArt.naturalWidth) {
    const maxWidth = 500;
    const maxHeight = 120;

    const imageRatio = titleArt.naturalWidth / titleArt.naturalHeight;

    let titleWidth = maxWidth;
    let titleHeight = titleWidth / imageRatio;

    if (titleHeight > maxHeight) {
      titleHeight = maxHeight;

      titleWidth = titleHeight * imageRatio;
    }

    ctx.drawImage(
      titleArt,

      WIDTH / 2 - titleWidth / 2,

      HEIGHT / 2 - 160,

      titleWidth,
      titleHeight,
    );
  } else {
    // Fallback title text

    ctx.fillStyle = "#4a3a2a";

    ctx.font = "bold 46px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText("Puppy Room Runner", WIDTH / 2, HEIGHT / 2 - 115);
  }

  // ----------------------------------------------------------
  // NEW START BUTTON + SUBTITLE ART
  // ----------------------------------------------------------

  if (subscriptArt.complete && subscriptArt.naturalWidth) {
    const maxWidth = 470;
    const maxHeight = 150;

    const imageRatio = subscriptArt.naturalWidth / subscriptArt.naturalHeight;

    let artWidth = maxWidth;

    let artHeight = artWidth / imageRatio;

    if (artHeight > maxHeight) {
      artHeight = maxHeight;

      artWidth = artHeight * imageRatio;
    }

    ctx.drawImage(
      subscriptArt,

      WIDTH / 2 - artWidth / 2,

      HEIGHT / 2 - 25,

      artWidth,

      artHeight,
    );
  } else {
    // Fallback if the image hasn't loaded yet

    ctx.fillStyle = "#4a3a2a";

    ctx.font = "bold 26px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText("START - CLICK - SPACE", WIDTH / 2, HEIGHT / 2 + 5);

    ctx.font = "bold 18px Arial";

    ctx.fillText("JUMP OVER THE STOOL!", WIDTH / 2, HEIGHT / 2 + 50);
  }
}

// ------------------------------------------------------------
// DRAW GAME OVER SCREEN
// ------------------------------------------------------------

function drawGameOverScreen() {
  // Dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";

  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const signLoaded = gameOverSignArt.complete && gameOverSignArt.naturalWidth;

  if (signLoaded) {
    // ----------------------------------------------------------
    // GAME OVER SIGN ART
    // ----------------------------------------------------------

    const maxWidth = 560;
    const maxHeight = 300;

    const imageRatio =
      gameOverSignArt.naturalWidth / gameOverSignArt.naturalHeight;

    let signWidth = maxWidth;
    let signHeight = signWidth / imageRatio;

    if (signHeight > maxHeight) {
      signHeight = maxHeight;

      signWidth = signHeight * imageRatio;
    }

    const signX = WIDTH / 2 - signWidth / 2;
    const signY = HEIGHT / 2 - signHeight / 2 - 50;

    ctx.drawImage(gameOverSignArt, signX, signY, signWidth, signHeight);

    // Score + restart hint below the sign, on a small panel
    const panelY = signY + signHeight + 12;

    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";

    roundedRectPath(WIDTH / 2 - 250, panelY, 500, 100, 18);

    ctx.fill();

    ctx.fillStyle = "#4a3a2a";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.font = "bold 26px Arial";

    ctx.fillText("Score: " + Math.floor(score), WIDTH / 2, panelY + 32);

    ctx.font = "20px Arial";

    ctx.fillText(
      "Press SPACE or click to try again",
      WIDTH / 2,
      panelY + 70,
    );

    return;
  }

  // ----------------------------------------------------------
  // FALLBACK (if the sign image is missing or still loading)
  // ----------------------------------------------------------

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";

  roundedRectPath(WIDTH / 2 - 270, HEIGHT / 2 - 145, 540, 290, 24);

  ctx.fill();

  ctx.fillStyle = "#4a3a2a";

  ctx.textAlign = "center";

  ctx.textBaseline = "middle";

  ctx.font = "bold 52px Arial";

  ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 65);

  ctx.font = "bold 26px Arial";

  ctx.fillText("Score: " + Math.floor(score), WIDTH / 2, HEIGHT / 2);

  ctx.font = "22px Arial";

  ctx.fillText("Press SPACE or click to try again", WIDTH / 2, HEIGHT / 2 + 65);
}

// ------------------------------------------------------------
// DRAW EVERYTHING
// ------------------------------------------------------------

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawBackground();

  if (gameStarted || gameOver) {
    drawObstacles();

    drawPuppy();
  }

  // Intro screen
  if (!gameStarted && !gameOver) {
    drawStartScreen();
  }

  // Game over screen
  if (gameOver) {
    drawGameOverScreen();
  }
}

// ------------------------------------------------------------
// MAIN GAME LOOP
// ------------------------------------------------------------

function gameLoop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }

  let deltaTime = (timestamp - lastTime) / 1000;

  lastTime = timestamp;

  // Prevent huge jumps in physics
  // if the browser tab is inactive.

  deltaTime = Math.min(deltaTime, 0.033);

  update(deltaTime);

  draw();

  requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------------
// IMAGE LOADING
// ------------------------------------------------------------

let loadedImages = 0;

const totalImages = puppyFrames.length + 5;

function imageLoaded() {
  loadedImages++;

  // All images have either loaded
  // or failed gracefully.
}

// Puppy frames
puppyFrames.forEach(function (image) {
  image.onload = imageLoaded;

  image.onerror = imageLoaded;
});

// Background
backgroundImage.onload = imageLoaded;
backgroundImage.onerror = imageLoaded;

// Stool
stoolImage.onload = imageLoaded;
stoolImage.onerror = imageLoaded;

// Main title
titleArt.onload = imageLoaded;
titleArt.onerror = imageLoaded;

// NEW intro button/subtitle art
subscriptArt.onload = imageLoaded;
subscriptArt.onerror = imageLoaded;

// Game over sign art
gameOverSignArt.onload = imageLoaded;
gameOverSignArt.onerror = imageLoaded;

// ------------------------------------------------------------
// START THE GAME LOOP
// ------------------------------------------------------------

// The loop runs continuously.
// The game itself remains paused until
// SPACE, W, Arrow Up, or click/tap is pressed.

requestAnimationFrame(gameLoop);
