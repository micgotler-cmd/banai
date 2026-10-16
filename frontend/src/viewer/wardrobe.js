import * as THREE from 'three';
import { COLORS } from '../catalog.js';

const T = 1.8; // panel thickness, cm (prototype value)
const DRAWER_H = 18;
const m = (cm) => cm / 100;

const EDGE = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 });

function box(w, h, d, x, y, z, material, { edges = true, shadow = true } = {}) {
  const geo = new THREE.BoxGeometry(m(w), m(h), m(d));
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(m(x), m(y), m(z));
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), EDGE));
  return mesh;
}

// Builds the wardrobe from the design state. Origin: centre of the floor footprint.
export function buildWardrobe(design, { showDoors }) {
  const root = new THREE.Group();
  const hex = COLORS.find((c) => c.id === design.color)?.hex ?? '#f4f4f2';
  const roughness = design.material === 'lacquer' ? 0.25 : design.material === 'veneer' ? 0.7 : 0.55;
  const shell = new THREE.MeshStandardMaterial({ color: hex, roughness });
  const { width: W, height: H, depth: D } = design;
  const handle = new THREE.MeshStandardMaterial({ color: '#8e8e93', metalness: 0.9, roughness: 0.25 });

  const groups = new Map();
  const group = (id) => {
    const g = new THREE.Group();
    g.userData.id = id;
    groups.set(id, g);
    root.add(g);
    return g;
  };

  const body = group('body');
  body.add(box(T, H, D, -W / 2 + T / 2, H / 2, 0, shell));
  body.add(box(T, H, D, W / 2 - T / 2, H / 2, 0, shell));
  body.add(box(W, T, D, 0, H - T / 2, 0, shell));
  body.add(box(W, T, D, 0, T / 2, 0, shell));
  body.add(box(W - 2 * T, H - 2 * T, 0.6, 0, H / 2, -D / 2 + 0.3, shell));

  const n = design.compartments.length;
  const iw = (W - 2 * T - (n - 1) * T) / n;
  const ih = H - 2 * T;
  design.compartments.forEach((c, i) => {
    const g = group(c.id);
    const cx = -W / 2 + T + iw / 2 + i * (iw + T);
    if (i < n - 1) body.add(box(T, ih, D, cx + iw / 2 + T / 2, H / 2, 0, shell));

    const drawersH = c.drawers * DRAWER_H;
    for (let k = 0; k < c.drawers; k++) {
      const y = T + DRAWER_H * k + DRAWER_H / 2;
      g.add(box(iw - 0.6, DRAWER_H - 0.6, D - 4, cx, y, 1, shell));
      g.add(box(Math.min(24, iw * 0.4), 1, 1.2, cx, y + 3, D / 2 - 1, handle, { edges: false }));
    }
    const top = T + drawersH;
    const free = H - T - top;
    for (let k = 1; k <= c.shelves; k++) {
      g.add(box(iw, T, D - 2, cx, top + (free / (c.shelves + 1)) * k, 0.5, shell));
    }
    if (c.rail) {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(m(1.2), m(1.2), m(iw), 24),
        new THREE.MeshStandardMaterial({ color: '#c7cad0', metalness: 0.9, roughness: 0.2 }),
      );
      rail.castShadow = true;
      rail.rotation.z = Math.PI / 2;
      rail.position.set(m(cx), m(H - 12), 0);
      g.add(rail);
    }
  });

  if (showDoors && design.doors.count > 0) {
    const g = group('doors');
    const dm = new THREE.MeshStandardMaterial({ color: hex, roughness, transparent: true, opacity: 0.32, depthWrite: false });
    const cnt = design.doors.count;
    const dw = W / cnt;
    for (let i = 0; i < cnt; i++) {
      const x = -W / 2 + dw / 2 + i * dw;
      const z = design.doors.type === 'sliding' ? D / 2 + 1 + (i % 2) * 2 : D / 2 + 1;
      g.add(box(dw - 0.4, H - 1, 1.8, x, H / 2, z, dm, { shadow: false }));
      const side = i % 2 === 0 ? 1 : -1;
      g.add(box(1, 14, 1.4, x + side * (dw / 2 - 4), H * 0.45, z + 1.4, handle, { edges: false, shadow: false }));
    }
  }
  return { root, groups };
}
