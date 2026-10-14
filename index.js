import { renderData, bindEvents } from './render.js';
import { findLatestStatus } from './parser.js';

const EXT_FOLDER = new URL('.', import.meta.url).href;

jQuery(async () => {
  const ctx = () => SillyTavern.getContext();

  // 1) โหลด HTML ของหน้าต่าง
  const html = await (await fetch(`${EXT_FOLDER}ui.html`)).text();
  $('body').append(html);
  const win = document.getElementById('sys-float');

  // 2) ปุ่มเปิด/ปิด
  const toggle = document.createElement('div');
  toggle.id = 'sys-float-toggle';
  toggle.title = 'System Window';
  toggle.textContent = 'SYS';
  document.body.appendChild(toggle);

  const setOpen = (open) => win.classList.toggle('sys-hidden', !open);
  toggle.addEventListener('click', () => setOpen(win.classList.contains('sys-hidden')));
  win.querySelector('[data-action="float-close"]').addEventListener('click', () => setOpen(false));

  // 3) ผูกอีเวนต์ UI
  bindEvents(win);

  // 4) อ่านสเตตัสจากแชทแล้วอัปเดตหน้าต่าง
  let lastJson = '';
  function refresh() {
    try {
      const data = findLatestStatus(ctx().chat);
      const json = JSON.stringify(data);
      if (json === lastJson) return;     // ไม่มีอะไรเปลี่ยน ไม่ต้องเรนเดอร์ใหม่
      lastJson = json;
      renderData(win, data);             // data = null จะแสดงเป็น N/A / NONE
    } catch (e) {
      console.error('[System Window UI] refresh error:', e);
    }
  }
  const refreshSoon = () => setTimeout(refresh, 0);

  const { eventSource, event_types } = ctx();
  [
    event_types.CHAT_CHANGED,
    event_types.MESSAGE_RECEIVED,
    event_types.MESSAGE_EDITED,
    event_types.MESSAGE_SWIPED,
    event_types.MESSAGE_DELETED,
  ].forEach(ev => eventSource.on(ev, refreshSoon));

  refresh();
  console.log('[System Window UI] loaded');
});
