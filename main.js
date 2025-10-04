// keep track of current level
let currentLevel = 1;
let currentScript = null;

// function to load a level script dynamically
function loadLevel(levelNum) {
  // remove old script if it exists
  if (currentScript) {
    document.body.removeChild(currentScript);
    currentScript = null;
  }

  currentLevel = levelNum;

  const script = document.createElement("script");
  script.src = (levelNum === 1) ? "game.js" : `gamelevel${levelNum}.js`;
  script.onload = () => console.log(`Level ${levelNum} loaded`);
  document.body.appendChild(script);
  currentScript = script;
}

// start at level 1
loadLevel(1);

// make it globally accessible so game.js or gamelevel2.js can call it
window.nextLevel = function() {
  loadLevel(currentLevel + 1);
};
