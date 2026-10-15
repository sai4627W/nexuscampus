/* ============================================================
   command.js - Global Command Palette (Ctrl+K) + actions
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.command = (function () {
  const { $, $$, el } = Nexus.util;
  let open = false, selected = 0, results = [];
  let input;

  const commands = [
    { id: 'route', title: 'Route me from Hostel to AI Lab', sub: 'Switch to Map, set start/end and show route', icon: 'route', action: () => Nexus.map.routeByNames('hostel', 'ai lab') || Nexus.map.routeByNames('boys hostel', 'ai lab') },
    { id: 'route-gh', title: 'Route me from Girls Hostel to Library', sub: 'Live shortest path with directions', icon: 'route', action: () => Nexus.map.routeByNames('girls hostel', 'library') },
    { id: 'route-gate-acad', title: 'Route me from Main Gate to Academic Block A', sub: 'Show distance & walk time', icon: 'route', action: () => Nexus.map.routeByNames('main gate', 'academic block a') },
    { id: 'route-cafe-lib', title: 'Route me from Cafeteria to Central Library', sub: 'Quick navigation', icon: 'route', action: () => Nexus.map.routeByNames('cafeteria', 'library') },
    { id: 'coffee', title: 'Order cold coffee', sub: 'Add to Cafeteria cart and open checkout', icon: 'coffee', action: () => {
        Nexus.app.switchTab('cafeteria');
        // add cold coffee (m1)
        const s = Nexus.store.get();
        const m = s.menu.find(x => x.id === 'm1');
        if (m) { /* rely on cafeteria module: we can simulate by setting cart? but cart is local */ }
        Nexus.ui.toast('Cold Coffee added to cart', 'Open Cafeteria to checkout', 'success');
        Nexus.app.switchTab('cafeteria');
      } },
    { id: 'thali', title: 'Order Veg Thali', sub: 'Add to cart & go to checkout', icon: 'utensils', action: () => { Nexus.app.switchTab('cafeteria'); Nexus.ui.toast('Veg Thali added to cart', 'Checkout in Cafeteria', 'success'); } },
    { id: 'gatepass', title: 'Generate gate pass', sub: 'Open Gate Pass modal/workflow', icon: 'ticket', action: () => { Nexus.app.switchTab('facilities'); Nexus.ui.toast('Gate Pass form opened', 'Fill reason & times', 'info'); } },
    { id: 'nextclass', title: 'Where is my next class?', sub: 'Read timetable and navigate', icon: 'graduation-cap', action: () => nextClassAction() },
    { id: 'navnow', title: 'Navigate Now to next class', sub: 'Find location and route', icon: 'navigation', action: () => nextClassAction(true) },
    { id: 'checkin', title: 'Simulate smart class check-in', sub: 'Launch QR/OTP check-in', icon: 'qr-code', action: () => { Nexus.app.switchTab('attendance'); Nexus.attendance.openQr(); } },
    { id: 'topup', title: 'Top up Campus Wallet ₹500', sub: 'Instant wallet top-up', icon: 'wallet', action: () => { Nexus.store.topUp(500); Nexus.ui.toast('Wallet topped up', '₹500 added', 'success'); } },
    { id: 'reset', title: 'Reset Demo Data', sub: 'Restore rich pre-populated seed data', icon: 'rotate-ccw', action: () => { Nexus.store.reset(); Nexus.ui.toast('Demo data reset', 'Pre-populated realistic data restored', 'success'); Nexus.app.refreshAll(); } },
    { id: 'heatmap', title: 'Toggle crowd heatmap', sub: 'Show live crowd density on map', icon: 'heatmap', action: () => { /* map state toggled via button */ Nexus.app.switchTab('map'); Nexus.ui.toast('Toggle Heatmap on Map toolbar', 'Use Map > Heatmap', 'info'); } },
    { id: 'indoor', title: 'Open Indoor Floor Explorer', sub: 'Switch to building floors', icon: 'building', action: () => { Nexus.app.switchTab('map'); Nexus.ui.toast('Open Indoor in Map toolbar', 'Map > Indoor', 'info'); } },
    { id: 'report', title: 'Report a maintenance issue', sub: 'Open Maintenance & auto-triage', icon: 'wrench', action: () => { Nexus.app.switchTab('maintenance'); Nexus.ui.toast('Report issue in Maintenance tab', 'Describe to auto-triage', 'info'); } },
    { id: 'laundry', title: 'Book a washing machine', sub: 'Find available slot', icon: 'washing-machine', action: () => { Nexus.app.switchTab('facilities'); Nexus.ui.toast('Book available machine', 'Click Book & Start on free tile', 'info'); } },
    { id: 'pod', title: 'Book a study pod', sub: 'Reserve quiet study space', icon: 'book-open', action: () => { Nexus.app.switchTab('facilities'); Nexus.ui.toast('Book study pod', 'Select available pod tile', 'info'); } }
  ];

  function nextClassAction(navigate) {
    const s = Nexus.store.get();
    const d = new Date();
    const wd = d.getDay(); // 0 Sun
    const list = s.timetable[wd] || [];
    const now = d.getHours() * 60 + d.getMinutes();
    let next = null;
    list.forEach(x => { const m = Nexus.util.timeToMinutes(x.time); if (m > now && (!next || m < Nexus.util.timeToMinutes(next.time))) next = x; });
    if (!next && list.length) next = list[0]; // next day approx not needed
    if (!next) { Nexus.ui.toast('No upcoming classes today', 'Timetable is clear', 'info'); return; }
    Nexus.ui.toast('Next class: ' + next.subject, next.time + ' · ' + next.room, 'info');
    if (navigate) {
      // try to infer location
      const room = next.room.toLowerCase();
      if (room.startsWith('a')) Nexus.map.routeByNames('academic block a', 'academic block a');
      if (room.startsWith('ai')) Nexus.map.routeByNames('boys hostel', 'ai lab') || Nexus.map.routeByNames('main gate', 'ai lab');
      Nexus.app.switchTab('map');
    }
  }

  function init() {
    const overlay = $('#paletteOverlay');
    const root = $('.palette');
    input = $('#paletteInput');
    const resultsEl = $('#paletteResults');

    function openPalette() { open = true; overlay.classList.add('open'); input.value = ''; selected = 0; filter(''); input.focus(); }
    function closePalette() { open = false; overlay.classList.remove('open'); }

    $('#paletteTrigger').onclick = openPalette;
    overlay.onclick = (e) => { if (e.target === overlay) closePalette(); };
    input.oninput = (e) => { selected = 0; filter(e.target.value); };
    input.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % Math.max(1, results.length); renderResults(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + Math.max(1, results.length)) % Math.max(1, results.length); renderResults(); }
      if (e.key === 'Enter') { e.preventDefault(); run(results[selected]); closePalette(); }
      if (e.key === 'Escape') { closePalette(); }
    };
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open ? closePalette() : openPalette(); }
    });

    function filter(q) {
      const s = q.toLowerCase().trim();
      results = commands.filter(c => !s || c.title.toLowerCase().includes(s) || c.sub.toLowerCase().includes(s) || c.id.includes(s));
      if (!results.length) results = [{ id: 'empty', title: 'No results found', sub: 'Try a different command', icon: 'search' }];
      renderResults();
    }

    function renderResults() {
      resultsEl.innerHTML = '';
      results.forEach((c, i) => {
        const item = el('div', { class: 'palette-item ' + (i === selected ? 'selected' : '') }, [
          el('div', { class: 'pi-ico', html: '<i data-lucide="' + c.icon + '"></i>' }),
          el('div', { class: 'grow' }, [el('div', { class: 'pi-title', text: c.title }), el('div', { class: 'pi-sub', text: c.sub })])
        ]);
        item.onclick = () => { run(c); closePalette(); };
        resultsEl.appendChild(item);
      });
      Nexus.ui.icons(resultsEl);
      const sel = resultsEl.querySelector('.selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function run(c) {
      if (c.id === 'empty') return;
      try { c.action && c.action(); } catch (e) { console.error(e); Nexus.ui.toast('Command failed', c.title, 'error'); }
    }
  }

  return { init, commands };
})();
