import { LIMITS, clamp } from './catalog.js';

// Single local source of truth (units: cm). Independent of Three.js.
export function basicWardrobe() {
  return {
    width: 200, height: 240, depth: 60,
    material: 'laminate', color: 'white',
    doors: { type: 'hinged', count: 2 },
    compartments: [
      { id: 'c1', shelves: 4, drawers: 0, rail: false },
      { id: 'c2', shelves: 1, drawers: 0, rail: true },
      { id: 'c3', shelves: 0, drawers: 3, rail: false },
    ],
  };
}

export function createStore() {
  let design = basicWardrobe();
  let revision = 1;
  let selectedId = null;
  let nextId = 4;
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  function normalize(d) {
    // Reject non-numeric values from any source: fall back to the previous design's value.
    for (const k of ['width', 'height', 'depth']) if (!Number.isFinite(d[k])) d[k] = design[k];
    if (!Number.isFinite(d.doors.count)) d.doors.count = design.doors.count;
    d.compartments.forEach((c) => {
      const prev = design.compartments.find((x) => x.id === c.id);
      for (const k of ['shelves', 'drawers']) if (!Number.isFinite(c[k])) c[k] = prev?.[k] ?? 0;
    });
    d.width = clamp(Math.round(d.width), LIMITS.width);
    d.height = clamp(Math.round(d.height), LIMITS.height);
    d.depth = clamp(Math.round(d.depth), LIMITS.depth);
    d.doors.count = clamp(Math.round(d.doors.count), LIMITS.doors);
    d.compartments.forEach((c) => {
      c.shelves = clamp(Math.round(c.shelves), LIMITS.shelves);
      c.drawers = clamp(Math.round(c.drawers), LIMITS.drawers);
    });
    return d;
  }

  return {
    get design() { return design; },
    get revision() { return revision; },
    get selectedId() { return selectedId; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    select(id) { selectedId = id; emit(); },
    // All edits (manual or approved AI proposals) go through here.
    apply(mutate) {
      const draft = structuredClone(design);
      mutate(draft, () => `c${nextId++}`);
      design = normalize(draft);
      if (selectedId && selectedId.startsWith('c') && !design.compartments.some((c) => c.id === selectedId)) {
        selectedId = null;
      }
      revision += 1;
      emit();
    },
    reset() { design = basicWardrobe(); selectedId = null; nextId = 4; revision += 1; emit(); },
  };
}
