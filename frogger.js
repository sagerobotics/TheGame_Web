// --- Basic Setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const tile = 50;
const rows = 12;
const cols = 12;
const playerStart = { x: 5, y: 11 };

// --- Game State ---
let player = { ...playerStart };
let cars = [];
let gameOver = false;
let win = false;

// --- Controls ---
document.addEventListener('keydown', (e) => {
  if (gameOver) {
    if (e.key === 'r' || e.key === 'R') restartGame();
    return;
  }
  if (e.key === 'ArrowUp' && player.y > 0) player.y--;
  if (e.key === 'ArrowDown' && player.y < rows - 1) player.y++;
  if (e.key === 'ArrowLeft' && player.x > 0) player.x--;
  if (e.key === 'ArrowRight' && player.x < cols - 1) player.x++;
});

// --- Car Logic ---
function createCars() {
  cars = [];
  for (let i = 2; i < 10; i++) {
    if (i % 2 === 0) {
      cars.push({
        x: Math.random() * canvas.width,
        y: i * tile + 10,
        width: 60,
        height: 30,
        speed: 2 + Math.random() * 2,
        dir: 1
      });
    } else {
      cars.push({
        x: Math.random() * canvas.width,
        y: i * tile + 10,
        width: 60,
        height: 30,
        speed: 2 + Math.random() * 2,
        dir: -1
      });
    }
  }
}

// --- Collision Detection ---
function checkCollision(a, b) {
  return (
    a.x * tile < b.x + b.width &&
    a.x * tile + tile > b.x &&
    a.y * tile < b.y + b.height &&
    a.y * tile + tile > b.y
  );
}

// --- Drawing Functions ---
function drawPlayer() {
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.arc(player.x * tile + tile / 2, player.y * tile + tile / 2, tile / 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCars() {
  ctx.fillStyle = '#FF4500';
  for (let car of cars) {
    ctx.fillRect(car.x, car.y, car.width, car.height);
  }
}

// --- Update Logic ---
function updateCars() {
  for (let car of cars) {
    car.x += car.speed * car.dir;
    if (car.dir === 1 && car.x > canvas.width + 50) car.x = -car.width;
    if (car.dir === -1 && car.x < -car.width) car.x = canvas.width + 50;
    if (checkCollision(player, car)) {
      gameOver = true;
    }
  }
}

// --- Main Game Loop ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw goal area
  ctx.fillStyle = '#00008B';
  ctx.fillRect(0, 0, canvas.width, tile);

  drawPlayer();
  drawCars();

  updateCars();

  // Check win condition
  if (player.y === 0) {
    win = true;
    gameOver = true;
  }

  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    if (win) {
      ctx.fillText('🎉 You Win! 🎉', canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillText('💀 Game Over! 💀', canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
    return;
  }

  requestAnimationFrame(gameLoop);
}

// --- Restart Game ---
function restartGame() {
  player = { ...playerStart };
  gameOver = false;
  win = false;
  createCars();
  gameLoop();
}

// --- Start ---
createCars();
gameLoop();
