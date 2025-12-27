const world = document.getElementById("world");
const runner = document.getElementById("runner");
const banner = document.getElementById("banner");
const flash = document.getElementById("flash");
const comboToast = document.getElementById("comboToast");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const crystalEl = document.getElementById("crystals");
const comboEl = document.getElementById("combo");
const surgeFill = document.getElementById("surgeFill");
const scene = document.getElementById("scene");

const lanePositions = [-170, 0, 170];
const obstacleConfig = {
  startZ: -1600,
  despawnZ: 300,
  baseInterval: 820,
  minInterval: 420,
};
const crystalConfig = {
  startZ: -1550,
  despawnZ: 280,
  interval: 1200,
};

const state = {
  lane: 1,
  speed: 360,
  score: 0,
  best: 0,
  crystals: 0,
  combo: 0,
  comboTimer: 0,
  surgeMeter: 35,
  surgeActive: false,
  surgeTimer: 0,
  running: false,
};

let obstacles = [];
let crystals = [];
let obstacleTimer = 0;
let crystalTimer = 0;
let lastTime = 0;
let pointerActive = false;

function buildRunnerTransform() {
  return `translate3d(${lanePositions[state.lane]}px, 0, 32px)`;
}

function reset() {
  obstacles.forEach((o) => o.node.remove());
  crystals.forEach((c) => c.node.remove());
  obstacles = [];
  crystals = [];
  obstacleTimer = 0;
  crystalTimer = 0;
  state.lane = 1;
  state.speed = 360;
  state.score = 0;
  state.crystals = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.surgeMeter = 35;
  state.surgeActive = false;
  state.surgeTimer = 0;
  runner.classList.remove("runner--surge");
  runner.style.transform = buildRunnerTransform();
  updateUI();
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * lanePositions.length);
  const node = document.createElement("div");
  node.className = "obstacle";
  node.style.transform = `translate3d(${lanePositions[lane]}px, 0, ${obstacleConfig.startZ}px)`;
  world.appendChild(node);
  obstacles.push({ lane, z: obstacleConfig.startZ, node });
}

function spawnCrystal() {
  const lane = Math.floor(Math.random() * lanePositions.length);
  const node = document.createElement("div");
  node.className = "crystal";
  node.style.transform = `translate3d(${lanePositions[lane]}px, 0, ${crystalConfig.startZ}px)`;
  world.appendChild(node);
  crystals.push({ lane, z: crystalConfig.startZ, node });
}

function updateObstacles(delta) {
  const move = state.speed * delta;
  const remaining = [];

  for (const obstacle of obstacles) {
    obstacle.z += move;

    if (state.surgeActive && obstacle.z > -260) {
      obstacle.node.remove();
      state.score += 6;
      continue;
    }

    obstacle.node.style.transform = `translate3d(${lanePositions[obstacle.lane]}px, 0, ${obstacle.z}px)`;

    if (handleObstacleCollision(obstacle)) {
      return false;
    }

    if (obstacle.z < obstacleConfig.despawnZ) {
      remaining.push(obstacle);
    } else {
      obstacle.node.remove();
    }
  }

  obstacles = remaining;
  return true;
}

function updateCrystals(delta) {
  const move = state.speed * delta * 0.92;
  const remaining = [];

  for (const crystal of crystals) {
    crystal.z += move;
    crystal.node.style.transform = `translate3d(${lanePositions[crystal.lane]}px, 0, ${crystal.z}px)`;

    if (handleCrystalPickup(crystal)) {
      continue;
    }

    if (crystal.z < crystalConfig.despawnZ) {
      remaining.push(crystal);
    } else {
      crystal.node.remove();
    }
  }

  crystals = remaining;
}

function handleObstacleCollision(obstacle) {
  if (obstacle.lane !== state.lane) return false;
  if (obstacle.z <= -36 || obstacle.z >= 62) return false;

  if (state.surgeActive) {
    obstacle.node.remove();
    state.score += 8;
    return false;
  }

  flashHit();
  endRun();
  return true;
}

function handleCrystalPickup(crystal) {
  if (crystal.lane !== state.lane) return false;
  if (crystal.z < -30 || crystal.z > 70) return false;

  crystal.node.remove();
  state.crystals += 1;
  state.combo += 1;
  state.comboTimer = 2.8;
  state.surgeMeter = Math.min(100, state.surgeMeter + 12 + state.combo * 0.6);
  state.score += 10 + state.combo * 0.5;
  maybeShowComboToast();
  updateUI();
  return true;
}

