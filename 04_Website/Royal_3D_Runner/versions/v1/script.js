const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const finalTitleEl = document.getElementById("final-title");
const finalScoreEl = document.getElementById("final-score");

let last = 0;
let running = true;
let elapsed = 0;
let score = 0;
let obstacles = [];
let spawnTimer = 1.2;
let speed = 18;

const player = {
  lane: 0,
  targetLane: 0,
  z: 8,
};

const lanes = [-1, 0, 1];

function resize() {
  const ratio = 16 / 9;
  const width = canvas.parentElement.clientWidth;
  const height = width / ratio;
  canvas.width = width;
  canvas.height = height;
}

function resetGame() {
  running = true;
  elapsed = 0;
  score = 0;
  obstacles = [];
  spawnTimer = 1.2;
  speed = 18;
  player.lane = 0;
  player.targetLane = 0;
  overlay.hidden = true;
  statusEl.textContent = "Running";
  finalTitleEl.textContent = "Fallen";
  finalScoreEl.textContent = "";
  last = performance.now();
  requestAnimationFrame(loop);
}

function spawnObstacle() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  obstacles.push({
    lane,
    z: 120,
    width: 1,
    height: 1,
    tint: Math.random() > 0.5 ? "#ffd700" : "#6a0dad",
  });
}

function handleInput(e) {
  if (e.key === "ArrowLeft") {
    player.targetLane = Math.max(-1, player.targetLane - 1);
  } else if (e.key === "ArrowRight") {
    player.targetLane = Math.min(1, player.targetLane + 1);
  } else if (e.key.toLowerCase() === "r") {
    resetGame();
  }
}

document.addEventListener("keydown", handleInput);
restartBtn.addEventListener("click", resetGame);

function project(lane, z) {
  const perspective = 340;
  const scale = perspective / (z + perspective);
  const x = canvas.width / 2 + lane * 160 * scale;
  const baseY = canvas.height * 0.82;
  const y = baseY - z * 3.6 * scale;
  return { x, y, scale };
}

function drawGround() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
  ctx.lineWidth = 1.5;
  lanes.forEach((lane) => {
    const p1 = project(lane, 0);
    const p2 = project(lane, 140);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y + 80);
    ctx.lineTo(p2.x, p2.y - 40);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(106, 13, 173, 0.25)";
  for (let z = 12; z < 140; z += 12) {
    const pLeft = project(-1.2, z);
    const pRight = project(1.2, z);
    ctx.beginPath();
    ctx.moveTo(pLeft.x, pLeft.y);
    ctx.lineTo(pRight.x, pRight.y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const laneDiff = player.targetLane - player.lane;
  player.lane += laneDiff * 0.18;

  const { x, y, scale } = project(player.lane, player.z);
  const size = 58 * scale;
  const gradient = ctx.createLinearGradient(x - size / 2, y - size, x + size / 2, y + size);
  gradient.addColorStop(0, "#ffd700");
  gradient.addColorStop(1, "#6a0dad");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size, size, size, 8 * scale);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 1.4 * scale;
  ctx.strokeRect(x - size / 3, y - size * 0.8, size * 0.66, size * 0.4);
}

function drawObstacle(ob) {
  const { x, y, scale } = project(ob.lane, ob.z);
  const size = 70 * scale;
  ctx.fillStyle = ob.tint;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size, size, size * 1.1, 6 * scale);
  ctx.fill();
  ctx.stroke();
}

function detectCollisions() {
  for (const ob of obstacles) {
    if (Math.abs(ob.lane - player.targetLane) < 0.25 && ob.z <= player.z + 2) {
      running = false;
      overlay.hidden = false;
      statusEl.textContent = "Fallen";
      finalTitleEl.textContent = "Fallen";
      finalScoreEl.textContent = `Score: ${Math.floor(score)}`;
      break;
    }
  }
}

function update(dt) {
  if (!running) return;
  elapsed += dt;
  score += dt * 12;
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 1.05;
  }

  obstacles.forEach((ob) => {
    ob.z -= speed * dt;
  });
  obstacles = obstacles.filter((ob) => ob.z > -4);

  detectCollisions();

  scoreEl.textContent = Math.floor(score).toString();
  timeEl.textContent = `${elapsed.toFixed(1)}s`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  obstacles
    .slice()
    .sort((a, b) => b.z - a.z)
    .forEach(drawObstacle);
  drawPlayer();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - last) / 1000, 0.05);
  last = timestamp;
  update(dt);
  render();
  if (running) requestAnimationFrame(loop);
}

resize();
window.addEventListener("resize", resize);
resetGame();
