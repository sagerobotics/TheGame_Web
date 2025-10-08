const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- Player setup ---
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 40,
  width: 40,
  height: 20,
  speed: 5,
  bullets: []
};

let score = 0;
let startTime = Date.now();
let elapsedTime = 0;
let gameOver = false;

// --- Controls ---
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// --- Bullets ---
function shoot() {
  player.bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10
  });
}

// --- Enemies ---
const enemies = [];
const rows = 4,
  cols = 8;
const enemyWidth = 40,
  enemyHeight = 20,
  padding = 10,
  offsetTop = 30,
  offsetLeft = 30;
let enemyDirection = 1; // 1 = right, -1 = left

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    enemies.push({
      x: c * (enemyWidth + padding) + offsetLeft,
      y: r * (enemyHeight + padding) + offsetTop,
      width: enemyWidth,
      height: enemyHeight,
      alive: true
    });
  }
}

// --- Game update loop ---
function update() {
  if (gameOver) return;

  // Timer
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  // Player movement
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width)
    player.x += player.speed;

  // Shooting
  if (keys["Space"]) {
    if (!keys["_shooting"]) {
      shoot();
      keys["_shooting"] = true;
    }
  } else {
    keys["_shooting"] = false;
  }

  // Move bullets
  player.bullets.forEach((b) => (b.y -= 7));
  player.bullets = player.bullets.filter((b) => b.y + b.height > 0);

  // Move enemies
  let shiftDown = false;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemyDirection * 1.5;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      shiftDown = true;
    }
  }

  if (shiftDown) {
    enemyDirection *= -1;
    for (const enemy of enemies) {
      enemy.y += 20;
    }
  }

  // Bullet collision with enemies
  for (const bullet of player.bullets) {
    for (const enemy of enemies) {
      if (
        enemy.alive &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.alive = false;
        bullet.y = -999; // remove bullet
        score += 10;
      }
    }
  }

  // Check win condition
  if (enemies.every((e) => !e.alive)) {
    gameOver = true;
  }
}

// --- Helper: Wrap text for end screen ---
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}

// --- Draw everything ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Bullets
  ctx.fillStyle = "yellow";
  player.bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));

  // Enemies
  ctx.fillStyle = "red";
  for (const enemy of enemies) {
    if (enemy.alive) ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, 25);
  ctx.fillText("Time: " + elapsedTime + "s", canvas.width - 120, 25);

  // End Game Message
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";

    const message =
      "🎉 You just finished Alyssa's Favorite Game - Thank you for supporting her dance dreams 🎉";
    drawWrappedText(
      ctx,
      message,
      canvas.width / 2 - (canvas.width - 40) / 2,
      canvas.height / 2 - 60,
      canvas.width - 40,
      32
    );

    ctx.font = "24px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Time: " + elapsedTime + "s", canvas.width / 2, canvas.height / 2 + 70);
  }
}

// --- Main Loop ---
function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

loop();
