const container = document.getElementById("game");
const scoreEl = document.getElementById("score");
const distanceEl = document.getElementById("distance");
const comboEl = document.getElementById("combo");
const statusEl = document.getElementById("status");
const focusBar = document.getElementById("focusBar");
const difficultyBar = document.getElementById("difficultyBar");
const dangerBar = document.getElementById("dangerBar");
const resetButton = document.getElementById("resetButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030814);
scene.fog = new THREE.Fog(0x030814, 10, 160);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(0, 9, 15);
camera.lookAt(0, 2, -24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(0x1b2f74, 0x060606, 0.92);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.2);
dirLight.position.set(12, 20, 9);
dirLight.castShadow = true;
scene.add(dirLight);

const rimLight = new THREE.PointLight(0xa855f7, 0.55, 80);
rimLight.position.set(-10, 8, -24);
scene.add(rimLight);

const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x031033, roughness: 0.55, metalness: 0.14 });
const floor = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 260), floorMaterial);
floor.receiveShadow = true;
floor.position.set(0, -1, -70);
scene.add(floor);

const lanes = [-8, 0, 8];
const laneMaterial = new THREE.LineDashedMaterial({ color: 0x2354b3, dashSize: 6, gapSize: 6, opacity: 0.6, transparent: true });
const laneGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-8, 0.05, 90),
  new THREE.Vector3(-8, 0.05, -170),
]);
const lane1 = new THREE.Line(laneGeometry, laneMaterial);
lane1.computeLineDistances();
scene.add(lane1);
const lane2 = new THREE.Line(laneGeometry.clone().translate(8, 0, 0), laneMaterial.clone());
lane2.computeLineDistances();
scene.add(lane2);
const lane3 = new THREE.Line(laneGeometry.clone().translate(16, 0, 0), laneMaterial.clone());
lane3.computeLineDistances();
scene.add(lane3);

const corridor = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 260, 26, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x1236a4, transparent: true, opacity: 0.14 })
);
corridor.rotation.z = Math.PI / 2;
corridor.position.y = -0.1;
scene.add(corridor);

const starsGeo = new THREE.BufferGeometry();
const starsCount = 800;
const starsPositions = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
  starsPositions[i * 3] = (Math.random() - 0.5) * 140;
  starsPositions[i * 3 + 1] = Math.random() * 70 + 6;
  starsPositions[i * 3 + 2] = (Math.random() - 0.5) * 240;
}
starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xa855f7, size: 0.65, transparent: true, opacity: 0.8 }));
scene.add(stars);

const trailGeo = new THREE.BufferGeometry();
const trailCount = 120;
const trailPositions = new Float32Array(trailCount * 3);
for (let i = 0; i < trailCount; i++) {
  trailPositions[i * 3] = (Math.random() - 0.5) * 1.6;
  trailPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
  trailPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
}
trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0xffd700, size: 0.18, transparent: true, opacity: 0.9 }));
scene.add(trail);

const player = new THREE.Mesh(
  new THREE.SphereGeometry(1.3, 30, 30),
  new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x8d6300, metalness: 0.88, roughness: 0.28 })
);
player.castShadow = true;
player.position.set(0, 1.3, 8);
scene.add(player);

const orbGeo = new THREE.SphereGeometry(0.75, 20, 20);
const orbMat = new THREE.MeshStandardMaterial({ color: 0xffe372, emissive: 0x8e6800, metalness: 0.82, roughness: 0.2 });

const droneGeo = new THREE.BoxGeometry(1.6, 1.6, 3.4);
const droneMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x3b1b7e, metalness: 0.7, roughness: 0.22 });

const clock = new THREE.Clock();
const tempPlayerBox = new THREE.Box3();
const tempBox = new THREE.Box3();

const state = {
  laneIndex: 1,
  baseSpeed: 30,
  speed: 30,
  maxSpeed: 62,
  jumpVelocity: 0,
  gravity: -38,
  focus: 100,
  focusActive: false,
  combo: 1,
  comboTimer: 0,
  difficulty: 0,
  danger: 0,
  obstacles: [],
  movers: [],
  orbs: [],
  spawnCooldown: 0,
  moverCooldown: 2,
  orbCooldown: 1,
  score: 0,
  distance: 0,
  alive: true,
  paused: false,
};

