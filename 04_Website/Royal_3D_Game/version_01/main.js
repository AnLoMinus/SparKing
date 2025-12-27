const canvas = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#041034');
scene.fog = new THREE.Fog(0x05184b, 20, 180);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 8, -14);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambient = new THREE.HemisphereLight(0x6a0dad, 0x000000, 0.5);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.1);
dirLight.position.set(-6, 12, -12);
dirLight.castShadow = false;
scene.add(dirLight);

// Runway
const runwayLength = 400;
const runwayGeometry = new THREE.PlaneGeometry(12, runwayLength);
const runwayMaterial = new THREE.MeshStandardMaterial({
  color: '#0a1f63',
  emissive: '#001b5e',
  roughness: 0.6,
  metalness: 0.1,
});
const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
runway.rotation.x = -Math.PI / 2;
runway.position.z = -20;
scene.add(runway);

// Lane markers
const markerGeometry = new THREE.BoxGeometry(0.2, 0.1, 2.5);
const markerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffd700',
  emissive: '#6a0dad',
  emissiveIntensity: 0.25,
});
for (let i = 0; i < 70; i += 1) {
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(0, 0.06, i * -5.5);
  scene.add(marker);
}

// Player
const playerGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#6a0dad',
  emissiveIntensity: 0.2,
  roughness: 0.45,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.9, -150);
scene.add(player);

const edgeGeometry = new THREE.EdgesGeometry(playerGeometry);
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#ffd700', linewidth: 2 });
const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
player.add(edgeLines);

const input = { forward: false, back: false, left: false, right: false };
const speed = 0.25;

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW') input.forward = true;
  if (event.code === 'KeyS') input.back = true;
  if (event.code === 'KeyA') input.left = true;
  if (event.code === 'KeyD') input.right = true;
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW') input.forward = false;
  if (event.code === 'KeyS') input.back = false;
  if (event.code === 'KeyA') input.left = false;
  if (event.code === 'KeyD') input.right = false;
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updatePlayer() {
  if (input.forward) player.position.z += speed;
  if (input.back) player.position.z -= speed * 0.6;
  if (input.left) player.position.x -= speed * 0.8;
  if (input.right) player.position.x += speed * 0.8;

  player.position.x = clamp(player.position.x, -4.5, 4.5);
  player.position.z = clamp(player.position.z, -runwayLength / 2 + 10, 30);
}

function updateCamera() {
  const targetPosition = new THREE.Vector3(
    player.position.x * 0.5,
    7,
    player.position.z - 12
  );
  camera.position.lerp(targetPosition, 0.08);
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z + 6);
}

function animate() {
  updatePlayer();
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
animate();
