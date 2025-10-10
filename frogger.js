// --- Basic Setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const tile = 50;
const rows = 12;
const cols = 12;
const playerStart = { x: 5, y: 11 };

let player = { ...playerStart };
let cars = [];
let gameOver = false;
let win = false;

// --- Helper ---
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// --- Car Logic ---
function createCars() {
  cars = [];
  for (let i = 2; i < 10; i++) {
    const isRight = i % 2 === 0;
    cars.push({
      x: Math.random() * (canvas.width + 300) - 150,
      y: i * tile + 10,
      width: 60,
      height: 30,
      speed: 1.5 + Math.random() * 2.5,
      dir: isRight ? 1 : -1
    });
  }
}

// --- Collision Detection ---
function checkCollision(a, b) {
  const ax = a.x * tile + tile * 0.15;
  const ay = a.y * tile + tile * 0.15;
  const aw = tile * 0.7;
  const ah = tile * 0.7;

  return (
    ax < b.x + b.width &&
    ax + aw > b.x &&
    ay < b.y + b.height &&
    ay + ah > b.y
  );
}

// --- Drawing ---
function drawBackground() {
  ctx.fillStyle = '#00008B';
  ctx.fillRect(0, 0, canvas.width, tile);
}

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

// --- Update ---
function updateCars() {
  for (let car of cars) {
    car.x += car.speed * car.dir;
    if (car.dir === 1 && car.x > canvas.width + 100) car.x = -car.width - 100;
    if (car.dir === -1 && car.x < -car.width - 100) car.x = canvas.width + 100;
    if (checkCollision(player, car)) gameOver = true;
  }
}

// --- Movement ---
function movePlayer(key) {
  if (gameOver) return;

  if (key === 'ArrowUp') player.y = clamp(player.y - 1, 0, rows - 1);
  if (key === 'ArrowDown') player.y = clamp(player.y + 1, 0, rows - 1);
  if (key === 'ArrowLeft') player.x = clamp(player.x - 1, 0, cols - 1);
  if (key === 'ArrowRight') player.x = clamp(player.x + 1, 0, cols - 1);

  for (let car of cars) {
    if (checkCollision(player, car)) gameOver = true;
  }

  if (player.y === 0) {
    win = true;
    gameOver = true;
  }
}

// --- Controls ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') restartGame();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    movePlayer(e.key);
  }
});

const dpad = document.getElementById('dpad');
if (dpad) {
  dpad.querySelectorAll('.btn').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      movePlayer(key);
    });
    btn.addEventListener('touchstart', (ev) => {
      ev.preventDefault();
      movePlayer(key);
    }, { passive: false });
  });
}

// --- Game Loop ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawCars();
  drawPlayer();
  updateCars();

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '40px Arial';
    if (win) {
      ctx.fillText('🎉 You Win! 🎉', canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillText('💀 Game Over 💀', canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
    return;
  }

  requestAnimationFrame(gameLoop);
}

// --- Restart ---
function restartGame() {
  player = { ...playerStart };
  gameOver = false;
  win = false;
  createCars();
  requestAnimationFrame(gameLoop);
}

// --- Start ---
createCars();
requestAnimationFrame(gameLoop);
