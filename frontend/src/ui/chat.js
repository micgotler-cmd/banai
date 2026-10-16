import { COLORS } from '../catalog.js';

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const num = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()]);
const NUM = '(\\d+|one|two|three|four|five|six)';

// Local preview only: a keyword parser that stands in for the AI agent until it is connected.
// It never touches the design; it only produces a *pending* proposal.
function propose(text) {
  const t = text.toLowerCase();
  const changes = [];
  let m;
  if ((m = t.match(/(\d{2,3})\s*(?:cm)?\s*(?:wide|width)/))) { const v = +m[1]; changes.push({ label: `Set width to ${v} cm`, run: (d) => { d.width = v; } }); }
  if ((m = t.match(/(\d{2,3})\s*(?:cm)?\s*(?:tall|high|height)/))) { const v = +m[1]; changes.push({ label: `Set height to ${v} cm`, run: (d) => { d.height = v; } }); }
  if ((m = t.match(/(\d{2,3})\s*(?:cm)?\s*(?:deep|depth)/))) { const v = +m[1]; changes.push({ label: `Set depth to ${v} cm`, run: (d) => { d.depth = v; } }); }
  if ((m = t.match(new RegExp(`${NUM}\\s+compartments?`)))) {
    const n = Math.min(6, Math.max(1, num(m[1])));
    changes.push({
      label: `Use ${n} compartment${n > 1 ? 's' : ''}`,
      run: (d, newId) => {
        while (d.compartments.length > n) d.compartments.pop();
        while (d.compartments.length < n) d.compartments.push({ id: newId(), shelves: 3, drawers: 0, rail: false });
      },
    });
  }
  const target = (d) => {
    const pos = ['left', 'middle', 'right'].find((p) => t.includes(p));
    if (!pos) return d.compartments;
    const i = pos === 'left' ? 0 : pos === 'right' ? d.compartments.length - 1 : Math.floor((d.compartments.length - 1) / 2);
    return [d.compartments[i]];
  };
  const where = ['left', 'middle', 'right'].find((p) => t.includes(p));
  if ((m = t.match(new RegExp(`${NUM}\\s+shelves`)))) {
    const n = num(m[1]);
    changes.push({ label: `${n} shelves, ${where ?? 'all compartments'}`, run: (d) => target(d).forEach((c) => { c.shelves = n; }) });
  }
  if ((m = t.match(new RegExp(`${NUM}\\s+drawers?`)))) {
    const n = num(m[1]);
    changes.push({ label: `${n} drawer${n === 1 ? '' : 's'}, ${where ?? 'all compartments'}`, run: (d) => target(d).forEach((c) => { c.drawers = n; }) });
  }
  if (/hanging|rail/.test(t)) changes.push({ label: `Add hanging rail, ${where ?? 'middle'}`, run: (d) => { (where ? target(d) : [d.compartments[Math.floor((d.compartments.length - 1) / 2)]]).forEach((c) => { c.rail = true; }); } });
  const color = COLORS.find((c) => t.includes(c.id));
  if (color) changes.push({ label: `Change color to ${color.label}`, run: (d) => { d.color = color.id; } });
  if (/sliding/.test(t)) changes.push({ label: 'Use sliding doors', run: (d) => { d.doors.type = 'sliding'; } });
  else if (/hinged/.test(t)) changes.push({ label: 'Use hinged doors', run: (d) => { d.doors.type = 'hinged'; } });
  return changes;
}

export function mountChat(el, store) {
  const log = el.querySelector('.chat-log');
  const form = el.querySelector('form');
  const input = el.querySelector('textarea');
  let proposal = null; // { changes, base, node }

  const bubble = (who, text) => {
    const b = document.createElement('div');
    b.className = `bubble ${who}`;
    b.textContent = text;
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  };

  function renderProposal() {
    const stale = proposal.base !== store.revision;
    const n = proposal.node;
    n.classList.toggle('stale', stale);
    n.innerHTML = `<h4>Proposed changes <span class="badge">${stale ? 'OUTDATED' : 'PENDING'}</span></h4>
      <ul>${proposal.changes.map((c) => `<li>${c.label}</li>`).join('')}</ul>
      ${stale ? '<p class="warn">The design changed after this was proposed. Ask again to get an up-to-date proposal.</p>' : '<p class="hint">Not applied yet. The viewer shows the committed design.</p>'}
      <div class="btns"><button type="button" class="btn secondary" data-cancel>Cancel</button><button type="button" class="btn primary" data-confirm ${stale ? 'disabled' : ''}>Confirm</button></div>`;
  }

  function closeProposal(note) {
    if (!proposal) return;
    proposal.node.remove();
    proposal = null;
    if (note) bubble('agent', note);
  }

  log.addEventListener('click', (e) => {
    if (!proposal) return;
    if (e.target.closest('[data-cancel]')) closeProposal('Okay, nothing was changed.');
    if (e.target.closest('[data-confirm]') && proposal.base === store.revision) {
      const { changes } = proposal;
      store.apply((d, newId) => changes.forEach((c) => c.run(d, newId)));
      closeProposal('Done. The design has been updated.');
    }
  });

  store.subscribe(() => { if (proposal) renderProposal(); });

  function send(text) {
    if (!text.trim()) return;
    bubble('user', text.trim());
    if (proposal) closeProposal();
    const changes = propose(text);
    if (!changes.length) {
      bubble('agent', 'I can change dimensions, compartments, shelves, drawers, hanging rails, doors and colors. For example: "240 cm wide, 260 cm tall, three compartments, white".');
      return;
    }
    bubble('agent', 'Here is what I would change. Nothing happens until you confirm.');
    const node = document.createElement('div');
    node.className = 'proposal';
    log.append(node);
    proposal = { changes, base: store.revision, node };
    renderProposal();
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); input.value = ''; input.style.height = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 120)}px`; });
  el.querySelector('[data-basic]').addEventListener('click', () => {
    store.reset();
    bubble('agent', 'Started from a basic wardrobe. Edit it by hand or tell me what to change.');
  });

  bubble('agent', 'Hi, I can help you design a wardrobe. Describe what you need, or start from a basic wardrobe.');
  const sug = document.createElement('div');
  sug.className = 'suggestions';
  ['240 cm wide, 260 cm tall, white, three compartments', 'Four shelves left, hanging rail middle, three drawers right', 'Sliding doors in walnut'].forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'suggestion'; b.textContent = t;
    b.addEventListener('click', () => { sug.remove(); send(t); });
    sug.append(b);
  });
  log.append(sug);
}
