import { COLORS, MATERIALS, LIMITS } from '../catalog.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function numberRow(label, key, value, unit, [min, max]) {
  return `<label class="row"><span class="row-label">${label}</span>
    <span class="field"><input type="number" inputmode="numeric" data-key="${key}" value="${value}" min="${min}" max="${max}" /><span class="unit">${unit}</span></span></label>`;
}

export function mountProperties(el, store) {
  function render() {
    const d = store.design;
    const sel = store.selectedId;
    const selComp = d.compartments.find((c) => c.id === sel);
    const idx = d.compartments.findIndex((c) => c.id === sel);

    el.innerHTML = `
      <h2 class="panel-title">Properties</h2>
      <section class="group"><h3>Overall size</h3><div class="card">
        ${numberRow('Width', 'width', d.width, 'cm', LIMITS.width)}
        ${numberRow('Height', 'height', d.height, 'cm', LIMITS.height)}
        ${numberRow('Depth', 'depth', d.depth, 'cm', LIMITS.depth)}
      </div></section>

      <section class="group"><h3>Doors</h3><div class="card">
        <div class="row"><span class="row-label">Type</span>
          <div class="segmented" role="group" aria-label="Door type">
            ${['hinged', 'sliding'].map((t) => `<button type="button" data-door-type="${t}" aria-pressed="${d.doors.type === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
          </div></div>
        ${numberRow('Count', 'doors', d.doors.count, '', LIMITS.doors)}
      </div></section>

      <section class="group"><h3>Material &amp; color</h3><div class="card">
        <label class="row"><span class="row-label">Material</span>
          <select data-key="material">${MATERIALS.map((m) => `<option value="${m.id}" ${m.id === d.material ? 'selected' : ''}>${m.label}</option>`).join('')}</select></label>
        <div class="row"><span class="row-label">Color</span>
          <div class="swatches">${COLORS.map((c) => `<button type="button" class="swatch" data-color="${c.id}" title="${c.label}" aria-label="${c.label}" aria-pressed="${c.id === d.color}" style="--c:${c.hex}"></button>`).join('')}</div></div>
      </div></section>

      <section class="group"><h3>Compartments</h3><div class="card list">
        ${d.compartments.map((c, i) => `
          <div class="row item ${c.id === sel ? 'selected' : ''}" data-select="${c.id}" tabindex="0" role="button">
            <span class="row-label">Compartment ${i + 1}</span>
            <span class="meta">${c.shelves} shelves${c.drawers ? ` · ${c.drawers} drawers` : ''}${c.rail ? ' · rail' : ''}</span>
          </div>`).join('')}
        <div class="row actions"><button type="button" class="link" data-add ${d.compartments.length >= LIMITS.compartments[1] ? 'disabled' : ''}>Add compartment</button></div>
      </div></section>

      <section class="group"><h3>${selComp ? `Compartment ${idx + 1}` : 'Selection'}</h3><div class="card">
        ${selComp ? `
          ${numberRow('Shelves', 'shelves', selComp.shelves, '', LIMITS.shelves)}
          ${numberRow('Drawers', 'drawers', selComp.drawers, '', LIMITS.drawers)}
          <label class="row"><span class="row-label">Hanging rail</span>
            <input class="switch" type="checkbox" role="switch" data-key="rail" ${selComp.rail ? 'checked' : ''} /></label>
          <div class="row actions"><button type="button" class="link danger" data-remove ${d.compartments.length <= 1 ? 'disabled' : ''}>Remove compartment</button></div>`
        : `<div class="row empty">${sel ? `${esc(sel)} selected. Edit it in the groups above.` : 'Click a component in the viewer, or pick a compartment above.'}</div>`}
      </div></section>`;
  }

  el.addEventListener('change', (e) => {
    const t = e.target;
    const key = t.dataset.key;
    if (!key) return;
    const sel = store.selectedId;
    const num = Number(t.value);
    store.apply((d) => {
      const c = d.compartments.find((x) => x.id === sel);
      if (key === 'doors') d.doors.count = num;
      else if (key === 'material') d.material = t.value;
      else if (key === 'rail' && c) c.rail = t.checked;
      else if ((key === 'shelves' || key === 'drawers') && c) c[key] = num;
      else if (['width', 'height', 'depth'].includes(key)) d[key] = num;
    });
  });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button, [data-select]');
    if (!b) return;
    if (b.dataset.doorType) store.apply((d) => { d.doors.type = b.dataset.doorType; });
    else if (b.dataset.color) store.apply((d) => { d.color = b.dataset.color; });
    else if (b.dataset.select) store.select(b.dataset.select);
    else if ('add' in b.dataset) {
      store.apply((d, newId) => { d.compartments.push({ id: newId(), shelves: 3, drawers: 0, rail: false }); });
      store.select(store.design.compartments.at(-1).id);
    } else if ('remove' in b.dataset) {
      const sel = store.selectedId;
      store.apply((d) => { d.compartments = d.compartments.filter((c) => c.id !== sel); });
    }
  });
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.select) { e.preventDefault(); store.select(e.target.dataset.select); }
  });

  store.subscribe(render);
  render();
}
