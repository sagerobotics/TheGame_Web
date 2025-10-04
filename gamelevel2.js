const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const player = {
      x: canvas.width / 2 - 20,
      y: canvas.height - 40,
      width: 40,
      height: 20,
      speed: 5,
      bullets: []
    };

    const keys = {};
    document.addEventListener("keydown", e => keys[e.code] = true);
    document.addEventListener("keyup", e => keys[e.code] = false);

    // Bullets
    function shoot() {
      player.bullets.push({ x: player.x + player.width/2 - 2, y: player.y, width: 4, height: 10 });
    }

    // Enemies
    const enemies = [];
    const rows = 4, cols = 8;
    const enemyWidth = 40, enemyHeight = 20, padding = 10, offsetTop = 30, offsetLeft = 30;
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

    // Game loop
    function update() {
      // Player movement
      if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
      if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
      if (keys["Space"]) {
        if (!keys["_shooting"]) {
          shoot();
          keys["_shooting"] = true;
        }
      } else {
        keys["_shooting"] = false;
      }

      // Move bullets
      player.bullets.forEach(b => b.y -= 7);
      player.bullets = player.bullets.filter(b => b.y + b.height > 0);

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
          if (enemy.alive &&
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y) {
            enemy.alive = false;
            bullet.y = -999; // remove bullet
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Player
      ctx.fillStyle = "lime";
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Bullets
      ctx.fillStyle = "yellow";
      player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

      // Enemies
      ctx.fillStyle = "red";
      for (const enemy of enemies) {
        if (enemy.alive) {
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
      }
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    loop();