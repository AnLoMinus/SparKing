const container = document.getElementById("game");
const scoreEl = document.getElementById("score");
const distanceEl = document.getElementById("distance");
const streakEl = document.getElementById("streak");
const statusEl = document.getElementById("status");
const energyBar = document.getElementById("energyBar");
const difficultyBar = document.getElementById("difficultyBar");
const resetButton = document.getElementById("resetButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040814);
scene.fog = new THREE.Fog(0x040814, 10, 140);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 8, 14);
camera.lookAt(0, 2, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(0x162467, 0x060606, 0.9);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.15);
dirLight.position.set(10, 18, 8);
dirLight.castShadow = true;
scene.add(dirLight);

const sideLight = new THREE.PointLight(0x8e2de2, 0.55, 70);
sideLight.position.set(-8, 5, -20);
scene.add(sideLight);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x031033,
  roughness: 0.55,
  metalness: 0.1,
});

const groundGeometry = new THREE.BoxGeometry(22, 1, 220);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
ground.position.set(0, -0.9, -50);
scene.add(ground);

const lanes = [-7, 0, 7];
const laneMaterial = new THREE.LineBasicMaterial({ color: 0x1c4ea1, transparent: true, opacity: 0.4 });
const laneGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-7, 0.05, 70),
  new THREE.Vector3(-7, 0.05, -140),
]);
scene.add(new THREE.Line(laneGeometry, laneMaterial));
scene.add(new THREE.Line(laneGeometry.clone().translate(7, 0, 0), laneMaterial.clone()));
scene.add(new THREE.Line(laneGeometry.clone().translate(14, 0, 0), laneMaterial.clone()));

const aura = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 240, 22, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x1138a0, transparent: true, opacity: 0.12 })
);
aura.rotation.z = Math.PI / 2;
aura.position.y = -0.1;
scene.add(aura);

const starGeometry = new THREE.BufferGeometry();
const starCount = 600;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 120;
  starPositions[i * 3 + 1] = Math.random() * 60 + 4;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0x8e2de2, size: 0.6, transparent: true, opacity: 0.7 })
);
scene.add(stars);

const playerGeometry = new THREE.SphereGeometry(1.25, 28, 28);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  emissive: 0x845300,
  metalness: 0.86,
  roughness: 0.32,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
player.position.set(0, 1.25, 6);
scene.add(player);

const collectorGeo = new THREE.SphereGeometry(0.7, 18, 18);
const collectorMat = new THREE.MeshStandardMaterial({ color: 0xffe372, emissive: 0x8e6800, metalness: 0.8, roughness: 0.2 });

const clock = new THREE.Clock();
const tempPlayerBox = new THREE.Box3();
const tempBox = new THREE.Box3();

const state = {
  laneIndex: 1,
  baseSpeed: 28,
  speed: 28,
  maxSpeed: 52,
  jumpVelocity: 0,
  gravity: -36,
  energy: 100,
  streak: 0,
  difficulty: 0,
  obstacles: [],
  collectibles: [],
  spawnCooldown: 0,
  collectibleCooldown: 0,
  score: 0,
  distance: 0,
  alive: true,
  paused: false,
};

function createObstacle() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const size = THREE.MathUtils.randFloat(1.9, 3.4);
  const height = THREE.MathUtils.randFloat(2.4, 4.8);
  const geometry = new THREE.BoxGeometry(size, height, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0c6ac9,
    metalness: 0.55,
    roughness: 0.28,
    emissive: 0x0b2c7a,
  });
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.castShadow = true;
  obstacle.receiveShadow = true;
  obstacle.position.set(lane, height / 2 - 0.5, -95);
  scene.add(obstacle);
  state.obstacles.push(obstacle);
}

function createCollectible() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const orb = new THREE.Mesh(collectorGeo, collectorMat.clone());
  orb.position.set(lane, 1.8, -85);
  orb.castShadow = true;
  scene.add(orb);
  state.collectibles.push(orb);
}