function createObstacle() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const size = THREE.MathUtils.randFloat(1.9, 3.3);
  const height = THREE.MathUtils.randFloat(2.5, 5);
  const geo = new THREE.BoxGeometry(size, height, size);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0e6bcf,
    emissive: 0x0a2c7c,
    metalness: 0.58,
    roughness: 0.27,
  });
  const block = new THREE.Mesh(geo, mat);
  block.castShadow = true;
  block.receiveShadow = true;
  block.position.set(lane, height / 2 - 0.5, -110);
  scene.add(block);
  state.obstacles.push(block);
}

function createMover() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const drone = new THREE.Mesh(droneGeo, droneMat.clone());
  drone.castShadow = true;
  drone.position.set(lane, 2.2, -105);
  drone.userData = {
    sway: (Math.random() * 1.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
    phase: Math.random() * Math.PI * 2,
    lane,
  };
  scene.add(drone);
  state.movers.push(drone);
}

function createOrb() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const orb = new THREE.Mesh(orbGeo, orbMat.clone());
  orb.position.set(lane, 2, -95);
  orb.castShadow = true;
  scene.add(orb);
  state.orbs.push(orb);
}

function resetGame() {
  [...state.obstacles, ...state.movers, ...state.orbs].forEach((o) => scene.remove(o));
  state.obstacles = [];
  state.movers = [];
  state.orbs = [];
  state.laneIndex = 1;
  state.baseSpeed = 30;
  state.speed = 30;
  state.jumpVelocity = 0;
  state.spawnCooldown = 0;
  state.moverCooldown = 2;
  state.orbCooldown = 1;
  state.score = 0;
  state.distance = 0;
  state.focus = 100;
  state.focusActive = false;
  state.combo = 1;
  state.comboTimer = 0;
  state.difficulty = 0;
  state.danger = 0;
  state.alive = true;
  state.paused = false;
  statusEl.textContent = "Running";
  player.position.set(lanes[state.laneIndex], 1.3, 8);
}

function moveLane(direction) {
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + direction, 0, lanes.length - 1);
  player.position.x = lanes[state.laneIndex];
}

function jump() {
  if (player.position.y <= 1.31) {
    state.jumpVelocity = 16.5;
  }
}

function togglePause() {
  if (!state.alive) return;
  state.paused = !state.paused;
  statusEl.textContent = state.paused ? "Paused" : "Running";
}

function toggleFocus() {
  if (!state.alive) return;
  if (!state.focusActive && state.focus <= 20) return;
  state.focusActive = !state.focusActive;
}

function updatePlayer(delta, timeScale) {
  state.jumpVelocity += state.gravity * delta * timeScale;
  player.position.y += state.jumpVelocity * delta * timeScale;

  if (player.position.y <= 1.3) {
    player.position.y = 1.3;
    state.jumpVelocity = 0;
  }
}

function updateObstacles(delta, timeScale) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const toRemove = [];

  state.obstacles.forEach((obstacle) => {
    obstacle.position.z += state.speed * delta * timeScale;
    tempBox.setFromObject(obstacle);

    if (playerBox.intersectsBox(tempBox)) {
      endGame();
    }

    if (obstacle.position.z > 22) toRemove.push(obstacle);
  });

  toRemove.forEach((o) => {
    scene.remove(o);
    state.obstacles.splice(state.obstacles.indexOf(o), 1);
  });
}

function updateMovers(delta, timeScale) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const toRemove = [];

  state.movers.forEach((drone) => {
    drone.userData.phase += delta * 2.4 * timeScale;
    drone.position.x = drone.userData.lane + Math.sin(drone.userData.phase) * drone.userData.sway;
    drone.position.z += state.speed * delta * timeScale * 1.08;
    drone.rotation.y += delta * 2 * timeScale;

    tempBox.setFromObject(drone);
    if (playerBox.intersectsBox(tempBox)) endGame();
    if (drone.position.z > 24) toRemove.push(drone);
  });

  toRemove.forEach((o) => {
    scene.remove(o);
    state.movers.splice(state.movers.indexOf(o), 1);
  });
}

