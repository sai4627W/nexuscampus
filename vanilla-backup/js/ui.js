/* ============================================================
   ui.js - toasts, modals, icon refresh, small render helpers
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.ui = (function () {
  const { $, el } = Nexus.util;
  const toastStack = () => $('#toastStack');

  function icons(root) {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons(root ? { nameAttr: 'data-lucide', attrs: { 'data-lucide': '' } } : undefined);
    }
  }

  // Re-run lucide on a subtree
  function refresh(root) {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  function toast(title, sub, kind = 'info', ms = 3200) {
    const ic = { success: 'check-circle-2', info: 'info', warn: 'alert-triangle', error: 'x-circle' }[kind] || 'info';
    const t = el('div', { class: 'toast ' + kind }, [
      el('div', { class: 'toast-ico', html: '<i data-lucide="' + ic + '"></i>' }),
      el('div', { class: 'grow' }, [
        el('div', { class: 'toast-title', text: title }),
        sub ? el('div', { class: 'toast-sub', text: sub }) : null
      ])
    ]);
    toastStack().appendChild(t);
    refresh(t);
    setTimeout(() => {
      t.classList.add('leaving');
      setTimeout(() => t.remove(), 260);
    }, ms);
    return t;
  }

  // ---------- Modal ----------
  let modalOnClose = null;
  function openModal(contentNode, opts = {}) {
    const root = $('#modalRoot');
    const overlay = $('#modalOverlay');
    root.innerHTML = '';
    root.appendChild(contentNode);
    overlay.classList.add('open');
    refresh(root);
    modalOnClose = opts.onClose || null;
  }

  function closeModal() {
    $('#modalOverlay').classList.remove('open');
    $('#modalRoot').innerHTML = '';
    if (typeof modalOnClose === 'function') modalOnClose();
    modalOnClose = null;
  }

  function modalShell(title, icon, bodyNode, footerNode) {
    const wrap = el('div', {}, [
      el('div', { class: 'modal-head' }, [
        el('div', { class: 'modal-title', html: '<i data-lucide="' + icon + '"></i> ' + Nexus.util.esc(title) }),
        el('button', { class: 'icon-btn', onclick: closeModal, html: '<i data-lucide="x"></i>' })
      ]),
      bodyNode,
      footerNode || null
    ]);
    return wrap;
  }

  // ---------- Progress ring ----------
  function ring(pct, colorClass) {
    const r = 38, c = 2 * Math.PI * r;
    const off = c * (1 - Nexus.util.clamp(pct, 0, 100) / 100);
    const color = colorClass === 'rose' ? 'var(--rose)' : colorClass === 'amber' ? 'var(--amber)' : colorClass === 'emerald' ? 'var(--emerald)' : 'var(--indigo)';
    return '<div class="ring" style="--c:' + color + '"><svg width="92" height="92"><circle class="track" cx="46" cy="46" r="' + r + '"></circle>' +
      '<circle class="val" cx="46" cy="46" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle></svg>' +
      '<div class="ring-label">' + Math.round(pct) + '%</div></div>';
  }

  function attendanceColor(pct) {
    if (pct < 75) return 'rose';
    if (pct < 80) return 'amber';
    return 'emerald';
  }

  return { icons, refresh, toast, openModal, closeModal, modalShell, ring, attendanceColor };
})();
