// ดึงออบเจ็กต์สเตตัส (JSON) ออกจากข้อความ AI
// รองรับทุกรูปแบบ: <system>{...}</system>, ```json {...} ```, หรือ JSON ลอยๆ ในข้อความ
// วิธีการ: สแกนหา { ... } ที่สมดุล แล้วลอง JSON.parse เลือกอันที่หน้าตาเหมือนสเตตัส (ใช้อันสุดท้ายในข้อความ)

const STATUS_KEYS = ['level', 'hp', 'mp', 'equipment', 'skills', 'inventory', 'quests'];

function looksLikeStatus(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return STATUS_KEYS.filter(k => k in obj).length >= 2;
}

// หาตำแหน่งปิดปีกกาที่คู่กับ text[start] (รู้จักสตริงและ escape)
function findBalancedEnd(text, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

export function extractStatusFromText(text) {
  if (!text || typeof text !== 'string') return null;
  let found = null;
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('{', i);
    if (start === -1) break;
    const end = findBalancedEnd(text, start);
    if (end === -1) break;
    const chunk = text.slice(start, end + 1).replace(/\\'/g, "'");
    try {
      const obj = JSON.parse(chunk);
      if (looksLikeStatus(obj)) { found = obj; i = end + 1; continue; }
    } catch (_) { /* ไม่ใช่ JSON ที่ใช้ได้ */ }
    i = start + 1; // ลองปีกกาตัวถัดไปที่อยู่ข้างใน
  }
  return found;
}

// ย้อนหาจากข้อความล่าสุดขึ้นไป คืนสเตตัสล่าสุดที่เจอ (ข้ามข้อความผู้ใช้/ระบบ)
export function findLatestStatus(chat) {
  if (!Array.isArray(chat)) return null;
  for (let i = chat.length - 1; i >= 0; i--) {
    const m = chat[i];
    if (!m || m.is_user || m.is_system) continue;
    const data = extractStatusFromText(m.mes);
    if (data) return data;
  }
  return null;
}