function resetGame() {
  state.obstacles.forEach((o) => scene.remove(o));
  state.collectibles.forEach((o) => scene.remove(o));
  state.obstacles = [];
  state.collectibles = [];
  state.laneIndex = 1;
  state.baseSpeed = 28;
  state.speed = 28;
  state.jumpVelocity = 0;
  state.spawnCooldown = 0;
  state.collectibleCooldown = 0;
  state.score = 0;
  state.distance = 0;
  state.energy = 100;
  state.streak = 0;
  state.difficulty = 0;
  state.alive = true;
  state.paused = false;
  statusEl.textContent = "Running";
  player.position.set(lanes[state.laneIndex], 1.25, 6);
}

function moveLane(direction) {
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + direction, 0, lanes.length - 1);
  player.position.x = lanes[state.laneIndex];
}

function jump() {
  if (player.position.y <= 1.26 && state.energy >= 10) {
    state.jumpVelocity = 16;
    state.energy = Math.max(0, state.energy - 12);
  }
}

function togglePause() {
  if (!state.alive) return;
  state.paused = !state.paused;
  statusEl.textContent = state.paused ? "Paused" : "Running";
}

function updatePlayer(delta) {
  state.jumpVelocity += state.gravity * delta;
  player.position.y += state.jumpVelocity * delta;

  if (player.position.y <= 1.25) {
    player.position.y = 1.25;
    state.jumpVelocity = 0;
  }
}

function updateObstacles(delta) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const toRemove = [];

  state.obstacles.forEach((obstacle) => {
    obstacle.position.z += state.speed * delta;
    tempBox.setFromObject(obstacle);

    if (playerBox.intersectsBox(tempBox)) {
      endGame();
    }

    if (obstacle.position.z > 20) {
      toRemove.push(obstacle);
    }
  });

  toRemove.forEach((o) => {
    scene.remove(o);
    state.obstacles.splice(state.obstacles.indexOf(o), 1);
  });
}

function updateCollectibles(delta) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const toRemove = [];

  state.collectibles.forEach((orb) => {
    orb.position.z += state.speed * delta;
    orb.rotation.y += delta * 2.4;
    tempBox.setFromObject(orb);

    if (playerBox.intersectsBox(tempBox)) {
      state.score += 25 + state.streak * 2;
      state.streak += 1;
      state.energy = Math.min(100, state.energy + 10);
      toRemove.push(orb);
    }

    if (orb.position.z > 18) {
      toRemove.push(orb);
    }
  });

  toRemove.forEach((o) => {
    scene.remove(o);
    const idx = state.collectibles.indexOf(o);
    if (idx >= 0) state.collectibles.splice(idx, 1);
  });
}

function endGame() {
  if (!state.alive) return;
  state.alive = false;
  statusEl.textContent = "Game Over — הקש Enter או R";
}

function updateDifficulty(delta) {
  state.difficulty = Math.min(1, state.distance / 800);
  const targetSpeed = state.baseSpeed + state.difficulty * (state.maxSpeed - state.baseSpeed);
  state.speed = THREE.MathUtils.lerp(state.speed, targetSpeed, 0.08);
  state.energy = Math.min(100, state.energy + delta * 9);
}

function updateUI() {
  scoreEl.textContent = Math.floor(state.score);
  distanceEl.textContent = Math.floor(state.distance);
  streakEl.textContent = state.streak;
  energyBar.style.width = `${state.energy}%`;
  difficultyBar.style.width = `${(state.difficulty * 100).toFixed(1)}%`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  stars.rotation.y += delta * 0.03;

  if (state.alive && !state.paused) {
    state.spawnCooldown -= delta;
    state.collectibleCooldown -= delta;

    if (state.spawnCooldown <= 0) {
      createObstacle();
      state.spawnCooldown = THREE.MathUtils.lerp(1.1, 0.65, state.difficulty);
    }

    if (state.collectibleCooldown <= 0) {
      createCollectible();
      state.collectibleCooldown = THREE.MathUtils.lerp(1.6, 0.9, state.difficulty);
    }

    updatePlayer(delta);
    updateObstacles(delta);
    updateCollectibles(delta);
    updateDifficulty(delta);

    state.score += delta * (30 + state.difficulty * 30);
    state.distance += delta * state.speed;
  }

  const targetX = player.position.x * 0.22;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, state.paused ? 7 : 8, 0.05);
  camera.lookAt(new THREE.Vector3(0, 1.8, -30));

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
