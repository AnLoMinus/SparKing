const container = document.getElementById("game");
const scoreEl = document.getElementById("score");
const distanceEl = document.getElementById("distance");
const statusEl = document.getElementById("status");
const resetButton = document.getElementById("resetButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030712);
scene.fog = new THREE.Fog(0x030712, 8, 140);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7, 12);
camera.lookAt(0, 2, -14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(0x19255a, 0x050505, 0.9);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.15);
dirLight.position.set(8, 14, 6);
dirLight.castShadow = true;
scene.add(dirLight);

const backLight = new THREE.PointLight(0x6a0dad, 0.55, 60);
backLight.position.set(-6, 6, -18);
scene.add(backLight);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x020b2b,
  roughness: 0.6,
  metalness: 0.1,
});

const groundGeometry = new THREE.BoxGeometry(20, 1, 200);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
ground.position.set(0, -0.8, -40);
scene.add(ground);

const laneMaterial = new THREE.LineBasicMaterial({ color: 0x143b74, transparent: true, opacity: 0.35 });
const laneGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-6.5, 0.05, 60),
  new THREE.Vector3(-6.5, 0.05, -120),
]);
scene.add(new THREE.Line(laneGeometry, laneMaterial));
scene.add(new THREE.Line(laneGeometry.clone().translate(6.5 * 2, 0, 0), laneMaterial.clone()));
scene.add(new THREE.Line(laneGeometry.clone().translate(6.5, 0, 0), laneMaterial.clone()));

const trackGlow = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2, 0.2, 220, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x0d6efd, transparent: true, opacity: 0.12 })
);
trackGlow.rotation.z = Math.PI / 2;
trackGlow.position.y = -0.1;
scene.add(trackGlow);

const playerGeometry = new THREE.SphereGeometry(1.2, 24, 24);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  emissive: 0x7a5b00,
  metalness: 0.85,
  roughness: 0.35,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
player.position.set(0, 1.2, 6);
scene.add(player);

const lanes = [-6, 0, 6];
const clock = new THREE.Clock();
const tempPlayerBox = new THREE.Box3();
const tempObstacleBox = new THREE.Box3();

const state = {
  laneIndex: 1,
  speed: 30,
  jumpVelocity: 0,
  gravity: -36,
  obstacles: [],
  spawnCooldown: 0,
  spawnRate: 1.2,
  score: 0,
  distance: 0,
  alive: true,
};

function createObstacle() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const size = THREE.MathUtils.randFloat(1.8, 3.2);
  const height = THREE.MathUtils.randFloat(2.2, 4.5);
  const geometry = new THREE.BoxGeometry(size, height, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0e6ac1,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x082c74,
  });
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.castShadow = true;
  obstacle.receiveShadow = true;
  obstacle.position.set(lane, height / 2 - 0.5, -90);
  scene.add(obstacle);
  state.obstacles.push(obstacle);
}

function resetGame() {
  state.obstacles.forEach((o) => scene.remove(o));
  state.obstacles = [];
  state.laneIndex = 1;
  state.speed = 30;
  state.jumpVelocity = 0;
  state.spawnCooldown = 0;
  state.score = 0;
  state.distance = 0;
  state.alive = true;
  statusEl.textContent = "Running";
  player.position.set(lanes[state.laneIndex], 1.2, 6);
}

function moveLane(direction) {
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + direction, 0, lanes.length - 1);
  player.position.x = lanes[state.laneIndex];
}

function jump() {
  if (player.position.y <= 1.21) {
    state.jumpVelocity = 16;
  }
}

function updatePlayer(delta) {
  state.jumpVelocity += state.gravity * delta;
  player.position.y += state.jumpVelocity * delta;

  if (player.position.y <= 1.2) {
    player.position.y = 1.2;
    state.jumpVelocity = 0;
  }
}

function updateObstacles(delta) {
  const playerBox = tempPlayerBox.setFromObject(player);
  const remove = [];

  state.obstacles.forEach((obstacle) => {
    obstacle.position.z += state.speed * delta;
    tempObstacleBox.setFromObject(obstacle);

    if (playerBox.intersectsBox(tempObstacleBox)) {
      endGame();
    }

    if (obstacle.position.z > 18) {
      remove.push(obstacle);
    }
  });

  remove.forEach((o) => {
    scene.remove(o);
    state.obstacles.splice(state.obstacles.indexOf(o), 1);
  });
}

function endGame() {
  if (!state.alive) return;
  state.alive = false;
  statusEl.textContent = "Game Over — הקש Enter או R";
}

function updateUI() {
  scoreEl.textContent = Math.floor(state.score);
  distanceEl.textContent = Math.floor(state.distance);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (state.alive) {
    state.spawnCooldown -= delta;
    if (state.spawnCooldown <= 0) {
      createObstacle();
      state.spawnCooldown = state.spawnRate;
    }

    updatePlayer(delta);
    updateObstacles(delta);
    state.score += delta * 28;
    state.distance += delta * state.speed;
  }

  const desiredCameraX = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.25, 0.08);
  camera.position.x = desiredCameraX;
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
