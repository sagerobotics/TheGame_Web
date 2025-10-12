// --- spaceinvaders.js ---
// Self-contained and auto-starts when loaded from the main menu
(() => {
  console.log("🚀 Space Invaders starting...");

  // --- Canvas setup ---
  const canvas = document.getElementById("game");
  if (!canvas) {
    console.error("Canvas with id 'game' not found.");
    return;
  }
  const ctx = canvas.getContext("2d");

  // --- Invader Image ---
const invaderImg = new Image();
invaderImg.src = "pyramid.png"; // path to your image


  // --- Game State ---
  let lastTime = 0;
  let playing = true;
  let paused = false;
  let score = 0;
  let lives = 3;
  let level = 1;

  // --- Player ---
  const player = {
    w: 44,
    h: 20,
    x: canvas.width / 2 - 22,
    y: canvas.height - 60,
    speed: 320,
    dx: 0,
    canFire: true,
    fireCooldown: 320,
  };

  const bullets = [];
  const enemyBullets = [];

  // --- Invaders ---
  let invaders = [];
  let invaderDirection = 1;
  let invaderMoveTimer = 0;
  let invaderMoveInterval = 800;
  const invaderDescendAmount = 24;
  const invaderColsBase = 10;
  const invaderRowsBase = 4;

  // --- Input State ---
  const keys = {};

  // --- Keyboard Controls ---
  document.addEventListener("keydown", (e) => {
    const code = e.code || "";
    const key = e.key || "";

    if (code) keys[code] = true;

    // Prevent arrow keys / space from scrolling
    if (["ArrowLeft", "ArrowRight", "Space"].includes(code) || key === " " || key === "Spacebar") {
      e.preventDefault();
    }

    if (code === "ArrowLeft") {
      player.dx = -player.speed;
    } else if (code === "ArrowRight") {
      player.dx = player.speed;
    } else if (code === "Space" || key === " " || key === "Spacebar") {
      playerFire();
    } else if (code === "KeyP") {
      // toggle pause (optional)
      paused = !paused;
      if (!paused) {
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
    } else if (code === "KeyR") {
      if (!playing) restartGame();
    }
  });

  document.addEventListener("keyup", (e) => {
    const code = e.code || "";
    if (code) keys[code] = false;

    // If either arrow key released, resolve dx based on remaining pressed keys
    if (code === "ArrowLeft" || code === "ArrowRight") {
      if (keys["ArrowLeft"] && !keys["ArrowRight"]) {
        player.dx = -player.speed;
      } else if (keys["ArrowRight"] && !keys["ArrowLeft"]) {
        player.dx = player.speed;
      } else {
        player.dx = 0;
      }
    }
  });

  // --- Helper for pointer-based DPad (multi-touch safe) ---
  const pointerSets = { left: new Set(), right: new Set() };

  function startDirection(dir, pointerId) {
    pointerSets[dir].add(pointerId);
    if (pointerSets.left.size > 0 && pointerSets.right.size > 0) {
      // both pressed -> neutral (or you can choose behavior)
      player.dx = 0;
    } else if (pointerSets.left.size > 0) {
      player.dx = -player.speed;
    } else if (pointerSets.right.size > 0) {
      player.dx = player.speed;
    }
  }

  function endDirection(dir, pointerId) {
    pointerSets[dir].delete(pointerId);
    if (pointerSets.left.size > 0) {
      player.dx = -player.speed;
    } else if (pointerSets.right.size > 0) {
      player.dx = player.speed;
    } else {
      player.dx = 0;
    }
  }

  // --- DPad Elements: support both ID-based and data-key based markup ---
  const leftBtn =
    document.getElementById("leftBtn") ||
    document.querySelector('.btn[data-key="ArrowLeft"]');
  const rightBtn =
    document.getElementById("rightBtn") ||
    document.querySelector('.btn[data-key="ArrowRight"]');

  // Attach robust pointer listeners (touch, mouse, stylus)
  if (leftBtn) {
    leftBtn.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        startDirection("left", e.pointerId);
        if (leftBtn.setPointerCapture) {
          try { leftBtn.setPointerCapture(e.pointerId); } catch (err) {}
        }
      },
      { passive: false }
    );
    leftBtn.addEventListener("pointerup", (e) => {
      endDirection("left", e.pointerId);
      if (leftBtn.releasePointerCapture) {
        try { leftBtn.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    });
    leftBtn.addEventListener("pointercancel", (e) => {
      endDirection("left", e.pointerId);
    });
  }

  if (rightBtn) {
    rightBtn.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        startDirection("right", e.pointerId);
        if (rightBtn.setPointerCapture) {
          try { rightBtn.setPointerCapture(e.pointerId); } catch (err) {}
        }
      },
      { passive: false }
    );
    rightBtn.addEventListener("pointerup", (e) => {
      endDirection("right", e.pointerId);
      if (rightBtn.releasePointerCapture) {
        try { rightBtn.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    });
    rightBtn.addEventListener("pointercancel", (e) => {
      endDirection("right", e.pointerId);
    });
  }

  // If your DPad markup used .btn elements with data-key, also attach generic handlers so any button works.
  // (Useful for center/up or any additional DPad controls)
  document.querySelectorAll(".btn[data-key]").forEach((el) => {
    const k = el.dataset.key;
    if (!k) return;
    if (k === "ArrowLeft") return; // already handled above
    if (k === "ArrowRight") return; // already handled above

    // If someone clicks/taps a .btn with a key, simulate keyboard behavior:
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (k === " ") {
        playerFire();
      } else if (k === "ArrowLeft") {
        startDirection("left", e.pointerId);
      } else if (k === "ArrowRight") {
        startDirection("right", e.pointerId);
      }
      // capture and release handled above where needed
    }, { passive: false });

    el.addEventListener("pointerup", (e) => {
      if (k === "ArrowLeft") endDirection("left", e.pointerId);
      if (k === "ArrowRight") endDirection("right", e.pointerId);
    });
  });

  // --- Action button handlers (support both buttonA and actionBtn) ---
  const buttonA = document.getElementById("buttonA");
  const actionBtn = document.getElementById("actionBtn");
  function fireHandler(e) {
    if (e && e.preventDefault) e.preventDefault();
    playerFire();
  }
  if (buttonA) {
    buttonA.addEventListener("touchstart", fireHandler, { passive: false });
    buttonA.addEventListener("click", fireHandler);
  }
  if (actionBtn) {
    actionBtn.addEventListener("touchstart", fireHandler, { passive: false });
    actionBtn.addEventListener("click", fireHandler);
  }

  // --- Utility ---
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // --- Invader creation ---
  function createInvadersForLevel(lv) {
    const cols = Math.max(6, invaderColsBase - Math.floor((lv - 1) / 2));
    const rows = Math.min(6, invaderRowsBase + Math.floor((lv - 1) / 2));
    invaders = [];
    const marginX = 60,
      marginY = 40,
      spacingX = 54,
      spacingY = 44;
    const startX = (canvas.width - (cols - 1) * spacingX) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.push({
          x: startX + c * spacingX,
          y: marginY + r * spacingY,
          w: 34,
          h: 22,
          alive: true,
        });
      }
    }
    invaderDirection = 1;
    invaderMoveInterval = Math.max(160, 800 - (lv - 1) * 80);
  }

  // --- Game Controls ---
  function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    player.x = canvas.width / 2 - player.w / 2;
    bullets.length = 0;
    enemyBullets.length = 0;
    createInvadersForLevel(level);
    playing = true;
    paused = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function restartGame() {
    startGame();
  }

  function playerFire() {
    if (!player.canFire) return;
    player.canFire = false;
    setTimeout(() => (player.canFire = true), player.fireCooldown);
    bullets.push({
      x: player.x + player.w / 2 - 3,
      y: player.y - 8,
      w: 6,
      h: 14,
      speed: 520,
    });
  }

  function enemyFire() {
    const alive = invaders.filter((i) => i.alive);
    if (!alive.length) return;
    if (Math.random() > Math.min(0.35, 0.02 + level * 0.02)) return;
    const shooter = alive[randInt(0, alive.length - 1)];
    enemyBullets.push({
      x: shooter.x + shooter.w / 2 - 4,
      y: shooter.y + shooter.h + 6,
      w: 8,
      h: 12,
      speed: 900 + level * 300,
    });
  }

  function rectsCollide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // --- Game Loop ---
  function loop(now) {
    if (paused || !playing) return;
    const dt = Math.min(40, now - lastTime) / 1000;
    update(dt);
    render();
    lastTime = now;
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // --- Player movement ---
    player.x += player.dx * dt;
    player.x = Math.max(8, Math.min(canvas.width - player.w - 8, player.x));

    // --- Invader movement ---
    invaderMoveTimer += dt * 1000;
    if (invaderMoveTimer >= invaderMoveInterval) {
      let hitEdge = false;
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const nextX = inv.x + invaderDirection * 12;
        if (nextX < 10 || nextX + inv.w > canvas.width - 10) {
          hitEdge = true;
          break;
        }
      }
      if (hitEdge) {
        for (const inv of invaders) if (inv.alive) inv.y += invaderDescendAmount;
        invaderDirection *= -1;
      } else {
        for (const inv of invaders)
          if (inv.alive) inv.x += invaderDirection * 12;
      }
      enemyFire();
      invaderMoveTimer = 0;
    }

    // --- Bullet updates ---
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed * dt;
      if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      enemyBullets[i].y += enemyBullets[i].speed * dt;
      if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }

    // --- Collision detection ---
    for (let i = bullets.length - 1; i >= 0; i--) {
      for (let j = invaders.length - 1; j >= 0; j--) {
        if (invaders[j].alive && rectsCollide(bullets[i], invaders[j])) {
          invaders[j].alive = false;
          bullets.splice(i, 1);
          score += 10;
          break;
        }
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (rectsCollide(enemyBullets[i], player)) {
        enemyBullets.splice(i, 1);
        lives--;
        if (lives <= 0) {
          gameOver();
          return;
        }
      }
    }

    // --- Check for victory ---
    if (invaders.every((inv) => !inv.alive)) {
      level++;
      createInvadersForLevel(level);
    }
  }

  // --- Rendering ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.w, player.h);

   // Invaders as images
for (const inv of invaders) {
  if (inv.alive) {
    ctx.drawImage(invaderImg, inv.x, inv.y, inv.w, inv.h);
  }
}

    // Bullets
    ctx.fillStyle = "yellow";
    for (const b of bullets) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "white";
    for (const eb of enemyBullets) ctx.fillRect(eb.x, eb.y, eb.w, eb.h);

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 120, 30);
    ctx.fillText(`Level: ${level}`, canvas.width / 2 - 40, 30);
  }

  // --- Game Over ---
  function gameOver() {
    playing = false;
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText(
      "Press R to Restart or Return to Menu",
      canvas.width / 2,
      canvas.height / 2 + 20
    );
  }

  // --- Start ---
  startGame();
})();