import { expect, openDesigner, test } from './fixtures.js';

const COLOURS = [
  { name: 'Navy blue', hex: '1f3a5f', id: 'navy_blue' },
  { name: 'Sage green', hex: '8a9a7b', id: 'sage_green' },
  { name: 'Terracotta', hex: 'b5603f', id: 'terracotta' },
];

test.describe('new catalog colours and material', () => {
  test('appear in the editor, change the 3D model, and reach the order summary', async ({ page }) => {
    await openDesigner(page);
    const panel = page.locator('#properties-panel');

    // Editor: the catalog is served by the backend and lists the new entries.
    for (const { name } of COLOURS) await expect(panel.getByRole('button', { name, exact: true }).first()).toBeVisible();
    const materialSelect = panel.getByRole('combobox').filter({ has: page.locator('option', { hasText: 'Birch plywood' }) }).first();
    await expect(materialSelect.locator('option', { hasText: 'Birch plywood' })).toHaveCount(1);

    // Each new colour is selectable, shows as pressed, and recolours the 3D shelf to the catalog hex.
    for (const { name, hex, id } of COLOURS) {
      const swatch = panel.getByRole('button', { name, exact: true }).first();
      await swatch.click();
      await expect(swatch).toHaveAttribute('aria-pressed', 'true');
      const state = await page.evaluate(() => ({
        color: window.__banai.store.getState().design.carcass.appearance.color,
        hex: window.__banai.viewer.meshOf('shf_l1').material.color.getHexString(),
      }));
      expect(state.color).toEqual({ catalogId: id });
      expect(state.hex).toBe(hex);
    }

    // The new material is stored on the design.
    await materialSelect.selectOption({ label: 'Birch plywood' });
    const material = await page.evaluate(() => window.__banai.store.getState().design.carcass.appearance.material);
    expect(material).toEqual({ catalogId: 'birch_plywood' });

    // Confirming the order summarises the same appearance.
    await page.getByTestId('open-order').click();
    await expect(page.getByTestId('order-summary')).toContainText('Birch plywood');
    await expect(page.getByTestId('order-summary')).toContainText('Terracotta');
  });
});
