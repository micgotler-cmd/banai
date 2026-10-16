import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWardrobe } from './wardrobe.js';

const HIGHLIGHT = new THREE.Color("#c9953f");

export function createViewer(container, store, overlay) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Soft studio light: image-based environment + one shadow-casting key light.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 5;
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 96), new THREE.MeshStandardMaterial({ color: 0xd9d9df, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.001;
  floor.receiveShadow = true;
  scene.add(floor);
  // Fade the floor edge into the background.
  floor.material.transparent = true;
  floor.material.alphaMap = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.55, '#fff'); grad.addColorStop(1, '#000');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 1.5;
  controls.maxDistance = 14;

  // Frame the whole wardrobe; keeps the user's viewing direction unless `reset`.
  const dir = new THREE.Vector3(0.55, 0.32, 0.77).normalize();
  function frame(reset) {
    const { width: W, height: H, depth: D } = store.design;
    const size = Math.max(W, H, D * 1.5) / 100;
    const dist = (size * 0.95) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const look = new THREE.Vector3(0, H / 200, 0);
    const d = reset ? dir : camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(look);
    camera.position.copy(look).addScaledVector(d, dist);
    controls.update();
  }

  let current = null;
  let showDoors = true;
  let hoverId = null;
  const raycaster = new THREE.Raycaster();
  const pick = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1),
      camera,
    );
    const hit = raycaster.intersectObjects(current.root.children, true)[0];
    let o = hit?.object;
    while (o && !o.userData.id) o = o.parent;
    return o ? o.userData.id : null;
  };

  function paintSelection() {
    if (!current) return;
    current.groups.forEach((g, id) => {
      const on = id === store.selectedId;
      const hover = !on && id === hoverId;
      g.traverse((o) => {
        if (!o.isMesh || !o.material.emissive) return;
        o.material.emissive = on || hover ? HIGHLIGHT : new THREE.Color(0x000000);
        o.material.emissiveIntensity = on ? 0.4 : hover ? 0.14 : 0;
      });
    });
  }

  function rebuild() {
    if (current) {
      scene.remove(current.root);
      current.root.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); }
      });
    }
    current = buildWardrobe(store.design, { showDoors });
    scene.add(current.root);
    paintSelection();
  }

  // Click (not drag) selects a component.
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    store.select(pick(e));
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    const id = pick(e);
    if (id !== hoverId) { hoverId = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; paintSelection(); }
  });

  // Dimension chips, projected to screen each frame.
  const chips = {
    w: overlay.querySelector('[data-dim="w"]'),
    h: overlay.querySelector('[data-dim="h"]'),
    d: overlay.querySelector('[data-dim="d"]'),
  };
  const v = new THREE.Vector3();
  function place(chip, x, y, z, text) {
    v.set(x, y, z).project(camera);
    chip.textContent = text;
    chip.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * container.clientWidth}px, ${((1 - v.y) / 2) * container.clientHeight}px)`;
  }

  const resize = () => {
    const { clientWidth, clientHeight } = container;
    renderer.setSize(clientWidth, clientHeight);
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    const { width: W, height: H, depth: D } = store.design;
    place(chips.w, 0, -0.06, D / 200 + 0.06, `${W} cm`);
    place(chips.h, -W / 200 - 0.08, H / 200, D / 200, `${H} cm`);
    place(chips.d, W / 200 + 0.08, -0.06, 0, `${D} cm`);
    renderer.render(scene, camera);
  });

  let lastRevision = store.revision;
  let lastDims = '';
  const dims = () => `${store.design.width}x${store.design.height}x${store.design.depth}`;
  store.subscribe(() => {
    if (store.revision !== lastRevision) {
      lastRevision = store.revision;
      rebuild();
      if (dims() !== lastDims) { lastDims = dims(); frame(false); }
    } else { paintSelection(); }
  });
  lastDims = dims();
  rebuild();
  frame(true);

  return {
    setShowDoors(on) { showDoors = on; rebuild(); },
    resetView() { frame(true); },
  };
}
