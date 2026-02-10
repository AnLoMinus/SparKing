const world = document.getElementById("world");
const runner = document.getElementById("runner");
const banner = document.getElementById("banner");
const flash = document.getElementById("flash");
const glow = document.getElementById("glow");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const crystalEl = document.getElementById("crystals");
const energyFill = document.getElementById("energyFill");

const lanePositions = [-160, 0, 160];
const obstacleConfig = {
  startZ: -1500,
  despawnZ: 280,
  baseInterval: 900,
  minInterval: 480,
};
const crystalConfig = {
  startZ: -1500,
  despawnZ: 260,
  interval: 1400,
};

const state = {
  lane: 1,
  speed: 340,
  score: 0,
  best: 0,
  crystals: 0,
  energy: 30,
  shield: false,
  shieldTimer: 0,
  running: false,
};

let obstacles = [];
let crystals = [];
let lastTime = 0;
let obstacleTimer = 0;
let crystalTimer = 0;

function buildRunnerTransform() {
  return `translate3d(${lanePositions[state.lane]}px, 0, 30px)`;
}

function reset() {
  obstacles.forEach((o) => o.node.remove());
  crystals.forEach((c) => c.node.remove());
  obstacles = [];
  crystals = [];
  obstacleTimer = 0;
  crystalTimer = 0;
  state.speed = 340;
  state.score = 0;
  state.crystals = 0;
  state.energy = 30;
  state.shield = false;
  state.shieldTimer = 0;
  runner.classList.remove("runner--shielded");
  glow.classList.remove("show");
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
  const move = state.speed * delta * 0.9;
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
  if (obstacle.z <= -40 || obstacle.z >= 60) return false;

  if (state.shield) {
    obstacle.node.remove();
    state.score += 5;
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
  state.energy = Math.min(100, state.energy + 22);
  state.score += 8;
  updateUI();
  return true;
}

function flashHit() {
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 180);
}

function endRun() {
  state.running = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  banner.querySelector(".banner__eyebrow").textContent = "Run Ended";
  banner.querySelector(".banner__title").textContent = "Crystal shattered";
  banner.querySelector(".banner__meta").textContent = "לחץ Enter כדי לנסות שוב";
  banner.classList.remove("hide");
  updateUI();
}

function updateUI() {
  scoreEl.textContent = Math.floor(state.score).toString();
  bestEl.textContent = state.best.toString();
  crystalEl.textContent = state.crystals.toString();
  energyFill.style.width = `${state.energy}%`;
}

function useShield() {
  if (state.energy < 30 || state.shield) return;
  state.energy -= 30;
  state.shield = true;
  state.shieldTimer = 1.4; // seconds
  runner.classList.add("runner--shielded");
  glow.classList.add("show");
  updateUI();
}

function updateShield(delta) {
  if (!state.shield) return;
  state.shieldTimer -= delta;
  if (state.shieldTimer <= 0) {
    state.shield = false;
    runner.classList.remove("runner--shielded");
    glow.classList.remove("show");
  }
}

function loop(timestamp) {
  if (!state.running) return;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  state.score += delta * 14;
  state.speed += delta * 10;

  const difficultyFactor = Math.min(1, state.score / 500);
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
  updateShield(delta);

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

function handleInput(event) {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.lane = Math.max(0, state.lane - 1);
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.lane = Math.min(lanePositions.length - 1, state.lane + 1);
  } else if (event.code === "Space") {
    event.preventDefault();
    useShield();
  } else if (event.code === "Enter") {
    startRun();
  }
}

function init() {
  reset();
  document.addEventListener("keydown", handleInput);
}

init();
