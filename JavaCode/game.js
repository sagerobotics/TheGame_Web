// --- Basic setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const coinSound = document.getElementById('coinSound');
let gameMessage = "";


// Audio unlock
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (coinSound) {
        coinSound.muted = true;
        coinSound.play().then(() => {
            coinSound.pause(); coinSound.currentTime = 0; coinSound.muted = false;
        }).catch(() => { coinSound.muted = false; });
    }
}
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('pointerdown', unlockAudio, { once: true });

// --- Controls state ---
const keys = {};
document.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === 'KeyR') resetGame();
});
document.addEventListener("keyup", e => keys[e.code] = false);

// --- DPad logic ---
const dpad = document.getElementById("dpad");
dpad.querySelectorAll(".btn").forEach(btn => {
    const key = btn.dataset.key;
    const press = () => { keys[key] = true; };
    const release = () => { keys[key] = false; };

    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);

    btn.addEventListener("touchstart", e => { e.preventDefault(); press(); }, { passive: false });
    btn.addEventListener("touchend", e => { e.preventDefault(); release(); }, { passive: false });
    btn.addEventListener("touchcancel", release);
});

// --- Game constants & objects ---
const gravity = 0.6;
const friction = 0.86;
const maxSpeed = 6;
const player = { x: 50, y: -300, width: 100, height: 120, vx: 0, vy: 0, onGround: false, alive: true, score: 0 };
const playerImage = new Image();
playerImage.src = window.selectedCharacter || "/Assets/Images/Newgirl2.png"; // fallback default
player.image = playerImage;


const platforms = [
    { x: 0, y: 320, w: 2000, h: 40 },   // ground
    { x: 200, y: 260, w: 80, h: 20 },   // floating platform1
    { x: 400, y: 200, w: 80, h: 20 },   // floating platform2
    { x: 600, y: 180, w: 80, h: 20 },   // floating platform3
    { x: 900, y: 260, w: 120, h: 20 },  // floating platform4
    { x: 1150, y: 170, w: 80, h: 20 },  // floating platform5
    { x: 1300, y: 160, w: 80, h: 20 },  // floating platform6   
    { x: 1500, y: 160, w: 80, h: 20 },  // floating platform7
    { x: 1700, y: 170, w: 100, h: 20 }, // floating platform8   
];

// Pole (positive height)
const pole = {
    x: 1900,
    y: 120,     // top of the pole
    w: 10,
    h: 200,     // height extends downward
    color: "gray"
};

// Flag
const flag = {
    x: pole.x + pole.w,
    y: pole.y + 40,   // a bit below top of pole
    w: 80,
    h: 40,
    color: "red"
};

let cameraX = 0;
const girlImg = new Image();
girlImg.src = "/Assets/Images/Newgirl2.png";

girlImg.onload = () => {
    console.log("Sprite sheet loaded", girlImg.width, girlImg.height);
};

// --- Animation state for the player ---
let frameX = 0;
let frameY = 0;
let frameCount = 4;
let frameWidth = 100;
let frameHeight = 120;
let frameTimer = 0;
let frameInterval = 8;

const badguyImg = new Image();
badguyImg.src = "/Assets/Images/frog.png";

const signImg = new Image();
signImg.src = "/Assets/Images/crossroads.png";
signImg.onload = () => {
  console.log("Sign image loaded ✅");
    
  
  
};



const coins = [
    { x: 220, y: 220, collected: false },
    { x: 420, y: 160, collected: false },
    { x: 620, y: 110, collected: false },
    { x: 960, y: 200, collected: false },
    { x: 960, y: 200, collected: false },
    { x: 1170, y: 130, collected: false },
    { x: 1320, y: 120, collected: false },
    { x: 1520, y: 120, collected: false },
    { x: 1720, y: 130, collected: false },
];

const enemies = [
    { x: 300, y: 288, w: 32, h: 32, dir: 1, speed: 1.4, min: 280, max: 340 },
    { x: 500, y: 288, w: 32, h: 32, dir: -1, speed: 1.2, min: 460, max: 540 },
    { x: 700, y: 288, w: 32, h: 32, dir: 1, speed: 1.4, min: 680, max: 740 },
    { x: 1000, y: 228, w: 32, h: 32, dir: -1, speed: 1.6, min: 960, max: 1120 },
    { x: 1200, y: 138, w: 32, h: 32, dir: 1, speed: 1.4, min: 1150, max: 1250 },
    { x: 1400, y: 128, w: 32, h: 32, dir: -1, speed: 1.2, min: 1350, max: 1450 },
    { x: 1600, y: 138, w: 32, h: 32, dir: 1, speed: 1.4, min: 1550, max: 1650 },
    { x: 1800, y: 150, w: 32, h: 32, dir: -1, speed: 1.6, min: 1750, max: 1850 },   
];

