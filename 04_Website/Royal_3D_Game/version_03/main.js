const canvas = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#031033');
scene.fog = new THREE.Fog(0x05163d, 18, 200);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 9, -18);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambient = new THREE.HemisphereLight(0x6a0dad, 0x000000, 0.8);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.25);
dirLight.position.set(-9, 14, -14);
scene.add(dirLight);

const backLight = new THREE.PointLight(0x6a0dad, 0.45, 120, 2);
backLight.position.set(0, 12, 40);
scene.add(backLight);

// Runway
const runwayLength = 440;
const runwayGeometry = new THREE.PlaneGeometry(12, runwayLength);
const runwayMaterial = new THREE.MeshStandardMaterial({
  color: '#0b225f',
  emissive: '#001a44',
  metalness: 0.2,
  roughness: 0.45,
});
const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
runway.rotation.x = -Math.PI / 2;
runway.position.z = -14;
scene.add(runway);

// Lane markers
const markerGeometry = new THREE.BoxGeometry(0.2, 0.12, 2.6);
const markerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffd700',
  emissive: '#6a0dad',
  emissiveIntensity: 0.35,
});
for (let i = 0; i < 85; i += 1) {
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(0, 0.06, i * -5.1);
  scene.add(marker);
}

// Player
const playerGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#6a0dad',
  emissiveIntensity: 0.22,
  roughness: 0.32,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.9, -190);
scene.add(player);

const edgeGeometry = new THREE.EdgesGeometry(playerGeometry);
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#ffd700', linewidth: 2 });
const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
player.add(edgeLines);

// Collectibles
const crowns = [];
const crownGeometry = new THREE.TorusKnotGeometry(0.55, 0.16, 64, 8, 2, 3);
const crownMaterial = new THREE.MeshStandardMaterial({
  color: '#ffd700',
  emissive: '#ffd700',
  emissiveIntensity: 0.45,
  metalness: 0.85,
  roughness: 0.18,
});

function spawnCrowns(count = 24) {
  crowns.length = 0;
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(crownGeometry, crownMaterial.clone());
    mesh.position.set(
      THREE.MathUtils.randFloat(-3.5, 3.5),
      1.5,
      THREE.MathUtils.randFloatSpread(runwayLength - 40) - 40
    );
    mesh.userData.phase = Math.random() * Math.PI * 2;
    mesh.userData.collected = false;
    scene.add(mesh);
    crowns.push(mesh);
  }
}

// Hazards
const hazards = [];
const spikeGeometry = new THREE.ConeGeometry(0.7, 2.4, 10);
const spikeMaterial = new THREE.MeshStandardMaterial({
  color: '#0b0b0b',
  emissive: '#b00020',
  emissiveIntensity: 0.15,
  metalness: 0.4,
  roughness: 0.55,
});

function spawnHazards(count = 14) {
  hazards.length = 0;
  for (let i = 0; i < count; i += 1) {
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial.clone());
    spike.position.set(
      THREE.MathUtils.randFloat(-3.6, 3.6),
      1.2,
      THREE.MathUtils.randFloatSpread(runwayLength - 80) - 40
    );
    spike.rotation.y = Math.random() * Math.PI;
    spike.userData.phase = Math.random() * Math.PI * 2;
    spike.userData.pulse = Math.random() * 0.25 + 0.75;
    scene.add(spike);
    hazards.push(spike);
  }
}

// Input & movement
const input = { forward: false, back: false, left: false, right: false };
let velocityY = 0;
const speed = 0.28;
const gravity = -0.02;
const jumpForce = 0.38;

// Game state
const targetScore = 120;
let score = 0;
let timeLeft = 60;
let isRunning = true;
let lastTime = performance.now() / 1000;
let orbitYaw = Math.PI;
let orbitPitch = 0.35;
let lastMouse = null;

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const restartBtn = document.getElementById('restart');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(value) {
  return value.toFixed(1);
}

function updateHUD() {
  scoreEl.textContent = `Score: ${score} / ${targetScore}`;
  timerEl.textContent = `Time: ${formatTime(timeLeft)}s`;
}

function showOverlay(title, subtitle) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function endRun(title, subtitle) {
  isRunning = false;
  showOverlay(title, subtitle);
}

function resetRun() {
  score = 0;
  timeLeft = 60;
  isRunning = true;
  velocityY = 0;
  player.position.set(0, 0.9, -190);
  crowns.forEach((crown) => {
    crown.position.set(
      THREE.MathUtils.randFloat(-3.5, 3.5),
      1.5,
      THREE.MathUtils.randFloatSpread(runwayLength - 40) - 40
    );
    crown.userData.phase = Math.random() * Math.PI * 2;
    crown.userData.collected = false;
    crown.visible = true;
  });
  hazards.forEach((hazard) => {
    hazard.position.set(
      THREE.MathUtils.randFloat(-3.6, 3.6),
      1.2,
      THREE.MathUtils.randFloatSpread(runwayLength - 80) - 40
    );
    hazard.userData.phase = Math.random() * Math.PI * 2;
    hazard.visible = true;
  });
  hideOverlay();
  updateHUD();
}

