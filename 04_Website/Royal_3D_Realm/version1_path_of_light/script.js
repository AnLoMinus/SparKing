const scene = document.getElementById("scene");
const world = document.getElementById("world");
const runner = document.getElementById("runner");
const banner = document.getElementById("banner");
const flash = document.getElementById("flash");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const speedEl = document.getElementById("speed");

const lanePositions = [-140, 0, 140];
let currentLane = 1;
let obstacles = [];
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let best = 0;
let speed = 320; // units per second toward the player

const obstacleConfig = {
  spawnInterval: 850,
  minDistance: 240,
  startZ: -1400,
  despawnZ: 260,
};

function resetGame() {
  obstacles.forEach((o) => o.node.remove());
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  speed = 320;
  lastTime = performance.now();
  runner.style.transform = buildPlayerTransform();
  updateScoreboard();
}

function buildPlayerTransform() {
  return `translate3d(${lanePositions[currentLane]}px, 0, 20px)`;
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * lanePositions.length);
  const node = document.createElement("div");
  node.className = "obstacle";
  node.style.transform = `translate3d(${lanePositions[lane]}px, 0, ${obstacleConfig.startZ}px)`;
  world.appendChild(node);
  obstacles.push({ lane, z: obstacleConfig.startZ, node });
}

function updateObstacles(delta) {
  const moveDistance = speed * delta;
  const nextObstacles = [];

  for (const obstacle of obstacles) {
    obstacle.z += moveDistance;
    obstacle.node.style.transform = `translate3d(${lanePositions[obstacle.lane]}px, 0, ${obstacle.z}px)`;

    if (checkCollision(obstacle)) {
      flashHit();
      endRun();
      return;
    }

    if (obstacle.z < obstacleConfig.despawnZ) {
      nextObstacles.push(obstacle);
    } else {
      obstacle.node.remove();
    }
  }

  obstacles = nextObstacles;
}

function checkCollision(obstacle) {
  if (obstacle.lane !== currentLane) return false;
  return obstacle.z > -40 && obstacle.z < 60;
}

function updateScoreboard() {
  scoreEl.textContent = Math.floor(score).toString();
  bestEl.textContent = best.toString();
  speedEl.textContent = `${(speed / 320).toFixed(1)}x`;
}

function flashHit() {
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 160);
}

function endRun() {
  running = false;
  best = Math.max(best, Math.floor(score));
  banner.querySelector(".banner__eyebrow").textContent = "Game Over";
  banner.querySelector(".banner__title").textContent = "You were clipped!";
  banner.querySelector(".banner__meta").textContent = "לחץ Enter כדי לנסות שוב";
  banner.classList.remove("hide");
  updateScoreboard();
}

function gameLoop(timestamp) {
  if (!running) return;

  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  spawnTimer += delta * 1000;
  score += delta * 12;
  speed += delta * 6;

  if (spawnTimer >= obstacleConfig.spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  updateObstacles(delta);
  runner.style.transform = buildPlayerTransform();
  updateScoreboard();

  requestAnimationFrame(gameLoop);
}

function startRun() {
  running = true;
  banner.classList.add("hide");
  resetGame();
  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(gameLoop);
  });
}

function handleInput(event) {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    currentLane = Math.max(0, currentLane - 1);
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    currentLane = Math.min(lanePositions.length - 1, currentLane + 1);
  } else if (event.code === "Enter") {
    startRun();
  }
}

function init() {
  resetGame();
  document.addEventListener("keydown", handleInput);
  banner.querySelector(".banner__eyebrow").textContent = "Press Enter";
  banner.querySelector(".banner__title").textContent = "Ready to run";
}

init();