function updateOrbs(delta, timeScale) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const toRemove = [];

  state.orbs.forEach((orb) => {
    orb.position.z += state.speed * delta * timeScale;
    orb.rotation.y += delta * 2.6 * timeScale;
    tempBox.setFromObject(orb);

    if (playerBox.intersectsBox(tempBox)) {
      state.score += 35 * state.combo;
      state.combo = Math.min(6, state.combo + 1);
      state.comboTimer = 4;
      state.focus = Math.min(100, state.focus + 14);
      toRemove.push(orb);
    }

    if (orb.position.z > 22) toRemove.push(orb);
  });

  toRemove.forEach((o) => {
    scene.remove(o);
    const idx = state.orbs.indexOf(o);
    if (idx >= 0) state.orbs.splice(idx, 1);
  });
}

function updateDifficulty(delta, timeScale) {
  state.difficulty = Math.min(1, state.distance / 1200);
  const targetSpeed = state.baseSpeed + state.difficulty * (state.maxSpeed - state.baseSpeed);
  state.speed = THREE.MathUtils.lerp(state.speed, targetSpeed, 0.07 * timeScale);

  if (state.focusActive) {
    state.focus = Math.max(0, state.focus - delta * 28);
    if (state.focus <= 0) state.focusActive = false;
  } else {
    state.focus = Math.min(100, state.focus + delta * 14);
  }

  if (state.combo > 1) {
    state.comboTimer -= delta * timeScale;
    if (state.comboTimer <= 0) {
      state.combo = Math.max(1, state.combo - 1);
      state.comboTimer = 2.5;
    }
  }

  const pressure = (state.obstacles.length + state.movers.length * 1.5) / 8;
  const speedFactor = (state.speed - state.baseSpeed) / (state.maxSpeed - state.baseSpeed);
  state.danger = THREE.MathUtils.clamp((pressure + speedFactor) * 0.7, 0, 1);
}

function endGame() {
  if (!state.alive) return;
  state.alive = false;
  statusEl.textContent = "Game Over — הקש Enter או R";
}

function updateUI() {
  scoreEl.textContent = Math.floor(state.score);
  distanceEl.textContent = Math.floor(state.distance);
  comboEl.textContent = `x${state.combo.toFixed(1)}`;
  focusBar.style.width = `${state.focus.toFixed(1)}%`;
  difficultyBar.style.width = `${(state.difficulty * 100).toFixed(1)}%`;
  dangerBar.style.width = `${(state.danger * 100).toFixed(1)}%`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const timeScale = state.focusActive ? 0.55 : 1;

  stars.rotation.y += delta * 0.04;
  trail.position.copy(player.position);

  if (state.alive && !state.paused) {
    state.spawnCooldown -= delta;
    state.moverCooldown -= delta;
    state.orbCooldown -= delta;

    if (state.spawnCooldown <= 0) {
      createObstacle();
      state.spawnCooldown = THREE.MathUtils.lerp(1, 0.65, state.difficulty);
    }

    if (state.moverCooldown <= 0) {
      createMover();
      state.moverCooldown = THREE.MathUtils.lerp(3, 1.6, state.difficulty);
    }

    if (state.orbCooldown <= 0) {
      createOrb();
      state.orbCooldown = THREE.MathUtils.lerp(1.6, 0.9, state.difficulty);
    }

    updatePlayer(delta, timeScale);
    updateObstacles(delta, timeScale);
    updateMovers(delta, timeScale);
    updateOrbs(delta, timeScale);
    updateDifficulty(delta, timeScale);

    const scoreBoost = 32 + state.difficulty * 36;
    state.score += delta * timeScale * scoreBoost * state.combo * (state.focusActive ? 1.35 : 1);
    state.distance += delta * timeScale * state.speed;
  }

  const targetX = player.position.x * 0.28;
  const targetTilt = THREE.MathUtils.degToRad(player.position.x * 0.35);
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
  camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetTilt, 0.08);
  camera.lookAt(new THREE.Vector3(0, 2, -34));

  updateUI();
  renderer.render(scene, camera);
}

function handleKey(event) {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") moveLane(-1);
  if (key === "arrowright" || key === "d") moveLane(1);
  if (key === "arrowup" || key === "w" || key === " ") jump();
  if (key === "p") togglePause();
  if (key === "f") toggleFocus();
  if (key === "r") resetGame();
  if (!state.alive && key === "enter") resetGame();
}

window.addEventListener("keydown", handleKey);
resetButton.addEventListener("click", resetGame);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

statusEl.textContent = "Ready";
resetGame();
animate();
