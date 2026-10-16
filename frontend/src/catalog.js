// Predefined catalog (prototype values). Kept separate from rendering.
export const MATERIALS = [
  { id: 'laminate', label: 'Laminate' },
  { id: 'veneer', label: 'Wood veneer' },
  { id: 'lacquer', label: 'Lacquer' },
];

export const COLORS = [
  { id: 'white', label: 'White', hex: '#f4f4f2' },
  { id: 'oak', label: 'Oak', hex: '#c9a577' },
  { id: 'walnut', label: 'Walnut', hex: '#6b4a32' },
  { id: 'gray', label: 'Gray', hex: '#9a9ca0' },
  { id: 'black', label: 'Black', hex: '#2a2a2c' },
];

export const LIMITS = {
  width: [60, 400],
  height: [100, 300],
  depth: [30, 100],
  compartments: [1, 6],
  shelves: [0, 12],
  drawers: [0, 6],
  doors: [0, 8],
};

export const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
