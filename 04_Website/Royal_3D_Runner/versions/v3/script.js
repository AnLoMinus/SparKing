const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const crownsEl = document.getElementById("crowns");
const streakEl = document.getElementById("streak");
const finalTitleEl = document.getElementById("final-title");
const finalScoreEl = document.getElementById("final-score");
const finalCrownsEl = document.getElementById("final-crowns");
const finalStreakEl = document.getElementById("final-streak");
const chargeFill = document.getElementById("charge-fill");
const chargeText = document.getElementById("charge-text");
const pausePill = document.getElementById("pause-pill");
const sfxPill = document.getElementById("sfx-pill");

let last = 0;
let running = true;
let paused = false;
let elapsed = 0;
let score = 0;
let spawnTimer = 1.05;
let crownTimer = 1.4;
let speed = 18;
let crowns = 0;
let charge = 0;
let charging = false;
let chargeTimer = 0;
let streak = 0;
let bestStreak = 0;
let sfxOn = false;

const obstacles = [];
const pickups = [];
const particles = [];

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
  paused = false;
  elapsed = 0;
  score = 0;
  spawnTimer = 1.05;
  crownTimer = 1.4;
  speed = 18;
  crowns = 0;
  charge = 0;
  charging = false;
  chargeTimer = 0;
  streak = 0;
  bestStreak = 0;
  sfxOn = false;
  obstacles.length = 0;
  pickups.length = 0;
  particles.length = 0;
  player.lane = 0;
  player.targetLane = 0;
  overlay.hidden = true;
  pausePill.hidden = true;
  sfxPill.textContent = "SFX Stub: Off";
  last = performance.now();
}

function spawnObstacle() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  obstacles.push({
    lane,
    z: 120,
    tint: Math.random() > 0.5 ? "#ffd700" : "#6a0dad",
    passed: false,
  });
}

function spawnCrown() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  pickups.push({
    lane,
    z: 120,
    value: 12,
  });
}

function addParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      life: 0.5,
      vx: (Math.random() - 0.5) * 60,
      vy: -40 - Math.random() * 40,
      color,
    });
  }
}

function handleInput(e) {
  if (e.key === "ArrowLeft") {
    player.targetLane = Math.max(-1, player.targetLane - 1);
    addParticles(canvas.width / 2, canvas.height * 0.82, "rgba(255, 215, 0, 0.6)");
  } else if (e.key === "ArrowRight") {
    player.targetLane = Math.min(1, player.targetLane + 1);
    addParticles(canvas.width / 2, canvas.height * 0.82, "rgba(106, 13, 173, 0.6)");
  } else if (e.code === "Space") {
    tryCharge();
  } else if (e.key.toLowerCase() === "r") {
    resetGame();
  } else if (e.key.toLowerCase() === "p") {
    togglePause();
  } else if (e.key.toLowerCase() === "t") {
    sfxOn = !sfxOn;
    sfxPill.textContent = `SFX Stub: ${sfxOn ? "On" : "Off"}`;
  }
}

document.addEventListener("keydown", handleInput);
restartBtn.addEventListener("click", () => {
  resetGame();
});

function tryCharge() {
  if (charging || charge < 100 || !running) return;
  charging = true;
  chargeTimer = 1.6;
  charge = 0;
  chargeText.textContent = "Charge active";
  chargeFill.style.width = "100%";
  addParticles(canvas.width / 2, canvas.height * 0.82, "rgba(255,215,0,0.8)");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pausePill.hidden = !paused;
  last = performance.now();
}

function project(lane, z) {
  const perspective = 360;
  const scale = perspective / (z + perspective);
  const x = canvas.width / 2 + lane * 170 * scale;
  const baseY = canvas.height * 0.82;
  const y = baseY - z * 3.8 * scale;
  return { x, y, scale };
}