function maybeShowComboToast() {
  if (state.combo < 4 && state.surgeMeter < 100) return;
  comboToast.textContent = state.surgeMeter >= 100 ? "Surge Ready — Space" : `${state.combo}x combo`;
  comboToast.classList.add("show");
  setTimeout(() => comboToast.classList.remove("show"), 900);
}

function flashHit() {
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 180);
}

function endRun() {
  state.running = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  banner.querySelector(".banner__eyebrow").textContent = "Run Ended";
  banner.querySelector(".banner__title").textContent = "Surge collapsed";
  banner.querySelector(".banner__meta").textContent = "לחץ Enter כדי לנסות שוב";
  banner.classList.remove("hide");
  updateUI();
}

function updateUI() {
  scoreEl.textContent = Math.floor(state.score).toString();
  bestEl.textContent = state.best.toString();
  crystalEl.textContent = state.crystals.toString();
  comboEl.textContent = `${state.combo}x`;
  surgeFill.style.width = `${state.surgeMeter}%`;
}

function updateCombo(delta) {
  if (state.combo === 0) return;
  state.comboTimer -= delta;
  if (state.comboTimer <= 0) {
    state.combo = 0;
    updateUI();
  }
}

function activateSurge() {
  if (state.surgeMeter < 100 || state.surgeActive) return;
  state.surgeMeter = 0;
  state.surgeActive = true;
  state.surgeTimer = 1.6;
  runner.classList.add("runner--surge");
  maybeShowComboToast();
  updateUI();
}

function updateSurge(delta) {
  if (!state.surgeActive) return;
  state.surgeTimer -= delta;
  if (state.surgeTimer <= 0) {
    state.surgeActive = false;
    runner.classList.remove("runner--surge");
  }
}

function loop(timestamp) {
  if (!state.running) return;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const comboBonus = 1 + state.combo * 0.08 + (state.surgeActive ? 0.5 : 0);
  state.score += delta * 16 * comboBonus;
  state.speed += delta * 12;

  const difficultyFactor = Math.min(1, state.score / 520);
  const targetObstacleInterval = Math.max(
    obstacleConfig.minInterval,
    obstacleConfig.baseInterval - difficultyFactor * 320
  );

  obstacleTimer += delta * 1000;
  crystalTimer += delta * 1000;

  if (obstacleTimer >= targetObstacleInterval) {
    obstacleTimer = 0;
    spawnObstacle();
  }

  if (crystalTimer >= crystalConfig.interval) {
    crystalTimer = 0;
    spawnCrystal();
  }

  const alive = updateObstacles(delta);
  if (!alive) return;

  updateCrystals(delta);
  updateCombo(delta);
  updateSurge(delta);

  runner.style.transform = buildRunnerTransform();
  updateUI();

  requestAnimationFrame(loop);
}

function startRun() {
  state.running = true;
  banner.classList.add("hide");
  reset();
  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
  });
}

function handleKey(event) {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.lane = Math.max(0, state.lane - 1);
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.lane = Math.min(lanePositions.length - 1, state.lane + 1);
  } else if (event.code === "Space") {
    event.preventDefault();
    activateSurge();
  } else if (event.code === "Enter") {
    startRun();
  }
}

function laneFromPointer(evt) {
  const rect = scene.getBoundingClientRect();
  const ratio = (evt.clientX - rect.left) / rect.width;
  if (ratio < 0.33) return 0;
  if (ratio < 0.66) return 1;
  return 2;
}

function pointerDown(evt) {
  pointerActive = true;
  state.lane = laneFromPointer(evt);
}

function pointerMove(evt) {
  if (!pointerActive) return;
  state.lane = laneFromPointer(evt);
}

function pointerUp() {
  pointerActive = false;
}

function init() {
  reset();
  document.addEventListener("keydown", handleKey);
  scene.addEventListener("pointerdown", pointerDown);
  scene.addEventListener("pointermove", pointerMove);
  scene.addEventListener("pointerup", pointerUp);
  scene.addEventListener("pointerleave", pointerUp);
}

init();
