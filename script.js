const gameContainer = document.getElementById('game-container');
const resetBtn = document.getElementById('resetBtn');
const hintBtn = document.getElementById('hintBtn');
const levelSelect = document.getElementById('level-select');
const scoreModal = document.getElementById('score-modal');
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');

let tubes = [];
let selectedTube = null;
let colors = ["#ff4d4d","#3b82f6","#10b981","#facc15","#fb7c05","#8b5cf6","#ff7ab6","#06b6d4"];
let levels = [];
let currentLevel = 1;
let moves = 0;
let confettiParticles = [];
let hintUsageCount = 0;
const layersPerTube = 4;

/* ==== LEVEL CREATION ==== */
// Create 50 levels, each random between 5–8 tubes (no 9s)
for (let i = 1; i <= 50; i++) {
  const tubeCount = Math.floor(Math.random() * 4) + 5; // 5–8 tubes
  levels.push(tubeCount);
}

/* ==== POPULATE LEVEL SELECT ==== */
levels.forEach((tubeNum, index) => {
  const opt = document.createElement('option');
  opt.value = index + 1;
  opt.textContent = `Level ${index + 1} - ${tubeNum} tubes`;
  levelSelect.appendChild(opt);
});

levelSelect.addEventListener('change', () => {
  currentLevel = parseInt(levelSelect.value);
  initGame();
});

/* ==== SHUFFLE ==== */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ==== INIT GAME ==== */
function initGame() {
  gameContainer.innerHTML = "";
  tubes = [];
  selectedTube = null;
  moves = 0;
  hintUsageCount = 0;
  hintBtn.textContent = "Hint";
  updateScore();
  confettiParticles = [];
  resizeCanvas();

  const tubeCount = levels[currentLevel - 1];
  let colorLayers = [];

  // Fill color layers (last two tubes empty)
  for (let i = 0; i < tubeCount - 2; i++) {
    const color = colors[i % colors.length];
    for (let j = 0; j < layersPerTube; j++) {
      colorLayers.push(color);
    }
  }
  colorLayers = shuffle(colorLayers);

  for (let i = 0; i < tubeCount; i++) {
    const tube = { layers: [], element: null, cleared: false };
    tube.element = document.createElement("div");
    tube.element.classList.add("tube");
    tube.element.addEventListener("click", () => handleTubeClick(tube));
    gameContainer.appendChild(tube.element);
    tubes.push(tube);
  }

  tubes.forEach((tube, i) => {
    if (i < tubeCount - 2) {
      for (let j = 0; j < layersPerTube; j++) {
        const color = colorLayers.pop();
        tube.layers.push(color);
      }
    }
    renderTube(tube);
  });
}

/* ==== RENDER ==== */
function renderTube(tube) {
  tube.element.innerHTML = "";
  tube.layers.forEach(color => {
    const div = document.createElement("div");
    div.classList.add("liquid");
    div.style.background = color;
    div.style.height = `${100 / layersPerTube}%`;
    tube.element.appendChild(div);
  });
}

/* ==== TUBE CLICK ==== */
function handleTubeClick(tube) {
  if (selectedTube === null) {
    if (tube.layers.length === 0) return;
    selectedTube = tube;
    tube.element.style.border = "3px solid #0f0";
  } else {
    if (tube === selectedTube) {
      selectedTube.element.style.border = "2px solid #fff";
      selectedTube = null;
      return;
    }
    pourLiquid(selectedTube, tube);
    selectedTube.element.style.border = "2px solid #fff";
    selectedTube = null;
    moves++;
    updateScore();
    setTimeout(() => {
      checkClearTube();
      checkWin();
    }, 150);
  }
}

/* ==== POUR ==== */
function pourLiquid(source, target) {
  if (source.layers.length === 0) return;
  const sourceColor = source.layers[source.layers.length - 1];
  let count = 1;
  for (let i = source.layers.length - 2; i >= 0; i--) {
    if (source.layers[i] === sourceColor) count++;
    else break;
  }

  const emptySpaces = layersPerTube - target.layers.length;
  const targetTopColor = target.layers[target.layers.length - 1];

  if (target.layers.length === 0 || targetTopColor === sourceColor) {
    const pourCount = Math.min(count, emptySpaces);
    let i = 0;
    const pourInterval = setInterval(() => {
      if (i >= pourCount) {
        clearInterval(pourInterval);
        return;
      }
      target.layers.push(source.layers.pop());
      renderTube(source);
      renderTube(target);
      i++;
    }, 75);
  }
}

