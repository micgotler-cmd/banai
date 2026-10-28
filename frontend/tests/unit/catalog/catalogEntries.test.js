import { describe, expect, it } from 'vitest';
import { applyOps } from '../../../src/domain/apply.js';
import { parseCatalog } from '../../../src/domain/catalog.js';
import { materialOps } from '../../../src/editor/opsFromForm.js';
import { buildPlan } from '../../../src/pdf/buildPlan.js';
import { buildCarpenterPdf } from '../../../src/pdf/buildPdf.js';
import { PDF_STRINGS } from '../../../src/pdf/strings.js';
import { createMaterials } from '../../../src/viewer/materials.js';
import { catalog, design } from '../pdf/fixtures.js';

// The catalog is owned by the backend (backend/app/domain/catalog.json). These tests read that same file,
// so adding an entry there must keep the editor ops, the 3D materials and both PDFs in step.
const NEW_COLOURS = { navy_blue: '2b3a52', sage_green: '8f9e83', sand_beige: 'd9c8ad', terracotta: 'b5603f' };
const NEW_MATERIAL = 'birch_plywood';

const allIds = () => [...catalog.materials, ...catalog.colors, ...catalog.finishes].map((e) => e.id);

describe('catalog data', () => {
  it('parses, has unique ids and the new entries', () => {
    expect(() => parseCatalog(catalog)).not.toThrow();
    expect(new Set(allIds()).size).toBe(allIds().length);
    for (const id of Object.keys(NEW_COLOURS)) expect(catalog.colors.some((c) => c.id === id)).toBe(true);
    expect(catalog.materials.some((m) => m.id === NEW_MATERIAL)).toBe(true);
  });

  it('every catalog id has a Hebrew name for the PDF (drift guard)', () => {
    for (const id of allIds()) expect(PDF_STRINGS.he.catalog[id], `missing Hebrew name for ${id}`).toBeTruthy();
  });
});

describe('editor ops accept the new entries', () => {
  it('sets each new colour and the new material through set_material', () => {
    for (const id of Object.keys(NEW_COLOURS)) {
      const next = applyOps(design, materialOps('carcass', 'color', { catalogId: id }), catalog);
      expect(next.carcass.appearance.color).toEqual({ catalogId: id });
    }
    const next = applyOps(design, materialOps('doors', 'material', { catalogId: NEW_MATERIAL }), catalog);
    expect(next.doors.appearance.material).toEqual({ catalogId: NEW_MATERIAL });
  });

  it('still rejects an unknown catalog id', () => {
    expect(() => applyOps(design, materialOps('carcass', 'color', { catalogId: 'pink' }), catalog)).toThrow();
  });
});

describe('3D materials use the catalog colour', () => {
  it('resolves the exact hex of each new colour', () => {
    const materials = createMaterials(catalog);
    for (const [id, hex] of Object.entries(NEW_COLOURS)) {
      const appearance = { material: { catalogId: NEW_MATERIAL }, color: { catalogId: id }, finish: { catalogId: 'matte' } };
      expect(materials.forAppearance(appearance).color.getHexString()).toBe(hex);
    }
  });
});

describe('PDF shows the new entries in both languages', () => {
  const styled = applyOps(design, [
    ...materialOps('carcass', 'color', { catalogId: 'sage_green' }),
    ...materialOps('carcass', 'material', { catalogId: NEW_MATERIAL }),
    ...materialOps('doors', 'color', { catalogId: 'terracotta' }),
  ], catalog);

  it('plan labels are English and Hebrew', () => {
    const en = buildPlan(styled, catalog, 'en');
    expect(en.carcassLook).toMatch(/Birch plywood/);
    expect(en.carcassLook).toMatch(/Sage green/);
    expect(en.doorsLook).toMatch(/Terracotta/);
    const he = buildPlan(styled, catalog, 'he');
    expect(he.carcassLook).toMatch(/דיקט ליבנה/);
    expect(he.carcassLook).toMatch(/ירוק מרווה/);
    expect(he.doorsLook).toMatch(/טרקוטה/);
  });

  it('builds a PDF in each language without throwing', async () => {
    for (const language of ['en', 'he']) {
      const doc = await buildCarpenterPdf({ design: styled, catalog, imageDataUrl: null, designId: null, date: new Date('2026-10-23'), language });
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
    }
  });
});
