// spaceinvaders.js
document.addEventListener("DOMContentLoaded", () => {
  // --- Canvas and HUD ---
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const levelEl = document.getElementById('level');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg = document.getElementById('overlayMsg');
  const overlayBtn = document.getElementById('overlayBtn');
  const startBtn = document.getElementById('startBtn');
  const toggleSoundBtn = document.getElementById('toggleSound');

  // --- Game State ---
  let lastTime = 0;
  let playing = false;
  let paused = true;
  let score = 0;
  let lives = 3;
  let level = 1;

  let soundOn = true;
  const sfx = {shoot:new Audio(), hit:new Audio(), die:new Audio(), invaderMove:new Audio()};

  // --- Player ---
  const player = {w:44,h:20,x:canvas.width/2-22,y:canvas.height-60,speed:320,canFire:true,fireCooldown:320};
  const bullets = [];
  const enemyBullets = [];

  // --- Invaders ---
  let invaders = [];
  const invaderColsBase = 10;
  const invaderRowsBase = 4;
  let invaderSpeed = 28;
  let invaderDirection = 1;
  let invaderDescendAmount = 24;
  let invaderMoveTimer = 0;
  let invaderMoveInterval = 800;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if(['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if(e.key==='r'||e.key==='R') restartGame();
    if(e.key==='p'||e.key==='P') togglePause();
  });
  window.addEventListener('keyup', e => { keys[e.key]=false; });

  function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

  function createInvadersForLevel(lv){
    const cols=Math.max(6,invaderColsBase-Math.floor((lv-1)/2));
    const rows=Math.min(6,invaderRowsBase+Math.floor((lv-1)/2));
    invaders=[];
    const marginX=60,marginY=40,spacingX=54,spacingY=44;
    const startX=(canvas.width-(cols-1)*spacingX)/2;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        invaders.push({x:startX+c*spacingX,y:marginY+r*spacingY,w:34,h:22,row:r,col:c,alive:true,anim:0});
      }
    }
    invaderDirection=1;
    invaderMoveInterval=Math.max(160,800-(lv-1)*80);
    invaderSpeed=1;
  }

  function startGame(){
    score=0;lives=3;level=1;
    player.x=canvas.width/2-player.w/2;
    bullets.length=0;enemyBullets.length=0;
    createInvadersForLevel(level);
    playing=true;paused=false;overlay.style.display='none';
    lastTime=performance.now();requestAnimationFrame(loop);
    updateHUD();
  }

  function restartGame(){startGame();}

  function togglePause(){
    paused=!paused;
    overlay.style.display=paused?'flex':'none';
    overlayTitle.textContent=paused?'Paused':'';
    overlayMsg.textContent=paused?'Press Resume or Space to continue':'';
    overlayBtn.textContent=paused?'Resume':'Pause';
    if(!paused){lastTime=performance.now();requestAnimationFrame(loop);}
  }

  function updateHUD(){
    scoreEl.textContent=score;livesEl.textContent=lives;levelEl.textContent=level;
  }

  function playerFire(){
    if(!player.canFire)return;
    player.canFire=false;
    setTimeout(()=>player.canFire=true,player.fireCooldown);
    bullets.push({x:player.x+player.w/2-3,y:player.y-8,w:6,h:14,speed:520});
    if(soundOn && sfx.shoot.src) sfx.shoot.play();
  }

  function enemyFire(){
    const alive=invaders.filter(i=>i.alive);
    if(!alive.length)return;
    if(Math.random()>Math.min(0.35,0.02+level*0.02))return;
    const shooter=alive[randInt(0,alive.length-1)];
    enemyBullets.push({x:shooter.x+shooter.w/2-4,y:shooter.y+shooter.h+6,w:8,h:12,speed:220+level*30});
  }

  function rectsCollide(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}

  function loop(now){
    if(paused||!playing)return;
    const dt=Math.min(40,now-lastTime)/1000;
    update(dt);render();lastTime=now;requestAnimationFrame(loop);
  }

  function update(dt){
    if(keys.ArrowLeft||keys.a||keys.A)player.x-=player.speed*dt;
    if(keys.ArrowRight||keys.d||keys.D)player.x+=player.speed*dt;
    if(keys[' ']||keys.Spacebar){if(!keys._spaceLock){playerFire();keys._spaceLock=true;}}else{keys._spaceLock=false;}
    player.x=Math.max(8,Math.min(canvas.width-player.w-8,player.x));

    invaderMoveTimer+=dt*1000;
    if(invaderMoveTimer>=invaderMoveInterval){
      let hitEdge=false;
      for(const inv of invaders){
        if(!inv.alive)continue;
        const nextX=inv.x+invaderDirection*invaderSpeed*12;
        if(nextX<10||nextX+inv.w>canvas.width-10){hitEdge=true;break;}
      }
      if(hitEdge){for(const inv of invaders){if(inv.alive)inv.y+=invaderDescendAmount;}invaderDirection*=-1;}
      else{for(const inv of invaders){if(inv.alive)inv.x+=invaderDirection*invaderSpeed*12;}}
      for(const inv of invaders){inv.anim=(inv.anim+1)%2;}
      enemyFire();
      invaderMoveTimer=0;
      if(soundOn && sfx.invaderMove.src)sfx.invaderMove.play();
    }

    for(let i=bullets.length-1;i>=0;i--){bullets[i].y-=bullets[i].speed*dt;if(bullets[i].y+bullets[i].h<0)bullets.splice(i,1);}
    for(let i=enemyBullets.length-
