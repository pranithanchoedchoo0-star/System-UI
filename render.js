// ตรรกะเรนเดอร์ UI (ดัดแปลงจากสคริปต์เดิม) — ไม่ใช้ innerHTML กับข้อมูลจาก AI เพื่อความปลอดภัย

const STAT_KEYS = ['level','exp','job','title','hp','mp','sp','str','agi','vit','int','per','cha'];
const EQUIP_SLOTS = ['head','chest','gloves','pants','shoes','weapon'];

function makeBox(name, title, meta, desc) {
  const box = document.createElement('div');
  box.className = 'skill-item-box';
  if (title) {
    box.dataset.action = 'open-modal';
    box.dataset.title = title;
    box.dataset.meta = meta || '';
    box.dataset.desc = desc || '';
  }
  const span = document.createElement('span');
  span.className = 'skill-name';
  span.textContent = name;
  box.appendChild(span);
  return box;
}

function fillList(listEl, items, emptyLabel) {
  if (!listEl) return;
  listEl.replaceChildren();
  if (items.length === 0) listEl.appendChild(makeBox(emptyLabel, null));
  else items.forEach(b => listEl.appendChild(b));
}

const skillMeta = (sk) => `${sk.level ? `LV.${sk.level}` : ''}${sk.exp ? ` | EXP: ${sk.exp}` : ''}`.trim();

/** อัปเดตข้อมูลทั้งหมดใน root จากออบเจ็กต์ data */
export function renderData(root, data) {
  data = data || {};

  // STATS
  STAT_KEYS.forEach(k => {
    const el = root.querySelector('#val-' + k);
    if (el) el.textContent = (data[k] !== undefined && data[k] !== null && data[k] !== '') ? data[k] : 'N/A';
  });

  // EQUIP
  const eq = data.equipment || {};
  EQUIP_SLOTS.forEach(slot => {
    const raw = eq[slot];
    const arr = (Array.isArray(raw) ? raw : (raw ? [raw] : []))
      .filter(i => i && i.name && i.name !== 'None' && i.name !== 'N/A');
    fillList(root.querySelector(`#equip-${slot}-list`), arr.map(item => {
      const parts = [];
      if (item.stat) parts.push('STATUS BONUS: ' + item.stat);
      if (item.desc) parts.push(item.desc);
      return makeBox(`[${item.name}]`, item.name, item.meta || '', parts.join('\n\n'));
    }), '[NONE]');
  });

  // SKILLS
  const sk = data.skills || {};
  [['passiveSkillsList','passive'],['activeSkillsList','active'],['ultimateSkillsList','ultimate']].forEach(([id, key]) => {
    const arr = Array.isArray(sk[key]) ? sk[key] : [];
    fillList(root.querySelector('#' + id), arr.map(s => makeBox(s.name, s.name, skillMeta(s), s.desc || '')), 'NONE');
  });

  // INVENTORY
  const inv = (Array.isArray(data.inventory) ? data.inventory : []).filter(i => i && i.name);
  fillList(root.querySelector('#inventoryList'), inv.map(i => {
    const parts = [];
    if (i.amount !== undefined && i.amount !== null && i.amount !== '') parts.push('AMOUNT: ' + i.amount);
    if (i.desc) parts.push(i.desc);
    return makeBox(i.name, i.name, i.meta || '', parts.join('\n\n'));
  }), 'EMPTY');

  // QUESTS
  const qs = Array.isArray(data.quests) ? data.quests : [];
  fillList(root.querySelector('#questsList'), qs.map(q => {
    const name = q.name || q.type || 'QUEST';
    const parts = [];
    if (q.timer) parts.push('TIME LEFT: ' + q.timer);
    if (Array.isArray(q.goals) && q.goals.length)
      parts.push('GOALS:\n' + q.goals.map(g => `${g.done ? '[✔] ' : '[ ] '}${g.name}: ${g.progress}`).join('\n'));
    if (q.reward) parts.push('REWARD: ' + q.reward);
    if (q.warning) parts.push('WARNING: ' + q.warning);
    if (q.msg) parts.push(q.msg);
    return makeBox(name, name, q.type || 'Quest', parts.join('\n\n'));
  }), 'NO QUESTS');
}

/** ผูกอีเวนต์คลิกทั้งหมด (เรียกครั้งเดียวตอนสร้างหน้าต่าง) */
export function bindEvents(root) {
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const dir = parseInt(target.dataset.dir, 10) || 1;

    if (action === 'select-menu') {
      const panel = root.querySelector('#' + target.dataset.menu + 'Panel');
      const body = root.querySelector('#systemPanel');
      const wasActive = target.classList.contains('active');

      root.querySelectorAll('.option-btn-slide').forEach(b => b.classList.remove('active'));
      root.querySelectorAll('.system-body > div:not(.system-modal-overlay)').forEach(p => (p.style.display = 'none'));
      root.querySelector('#systemModal').style.display = 'none';

      if (!wasActive) {
        target.classList.add('active');
        body.style.display = 'block';
        if (panel) panel.style.display = 'block';
      } else {
        body.style.display = 'none';
      }
    } else if (action === 'scroll-tab') {
      const w = root.querySelector('#tabScrollWrapper');
      if (w) w.scrollTop += dir * 40;
    } else if (action === 'scroll-container') {
      const c = root.querySelector('#' + target.dataset.target);
      if (c) c.scrollTop += dir * 70;
    } else if (action === 'open-modal') {
      root.querySelector('#modalTitle').textContent = target.dataset.title || '';
      root.querySelector('#modalMeta').textContent = target.dataset.meta || '';
      const d = root.querySelector('#modalDesc');
      d.textContent = target.dataset.desc || '';
      d.scrollTop = 0;
      root.querySelector('#systemModal').style.display = 'flex';
    } else if (action === 'close-modal') {
      root.querySelector('#systemModal').style.display = 'none';
    }
  });
}
