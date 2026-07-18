import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_URL = "./assets/warehouse.glb";

const canvas = document.getElementById("viewer-canvas");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-banner");
const fpsEl = document.getElementById("fps");

// ---- Renderer ----
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---- Scene + sky ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb2d4); // fallback atrás do sky dome

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---- Camera ----
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 2000);
camera.position.set(150, 90, 150);

// ---- Controls ----
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495; // don't go under the ground
controls.minDistance = 8;
controls.maxDistance = 700;
// pan com o botão do meio (clique do scroll); botão direito também faz pan
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN,
};

// ---- Lights ----
const hemi = new THREE.HemisphereLight(0xbfd4ea, 0x4a4438, 1.1);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(90, 130, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 500;
const s = 90;
sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
sun.shadow.bias = -0.0002;
scene.add(sun);
scene.add(sun.target);

// ---- Ground (só sombras; sem grade) ----
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.ShadowMaterial({ opacity: 0.28 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---- Load model ----
let modelCenter = new THREE.Vector3();
let homePos = camera.position.clone();
let homeTarget = new THREE.Vector3();

const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    scene.add(model);
    frameObject(model);
    loadingEl.classList.add("hidden");
  },
  undefined,
  (err) => {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = "Falha ao carregar warehouse.glb — verifique se o arquivo existe em docs/assets/.";
    errorEl.classList.remove("hidden");
  }
);

function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  modelCenter.copy(center);

  // drop model so its base sits on y=0
  obj.position.y -= box.min.y;
  center.y -= box.min.y;

  const radius = Math.max(size.x, size.z) * 0.5;
  const dist = radius / Math.tan((camera.fov * Math.PI) / 360) * 1.5;

  homeTarget.set(center.x, size.y * 0.35, center.z);
  homePos.set(center.x - dist * 0.8, size.y * 1.4 + dist * 0.25, center.z - dist * 0.8);

  sun.target.position.copy(homeTarget);
  ground.position.set(center.x, 0, center.z);

  loadSkyDome(center);
  resetView();
}

// ---- Sky dome (assets/sky_dome_demo.glb: semiesfera unitária com céu baked) ----
function loadSkyDome(center) {
  loader.load("./assets/sky_dome_demo.glb", (gltf) => {
    const dome = gltf.scene;
    dome.traverse((o) => {
      if (o.isMesh) {
        const map = o.material && o.material.map ? o.material.map : null;
        o.material = new THREE.MeshBasicMaterial({
          map: map,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        });
        o.castShadow = false;
        o.receiveShadow = false;
        o.renderOrder = -1; // atrás de tudo
        o.frustumCulled = false;
      }
    });
    dome.scale.setScalar(900); // raio 1 -> 900 m
    dome.position.set(center.x, -1, center.z);
    scene.add(dome);
  }, undefined, (err) => console.warn("sky dome não carregou:", err));
}

function resetView() {
  camera.position.copy(homePos);
  controls.target.copy(homeTarget);
  controls.update();
}

function topView() {
  const r = homePos.distanceTo(homeTarget);
  camera.position.set(homeTarget.x, r * 1.1, homeTarget.z + 0.001);
  controls.target.copy(homeTarget);
  controls.update();
}

// ---- UI ----
document.getElementById("btn-reset").addEventListener("click", resetView);
document.getElementById("btn-top").addEventListener("click", topView);

// ---- Resize ----
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resize);

// ---- Loop ----
let last = performance.now(), frames = 0, acc = 0;
function animate() {
  requestAnimationFrame(animate);
  resize();
  controls.update();
  renderer.render(scene, camera);

  const now = performance.now();
  acc += now - last; frames++; last = now;
  if (acc >= 500) { fpsEl.textContent = Math.round((frames * 1000) / acc) + " fps"; frames = 0; acc = 0; }
}
animate();