function drawGround() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.12)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.26,
    40,
    canvas.width * 0.5,
    canvas.height * 0.4,
    canvas.height * 0.62
  );
  glow.addColorStop(0, "rgba(255, 215, 0, 0.14)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 215, 0, 0.38)";
  ctx.lineWidth = 1.6;
  lanes.forEach((lane) => {
    const p1 = project(lane, 0);
    const p2 = project(lane, 140);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y + 80);
    ctx.lineTo(p2.x, p2.y - 40);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(106, 13, 173, 0.24)";
  for (let z = 9; z < 140; z += 9) {
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
  player.lane += laneDiff * 0.22;

  const { x, y, scale } = project(player.lane, player.z);
  const size = 62 * scale;
  const gradient = ctx.createLinearGradient(x - size / 2, y - size, x + size / 2, y + size);
  gradient.addColorStop(0, "#ffd700");
  gradient.addColorStop(1, "#6a0dad");

  ctx.shadowColor = charging ? "rgba(255, 215, 0, 0.85)" : "rgba(0,0,0,0.4)";
  ctx.shadowBlur = charging ? 32 : 8;

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size, size, size * 1.12, 12 * scale);
  ctx.fill();

  if (charging) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.4, size * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

function drawObstacle(ob) {
  const { x, y, scale } = project(ob.lane, ob.z);
  const size = 76 * scale;
  ctx.fillStyle = ob.tint;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size, size, size * 1.1, 6 * scale);
  ctx.fill();
  ctx.stroke();
}

function drawCrown(crown) {
  const { x, y, scale } = project(crown.lane, crown.z);
  const size = 40 * scale;
  ctx.fillStyle = "#ffd700";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x - size / 4, y - size * 0.7);
  ctx.lineTo(x, y - size * 0.4);
  ctx.lineTo(x + size / 4, y - size * 0.7);
  ctx.lineTo(x + size / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawParticles() {
  particles.forEach((p) => {
    p.life -= 0.016;
    p.x += (p.vx / 60);
    p.y += (p.vy / 60);
  });
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  particles.forEach((p) => {
    const alpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color.replace("0.6", alpha.toFixed(2));
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function collectCrown(crown) {
  crowns += 1;
  score += 18 * multiplier();
  charge = Math.min(100, charge + crown.value);
  bestStreak = Math.max(bestStreak, streak);
}

function multiplier() {
  return 1 + Math.floor(streak / 5) * 0.25;
}

function detectCollisions() {
  if (charging) return;
  for (const ob of obstacles) {
    if (Math.abs(ob.lane - player.targetLane) < 0.22 && ob.z <= player.z + 2.4) {
      running = false;
      overlay.hidden = false;
      finalTitleEl.textContent = "Fallen";
      finalScoreEl.textContent = `Score: ${Math.floor(score)}`;
      finalCrownsEl.textContent = `Crowns: ${crowns}`;
      finalStreakEl.textContent = `Best Streak: x${Math.max(bestStreak, streak)}`;
      break;
    }
  }
}

function update(dt) {
  if (!running || paused) return;
  elapsed += dt;
  score += dt * 16 * multiplier();
  spawnTimer -= dt;
  crownTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.65, 1.05 - elapsed * 0.012);
    speed = Math.min(28, speed + 0.12);
  }
  if (crownTimer <= 0) {
    spawnCrown();
    crownTimer = 1.3 + Math.random() * 0.6;
  }

  obstacles.forEach((ob) => {
    ob.z -= speed * dt;
    if (!ob.passed && ob.z <= player.z) {
      ob.passed = true;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += 6 * multiplier();
    }
  });
  pickups.forEach((p) => {
    p.z -= (speed - 2) * dt;
  });

  if (charging) {
    chargeTimer -= dt;
    if (chargeTimer <= 0) {
      charging = false;
      chargeText.textContent = `Charge ${Math.floor(charge)}%`;
    }
  }

  // Magnet crowns during charge
  pickups.slice().forEach((crown) => {
    if (charging && Math.abs(crown.lane - player.lane) < 0.6 && crown.z <= player.z + 16) {
      collectCrown(crown);
      pickups.splice(pickups.indexOf(crown), 1);
    }
  });

  pickups.slice().forEach((crown) => {
    if (Math.abs(crown.lane - player.targetLane) < 0.18 && crown.z <= player.z + 1.2) {
      collectCrown(crown);
      pickups.splice(pickups.indexOf(crown), 1);
    }
  });

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].z < -4) obstacles.splice(i, 1);
  }
  for (let i = pickups.length - 1; i >= 0; i--) {
    if (pickups[i].z < -2) pickups.splice(i, 1);
  }

  detectCollisions();

  scoreEl.textContent = Math.floor(score).toString();
  timeEl.textContent = `${elapsed.toFixed(1)}s`;
  crownsEl.textContent = crowns.toString();
  streakEl.textContent = `x${Math.max(1, Math.floor(multiplier() * 1))}`;
  chargeFill.style.width = `${charge}%`;
  chargeText.textContent = charging ? "Charge active" : `Charge ${Math.floor(charge)}%`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  pickups
    .slice()
    .sort((a, b) => b.z - a.z)
    .forEach(drawCrown);
  obstacles
    .slice()
    .sort((a, b) => b.z - a.z)
    .forEach(drawObstacle);
  drawPlayer();
  drawParticles();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - last) / 1000, 0.05);
  last = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

resize();
window.addEventListener("resize", resize);
resetGame();
requestAnimationFrame(loop);