//signImg = [{ x: 750, y: 280, w: 64, h: 64 }];

// Beam state
let beaming = false;
let beamTimer = 0;

// --- Game functions ---

function resetGame() {
    player.x = 50; player.y = 0; player.vx = 0; player.vy = 0;
    player.alive = true; player.score = 0;
    beaming = false; beamTimer = 0;
    for (let c of coins) c.collected = false;
    for (let e of enemies) { e.x = e.min; e.dead = false; }
}

function update() {
    if (!player.alive) {
        player.vy += gravity;
        player.y += player.vy;
        return;
    }

    if (keys["ArrowRight"]) player.vx += 0.5;
    if (keys["ArrowLeft"]) player.vx -= 0.5;
    if ((keys["ArrowUp"] || keys["Space"]) && player.onGround) {
        player.vy = -11; player.onGround = false;
    }

    player.vx *= friction;
    if (player.vx > maxSpeed) player.vx = maxSpeed;
    if (player.vx < -maxSpeed) player.vx = -maxSpeed;

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // --- Animation update ---
    if (Math.abs(player.vx) > 0.5) {
        frameTimer++;
        if (frameTimer >= frameInterval) {
            frameTimer = 0;
            frameX = (frameX + 1) % frameCount;
        }
        if (player.vx > 0) frameY = 1;
        else frameY = 2;
    } else {
        frameX = 0;
        frameY = 0;
    }
// --- Action Button (Spacebar Equivalent) ---
const actionBtn = document.getElementById("actionBtn");
if (actionBtn) {
  const press = () => { keys["Space"] = true; };
  const release = () => { keys["Space"] = false; };

  actionBtn.addEventListener("mousedown", press);
  actionBtn.addEventListener("mouseup", release);
  actionBtn.addEventListener("mouseleave", release);

  actionBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    press();
  }, { passive: false });
  
  actionBtn.addEventListener("touchend", e => {
    e.preventDefault();
    release();
  }, { passive: false });
  
  actionBtn.addEventListener("touchcancel", release);
}

    // Platform collision
    player.onGround = false;
    for (let p of platforms) {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            const prevBottom = player.y + player.height - player.vy;
            if (player.vy >= 0 && prevBottom <= p.y + 1) {
                player.y = p.y - player.height; // land on top
                player.vy = 0; // stop falling
                player.onGround = true;
            } else {
                if (player.x + player.width / 2 < p.x + p.w / 2) {
                    player.x = p.x - player.width - 0.1; player.vx = 0;
                } else {
                    player.x = p.x + p.w + 0.1; player.vx = 0;
                }
            }
        }
    }

    // Collect coins
    for (let c of coins) {
        if (!c.collected &&
            player.x < c.x + 18 &&
            player.x + player.width > c.x &&
            player.y < c.y + 18 &&
            player.y + player.height > c.y) {
            c.collected = true;
            player.score += 10;
            try { coinSound.currentTime = 0; coinSound.play(); } catch (e) { }
        }
    }

    // Enemy update
    for (let e of enemies) {
        if (e.dead) continue;
        e.x += e.dir * e.speed;
        if (e.x < e.min) { e.x = e.min; e.dir = 1; }
        if (e.x > e.max) { e.x = e.max; e.dir = -1; }

        if (player.x < e.x + e.w && player.x + player.width > e.x &&
            player.y < e.y + e.h && player.y + player.height > e.y) {
            if (player.vy > 0 && (player.y + player.height - player.vy) <= e.y + 6) {
                e.dead = true; player.vy = -8; player.score += 20;
            } else {
                player.alive = false;
            }
        }
    }

    if (player.y > canvas.height + 200 && player.alive) {
        player.alive = false;
    }

    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

    // Pole collision triggers beam
    if (!beaming && checkPoleCollision(player, pole)) {
        beaming = true;
        beamTimer = 0;
    }

    

    if (beaming) {
    beamTimer++;
    if (beamTimer > 40) {
        beaming = false;
        player.alive = false;
        gameMessage = "You Win!";
        console.log("Player beamed away!");

        // 🚀 Trigger next level
        if (typeof window.nextLevel === "function") {
            window.nextLevel();
        } else {
            console.warn("nextLevel() is not defined yet.");
        }
    }
}





}