function attemptJump() {
  const onGround = player.position.y <= 0.9 + 0.01;
  if (onGround) {
    velocityY = jumpForce;
  }
}

function onKeyChange(event, isDown) {
  if (event.code === 'KeyW') input.forward = isDown;
  if (event.code === 'KeyS') input.back = isDown;
  if (event.code === 'KeyA') input.left = isDown;
  if (event.code === 'KeyD') input.right = isDown;
  if (event.code === 'Space' && isDown) attemptJump();
  if (event.code === 'KeyR' && isDown) resetRun();
}

window.addEventListener('keydown', (e) => onKeyChange(e, true));
window.addEventListener('keyup', (e) => onKeyChange(e, false));

restartBtn.addEventListener('click', resetRun);

canvas.addEventListener('mousedown', (e) => { lastMouse = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('mouseup', () => { lastMouse = null; });
canvas.addEventListener('mousemove', (e) => {
  if (lastMouse && !isRunning) {
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    orbitYaw -= dx * 0.005;
    orbitPitch = clamp(orbitPitch - dy * 0.004, -0.6, 1.0);
    lastMouse = { x: e.clientX, y: e.clientY };
  }
});

function updatePlayer(delta) {
  const moveStep = speed * (delta * 60);
  if (input.forward) player.position.z += moveStep;
  if (input.back) player.position.z -= moveStep * 0.6;
  if (input.left) player.position.x -= moveStep * 0.8;
  if (input.right) player.position.x += moveStep * 0.8;

  velocityY += gravity * (delta * 60);
  player.position.y += velocityY * (delta * 60);
  if (player.position.y < 0.9) {
    player.position.y = 0.9;
    velocityY = 0;
  }

  player.position.x = clamp(player.position.x, -4.6, 4.6);
  player.position.z = clamp(player.position.z, -runwayLength / 2 + 10, 34);
}

function updateCrowns(elapsed) {
  crowns.forEach((crown) => {
    if (!crown.visible) return;
    crown.rotation.y += 0.022;
    crown.position.y = 1.5 + Math.sin(elapsed + crown.userData.phase) * 0.38;
    const distance = crown.position.distanceTo(player.position);
    if (distance < 1.6 && isRunning) {
      crown.userData.collected = true;
      crown.visible = false;
      score += 10;
      updateHUD();
    }
  });
}

function updateHazards(elapsed) {
  hazards.forEach((hazard) => {
    hazard.rotation.y += 0.01;
    hazard.position.y = 1.2 + Math.sin(elapsed + hazard.userData.phase) * 0.08;
    const emissive = hazard.material.emissive;
    const pulse = 0.15 + (Math.sin(elapsed * 3 + hazard.userData.phase) + 1) * 0.1;
    emissive.setRGB(0.69 * pulse, 0, 0.12 * pulse);

    const distance = hazard.position.distanceTo(player.position);
    if (distance < 1.45 && isRunning) {
      endRun('You were struck!', 'A crimson spike claimed your run. Press restart to try again.');
    }
  });
}

function updateTimer(delta) {
  if (!isRunning) return;
  timeLeft = Math.max(0, timeLeft - delta);
  updateHUD();
  if (timeLeft === 0) {
    endRun('Time is up', 'Your royal sprint faded. Restart to chase the crowns again.');
  }
}

function checkWinCondition() {
  if (isRunning && score >= targetScore) {
    endRun('Victory!', 'You gathered enough crowns. Orbit the camera, then restart to set a faster time.');
  }
}

function updateCamera(delta) {
  if (isRunning) {
    const targetPosition = new THREE.Vector3(
      player.position.x * 0.55,
      8.6,
      player.position.z - 14
    );
    camera.position.lerp(targetPosition, 1 - Math.pow(0.92, delta * 60));
    camera.lookAt(player.position.x, player.position.y + 1.3, player.position.z + 10);
  } else {
    const radius = 18;
    const x = player.position.x + radius * Math.sin(orbitYaw) * Math.cos(orbitPitch);
    const y = player.position.y + 6 + radius * Math.sin(orbitPitch);
    const z = player.position.z + radius * Math.cos(orbitYaw) * Math.cos(orbitPitch);
    camera.position.set(x, y, z);
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  }
}

function animate() {
  const now = performance.now() / 1000;
  const delta = Math.min(0.05, now - lastTime);
  lastTime = now;
  const elapsed = now;

  if (isRunning) {
    updatePlayer(delta);
    updateTimer(delta);
  }
  updateCrowns(elapsed);
  updateHazards(elapsed);
  updateCamera(delta);
  checkWinCondition();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);
spawnCrowns();
spawnHazards();
updateHUD();
hideOverlay();
animate();