/* ==== SCORE ==== */
function updateScore() {
  scoreModal.textContent = `Moves: ${moves}`;
}

/* ==== CLEAR ==== */
function checkClearTube() {
  tubes.forEach(tube => {
    if (tube.layers.length === layersPerTube) {
      const top = tube.layers[0];
      const sorted = tube.layers.every(l => l === top);
      if (sorted && !tube.cleared) {
        tube.cleared = true;
        createConfetti(30);
      }
    }
  });
}

/* ==== WIN CHECK ==== */
function checkWin() {
  let won = true;
  tubes.forEach(tube => {
    if (tube.layers.length === 0) return;
    if (tube.layers.length !== layersPerTube) {
      won = false;
      return;
    }
    const top = tube.layers[0];
    const sorted = tube.layers.every(l => l === top);
    if (!sorted) won = false;
  });

  if (won) {
    createConfetti(60);
    setTimeout(() => {
      if (hintUsageCount > 3) {
        showLoserPopup();
      } else {
        showWinPopup();
      }
    }, 300);
  }
}

/* ==== POPUPS ==== */
/* ==== WIN POPUP ==== */
function showWinPopup() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🎉 Level ${currentLevel} Completed!</h2>
      <p>You finished in ${moves} moves!</p>
      <div class="modal-actions single">
        <button class="btn-primary" id="nextLevelBtn">Next Level</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.style.display = "flex";

  const nextBtn = modal.querySelector("#nextLevelBtn");
  nextBtn.addEventListener("click", () => {
    modal.remove();
    if (currentLevel < levels.length) {
      currentLevel++;
      levelSelect.value = currentLevel;
      initGame();
    } else {
      alert("🎉 You’ve completed all available levels!");
    }
  });
}

/* ==== LOSER POPUP ==== */
function showLoserPopup() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>😢 You Used Too Many Hints!</h2>
      <p>Better luck next time!</p>
      <div class="modal-actions single">
        <button class="btn-primary" id="retryBtn">Retry Level</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.style.display = "flex";

  const retryBtn = modal.querySelector("#retryBtn");
  retryBtn.addEventListener("click", () => {
    modal.remove();
    initGame();
  });
}


/* ==== HINT LOGIC ==== */
hintBtn.addEventListener("click", () => {
  let foundHint = false;
  for (const src of tubes) {
    if (src.layers.length === 0) continue;
    const srcColor = src.layers[src.layers.length - 1];
    for (const tgt of tubes) {
      if (src === tgt) continue;
      const tgtTop = tgt.layers[tgt.layers.length - 1];
      if (tgt.layers.length === 0 || tgtTop === srcColor) {
        foundHint = true;
        hintUsageCount++;

        // highlight
        src.element.style.border = "3px solid #00f";
        tgt.element.style.border = "3px solid #00f";

        // create hint arrow
        const arrow = document.createElement("div");
        arrow.classList.add("hint-arrow");
        document.body.appendChild(arrow);

        const srcRect = src.element.getBoundingClientRect();
        const tgtRect = tgt.element.getBoundingClientRect();
        const x1 = srcRect.left + srcRect.width / 2;
        const y1 = srcRect.top + srcRect.height / 2;
        const x2 = tgtRect.left + tgtRect.width / 2;
        const y2 = tgtRect.top + tgtRect.height / 2;
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        arrow.style.height = `${length}px`;
        arrow.style.left = `${x1}px`;
        arrow.style.top = `${y1}px`;
        arrow.style.transform = `rotate(${angle}deg)`;
        arrow.style.opacity = 1;

        setTimeout(() => {
          arrow.style.transition = "opacity 0.3s";
          arrow.style.opacity = 0;
          setTimeout(() => {
            arrow.remove();
            src.element.style.border = "2px solid #fff";
            tgt.element.style.border = "2px solid #fff";
          }, 300);
        }, 2000);

        break;
      }
    }
    if (foundHint) break;
  }
});

/* ==== RESET ==== */
resetBtn.addEventListener("click", initGame);

/* ==== CONFETTI ==== */
function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

function createConfetti(count) {
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - 20,
      r: Math.random() * 6 + 4,
      dx: Math.random() * 2 - 1,
      dy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  for (let i = 0; i < confettiParticles.length; i++) {
    const p = confettiParticles[i];
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.y > confettiCanvas.height) {
      confettiParticles.splice(i, 1);
      i--;
    }
  }
  requestAnimationFrame(animateConfetti);
}

animateConfetti();
initGame();
