/* ============================================================
   util.js - shared helpers (global namespace: Nexus)
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.util = (function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);

  const pad = (n) => String(n).padStart(2, '0');

  function fmtTime(d) {
    const x = d instanceof Date ? d : new Date(d);
    return pad(x.getHours()) + ':' + pad(x.getMinutes());
  }

  function fmtClock(d) {
    const x = d instanceof Date ? d : new Date(d);
    return pad(x.getHours()) + ':' + pad(x.getMinutes()) + ':' + pad(x.getSeconds());
  }

  function fmtDate(d) {
    const x = d instanceof Date ? d : new Date(d);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[x.getDay()] + ', ' + x.getDate() + ' ' + months[x.getMonth()] + ' ' + x.getFullYear();
  }

  function fmtDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return pad(m) + ':' + pad(s);
  }

  function minutesBetween(a, b) {
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  }

  function timeToMinutes(hhmm) {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function debounce(fn, ms = 180) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }

  // Deterministic-ish pseudo random for seed realism
  function rnd(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  return { $, $$, el, esc, uid, pad, fmtTime, fmtClock, fmtDate, fmtDuration, minutesBetween, timeToMinutes, nowMinutes, clamp, deepClone, debounce, rnd };
})();