function draw() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, canvas.height);

   

    // Pole
    ctx.fillStyle = pole.color;
    ctx.fillRect(pole.x - cameraX, pole.y, pole.w, pole.h);

    // Flag
    ctx.fillStyle = flag.color;
    ctx.fillRect(flag.x - cameraX, flag.y, flag.w, flag.h);

    // Clouds
    for (let i = 0; i < 5; i++) {
        const cloudX = (i * 200 - cameraX * 0.3) % (canvas.width + 100);
        const cloudY = 50 + (i % 2) * 30;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 20, cloudY + 5, 25, 0, Math.PI * 2);
        ctx.arc(cloudX - 20, cloudY + 5, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hills
    for (let i = 0; i < 4; i++) {
        const hillX = (i * 300 - cameraX * 0.5) % (canvas.width + 300);
        const hillY = 320;
        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.arc(hillX - 60, hillY, 80, Math.PI, 2 * Math.PI);
        ctx.arc(hillX, hillY, 100, Math.PI, 2 * Math.PI);
        ctx.arc(hillX + 60, hillY, 80, Math.PI, 2 * Math.PI);
        ctx.fill();
    }

     // Platforms
    ctx.fillStyle = "#654321";
    for (let p of platforms) ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);

    // Coins
    ctx.fillStyle = "gold";
    for (let c of coins) {
        if (!c.collected) {
            ctx.beginPath(); ctx.arc(c.x - cameraX + 9, c.y + 9, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.beginPath(); ctx.arc(c.x - cameraX + 5, c.y + 5, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "gold";
        }
    }


     

   // Enemies
    for (let e of enemies) {
        if (e.dead) continue;
        if (badguyImg.complete && badguyImg.naturalWidth !== 0) {
            ctx.drawImage(badguyImg, e.x - cameraX, e.y, e.w, e.h);
        } else {
            ctx.fillStyle = "#c62828"; ctx.fillRect(e.x - cameraX, e.y, e.w, e.h);
        }
    }

    // Player or Beam
    if (player.alive && !beaming) {
        if (girlImg.complete && girlImg.naturalWidth !== 0) {
            ctx.drawImage(girlImg, player.x - cameraX, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = "#000";
            ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
        }
    } else if (beaming) {
        drawBeamEffect(player);

    } else {
        ctx.globalAlpha = 0.6;
        if (girlImg.complete && girlImg.naturalWidth !== 0) {
            ctx.drawImage(girlImg, player.x - cameraX, player.y, player.width, player.height);
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = "black";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px sans-serif";
        ctx.fillText("Press R to refresh", canvas.width / 2, canvas.height / 2 + 20);
    }

     // Sign
    ctx.drawImage(signImg, 785 - cameraX, 235, 100, 80);

    // Score
    ctx.textAlign = "left";
    ctx.fillStyle = "black"; ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + player.score, 16, 26);
}

function checkPoleCollision(player, pole) {
    return (
        player.x + player.width > pole.x &&
        player.x < pole.x + pole.w &&
        player.y + player.height > pole.y &&
        player.y < pole.y + pole.h
    );

// main.js
window.nextLevel = function() {
  console.log("Loading next level...");

  // Example: load another JS file dynamically (e.g., gamelevel2.js)
  const script = document.createElement("script");
  script.src = "gamelevel2.js";
  script.onload = () => console.log("Next level loaded!");
  document.body.appendChild(script);
};


}

function drawBeamEffect(player) {
    const centerX = player.x + player.width / 2 - cameraX;
    const centerY = player.y + player.height / 2;
    const beamHeight = Math.max(0, player.height - beamTimer * 2);

    // Beam glow
    ctx.fillStyle = "rgba(0, 200, 255, 0.6)";
    ctx.fillRect(centerX - 20, player.y - beamTimer, 40, player.height + beamTimer * 2);

    // Shrinking player
    ctx.fillStyle = "yellow";
    ctx.fillRect(centerX - (player.width / 2) + beamTimer, centerY - beamHeight / 2, player.width - beamTimer * 2, beamHeight);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();



