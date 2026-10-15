/* ============================================================
   app.js - shell wiring, tabs, topbar, assistant, init
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.app = (function () {
  const { $, $$ } = Nexus.util;
  let clock, nextTick;

  function switchTab(id) {
    $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
    renderTab(id);
    try { localStorage.setItem('nexus.tab', id); } catch (e) {}
  }

  function renderTab(id) {
    const c = $('#tab-' + id);
    if (!c) return;
    if (id === 'map') return Nexus.map.init(c);
    if (id === 'attendance') return Nexus.attendance.render(c);
    if (id === 'cafeteria') return Nexus.cafeteria.render(c);
    if (id === 'facilities') return Nexus.facilities.render(c);
    if (id === 'maintenance') return Nexus.maintenance.render(c);
  }

  function refreshAll() {
    const active = document.querySelector('.tab-panel.active');
    if (active) {
      const id = active.id.replace('tab-', '');
      renderTab(id);
    }
    updateTopbar();
  }

  function updateTopbar() {
    const s = Nexus.store.get();
    $('#walletAmt').textContent = s.profile.wallet.toFixed(2);
    $('#sName').textContent = s.profile.name;
    $('#sId').textContent = s.profile.id;
    $('#sAvatar').textContent = s.profile.initials;
    $('#liveClock').textContent = Nexus.util.fmtClock(new Date());
    // next class
    const wd = new Date().getDay();
    const list = s.timetable[wd] || [];
    const now = new Date().getHours()*60 + new Date().getMinutes();
    let next = null;
    list.forEach(x => { const m = Nexus.util.timeToMinutes(x.time); if (m > now && (!next || m < m)); });
    // simpler: scan
    next = null;
    list.forEach(x => { const m = Nexus.util.timeToMinutes(x.time); if (m > now) { if (!next || Nexus.util.timeToMinutes(x.time) < Nexus.util.timeToMinutes(next.time)) next = x; } });
    if (!next && list.length) next = list[0]; // fallback
    const pill = $('#nextClassPill'), txt = $('#nextClassText');
    if (next) { txt.textContent = next.time + ' · ' + next.subject + ' (' + next.room + ')'; pill.style.display = 'inline-flex'; }
    else { txt.textContent = 'No upcoming classes today'; pill.style.display = 'inline-flex'; }
  }

  function wireAssistant() {
    const drawer = $('#assistantDrawer'), back = $('#assistantBackdrop'), open = $('#assistantToggle'), close = $('#assistantClose'), send = $('#assistantSend'), input = $('#assistantInput'), log = $('#assistantLog'), quick = $('#assistantQuick');
    function toggle(v) { drawer.classList.toggle('open', v); back.classList.toggle('open', v); }
    open.onclick = () => toggle(true);
    close.onclick = () => toggle(false);
    back.onclick = () => toggle(false);
    send.onclick = reply;
    input.onkeydown = (e) => { if (e.key === 'Enter') reply(); };
    const qitems = [
      { text: 'Route Hostel→AI Lab', action: () => { toggle(false); Nexus.map.routeByNames('hostel','ai lab'); Nexus.app.switchTab('map'); } },
      { text: 'Order Cold Coffee', action: () => { toggle(false); Nexus.app.switchTab('cafeteria'); Nexus.ui.toast('Add Cold Coffee in Cafeteria', 'Use + to add', 'info'); } },
      { text: 'Where is my next class?', action: () => { replyAuto('where is my next class?'); } },
      { text: 'Generate gate pass', action: () => { toggle(false); Nexus.app.switchTab('facilities'); } }
    ];
    qitems.forEach(q => { quick.appendChild(el('button', { class: 'btn sm ghost', text: q.text, onclick: q.action })); });

    function reply() {
      const v = input.value.trim(); if (!v) return;
      push('user', v); input.value = '';
      setTimeout(() => replyAuto(v), 350);
    }
    function replyAuto(v) {
      const low = v.toLowerCase();
      if (low.includes('next class')) {
        const s = Nexus.store.get();
        const wd = new Date().getDay();
        const list = s.timetable[wd] || [];
        const now = new Date().getHours()*60 + new Date().getMinutes();
        let next = null;
        list.forEach(x => { const m = Nexus.util.timeToMinutes(x.time); if (m > now) { if (!next || Nexus.util.timeToMinutes(x.time) < Nexus.util.timeToMinutes(next.time)) next = x; } });
        if (!next && list.length) next = list[0];
        if (next) {
          push('bot', 'Next class: ' + next.subject + ' at ' + next.time + ' in ' + next.room + ' (' + next.code + ').');
          push('bot', el('div', { class: 'msg-action' }, [el('button', { class: 'btn sm primary', html: '<i data-lucide="navigation"></i> Navigate Now', onclick: () => { toggle(false); Nexus.map.routeByNames('hostel', next.room.startsWith('AI')?'ai lab':'academic block a'); Nexus.app.switchTab('map'); } })]));
          return;
        } else { push('bot', 'No upcoming classes today.'); return; }
      }
      if (low.includes('route')) { push('bot', 'I can route between campus nodes. Try: "Route me from Hostel to AI Lab".'); return; }
      if (low.includes('order')) { push('bot', 'Tell me what to order. Example: "Order cold coffee".'); return; }
      if (low.includes('gate pass')) { push('bot', 'Opening Facilities → Digital Gate Pass. Fill details for auto-approval check.'); toggle(false); Nexus.app.switchTab('facilities'); return; }
      if (low.includes('lost') || low.includes('maintenance')) { push('bot', 'Report it in Maintenance tab - I\'ll auto-triage dept & priority.'); toggle(false); Nexus.app.switchTab('maintenance'); return; }
      push('bot', 'I\'m on it. Quick commands: Route, Order, Next class, Gate pass, Report issue.');
    }
    function push(kind, content) {
      const m = el('div', { class: 'msg ' + kind });
      if (typeof content === 'string') m.textContent = content;
      else m.appendChild(content);
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    }
  }

  function init() {
    Nexus.store.init();
    Nexus.ui.icons(document.body);

    // nav
    $$('.nav-item').forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));

    // topbar
    $('#menuToggle').onclick = () => $('#sidebar').classList.toggle('open');
    $('#walletPill').onclick = () => { Nexus.store.topUp(500); updateTopbar(); Nexus.ui.toast('Wallet topped up', '₹500 added', 'success'); };
    $('#resetBtn').onclick = () => { Nexus.store.reset(); refreshAll(); Nexus.ui.toast('Demo data reset', 'Rich realistic seed restored', 'success'); };

    // tabs restore
    let last = 'map';
    try { last = localStorage.getItem('nexus.tab') || 'map'; } catch (e) {}
    switchTab(last);

    // clocks
    updateTopbar();
    clock = setInterval(updateTopbar, 1000);

    // command palette
    Nexus.command.init();

    // assistant
    wireAssistant();

    Nexus.ui.toast('NexusCampus OS ready', 'Ctrl+K for command palette · Realistic demo data loaded', 'success');
  }

  return { init, switchTab, refreshAll };
})();

// boot
window.addEventListener('DOMContentLoaded', () => {
  Nexus.app.init();
});
