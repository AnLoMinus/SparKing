const canvas = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#041034');
scene.fog = new THREE.Fog(0x061a55, 20, 200);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 9, -16);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambient = new THREE.HemisphereLight(0x6a0dad, 0x000000, 0.65);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.1);
dirLight.position.set(-7, 12, -14);
scene.add(dirLight);

// Runway
const runwayLength = 420;
const runwayGeometry = new THREE.PlaneGeometry(12, runwayLength);
const runwayMaterial = new THREE.MeshStandardMaterial({
  color: '#0a1f63',
  emissive: '#00163f',
  metalness: 0.15,
  roughness: 0.5,
});
const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
runway.rotation.x = -Math.PI / 2;
runway.position.z = -10;
scene.add(runway);

// Lane markers
const markerGeometry = new THREE.BoxGeometry(0.2, 0.1, 2.6);
const markerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffd700',
  emissive: '#6a0dad',
  emissiveIntensity: 0.35,
});
for (let i = 0; i < 80; i += 1) {
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(0, 0.06, i * -5.2);
  scene.add(marker);
}

// Player
const playerGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#6a0dad',
  emissiveIntensity: 0.2,
  roughness: 0.35,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.9, -180);
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
  roughness: 0.2,
});

function spawnCrowns(count = 18) {
  crowns.length = 0;
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(crownGeometry, crownMaterial.clone());
    mesh.position.set(
      THREE.MathUtils.randFloat(-3.5, 3.5),
      1.4,
      THREE.MathUtils.randFloatSpread(runwayLength - 40) - 40
    );
    mesh.userData.phase = Math.random() * Math.PI * 2;
    mesh.userData.collected = false;
    scene.add(mesh);
    crowns.push(mesh);
  }
}

// Input & movement
const input = { forward: false, back: false, left: false, right: false, jump: false };
let velocityY = 0;
const speed = 0.26;
const gravity = -0.018;
const jumpForce = 0.36;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function attemptJump() {
  const onGround = player.position.y <= 0.9 + 0.01;
  if (onGround) {
    velocityY = jumpForce;
  }
}

// Score
const scoreEl = document.getElementById('score');
let score = 0;

function updateScoreDisplay() {
  scoreEl.textContent = `Score: ${score}`;
}

function collectCrown(crown) {
  if (crown.userData.collected) return;
  crown.userData.collected = true;
  crown.visible = false;
  score += 10;
  updateScoreDisplay();
}

function resetRun() {
  score = 0;
  velocityY = 0;
  player.position.set(0, 0.9, -180);
  crowns.forEach((crown) => {
    crown.position.set(
      THREE.MathUtils.randFloat(-3.5, 3.5),
      1.4,
      THREE.MathUtils.randFloatSpread(runwayLength - 40) - 40
    );
    crown.userData.phase = Math.random() * Math.PI * 2;
    crown.userData.collected = false;
    crown.visible = true;
  });
  updateScoreDisplay();
}

function updatePlayer() {
  if (input.forward) player.position.z += speed;
  if (input.back) player.position.z -= speed * 0.65;
  if (input.left) player.position.x -= speed * 0.8;
  if (input.right) player.position.x += speed * 0.8;

  velocityY += gravity;
  player.position.y += velocityY;
  if (player.position.y < 0.9) {
    player.position.y = 0.9;
    velocityY = 0;
  }

  player.position.x = clamp(player.position.x, -4.5, 4.5);
  player.position.z = clamp(player.position.z, -runwayLength / 2 + 10, 30);
}

function updateCrowns(elapsed) {
  crowns.forEach((crown) => {
    if (!crown.visible) return;
    crown.rotation.y += 0.02;
    crown.position.y = 1.4 + Math.sin(elapsed + crown.userData.phase) * 0.35;

    const distance = crown.position.distanceTo(player.position);
    if (distance < 1.6) {
      collectCrown(crown);
    }
  });
}

function updateCamera() {
  const targetPosition = new THREE.Vector3(
    player.position.x * 0.5,
    8,
    player.position.z - 13
  );
  camera.position.lerp(targetPosition, 0.08);
  camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z + 8);
}

function animate() {
  const elapsed = performance.now() * 0.001;
  updatePlayer();
  updateCrowns(elapsed);
  updateCamera();
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
updateScoreDisplay();
animate();
