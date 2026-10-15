/* ============================================================
   facilities.js - gate pass + laundry + study pods
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.facilities = (function () {
  const { el } = Nexus.util;

  function render(container) {
    container.innerHTML = '';
    const head = el('div', { class: 'page-head' }, [
      el('div', {}, [el('div', { class: 'page-title' }, 'Facilities & Gate Pass Automation'), el('div', { class: 'page-desc' }, 'Digital gate pass with auto-approval, laundry & study pod slot booking')])
    ]);
    container.appendChild(head);

    const grid = el('div', { class: 'bento' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="shield-half"></i> Digital Gate Pass' }), el('span', { class: 'badge cyan', text: 'Auto-Approval Rules Engine' })]),
        renderGateForm()
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="washing-machine"></i> Smart Laundry' }), el('button', { class: 'btn ghost sm', id: 'refreshFac', html: '<i data-lucide="refresh-cw"></i> Refresh' })]),
        el('div', { class: 'tile-grid', id: 'machineGrid' })
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="book-open"></i> Study Pod Booking' })]),
        el('div', { class: 'tile-grid', id: 'podGrid' })
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="ticket"></i> My Active Gate Passes' })]),
        el('div', { id: 'passesList' })
      ])
    ]);
    container.appendChild(grid);

    renderMachines();
    renderPods();
    renderPasses();
    wire(container);
    Nexus.ui.icons(container);
  }

  function renderGateForm() {
    return el('div', {}, [
      el('div', { class: 'grid-2' }, [
        el('div', { class: 'field' }, [el('label', { text: 'Pass Type' }), el('select', { class: 'select', id: 'passType' }, ['Outing', 'Leave'].map(v => el('option', { value: v }, v))) ]),
        el('div', { class: 'field' }, [el('label', { text: 'Location/Block' }), el('input', { class: 'input', id: 'passLoc', placeholder: 'e.g. Main Gate' }) ])
      ]),
      el('div', { class: 'field' }, [el('label', { text: 'Reason' }), el('textarea', { id: 'passReason', placeholder: 'e.g. Medical appointment, grocery run, off-campus errand' }) ]),
      el('div', { class: 'grid-2' }, [
        el('div', { class: 'field' }, [el('label', { text: 'Out Time (HH:MM)' }), el('input', { class: 'input', type: 'time', id: 'outTime' }) ]),
        el('div', { class: 'field' }, [el('label', { text: 'Return Time (HH:MM)' }), el('input', { class: 'input', type: 'time', id: 'retTime' }) ])
      ]),
      el('button', { class: 'btn primary', id: 'submitPass', html: '<i data-lucide="sparkles"></i> Generate Digital Gate Pass' })
    ]);
  }

  function wire(container) {
    $('#submitPass').onclick = submitPass;
    $('#refreshFac').onclick = () => { renderMachines(); renderPods(); Nexus.ui.toast('Facilities refreshed', 'Timers updated', 'info'); };
  }

  function submitPass() {
    const reason = $('#passReason').value.trim();
    const out = $('#outTime').value, ret = $('#retTime').value, loc = $('#passLoc').value.trim() || 'Main Gate', type = $('#passType').value;
    if (!reason) { Nexus.ui.toast('Reason required', 'Enter purpose for gate pass', 'error'); return; }
    if (!out || !ret) { Nexus.ui.toast('Out & Return time required', 'Provide time window', 'error'); return; }
    const [oh, om] = out.split(':').map(Number), [rh, rm] = ret.split(':').map(Number);
    const outMin = oh * 60 + om, retMin = rh * 60 + rm;
    const nowM = Nexus.util.nowMinutes();
    // Auto-approval rules: daytime outings between 6:00-21:00 auto-approve; late-night review
    const autoDay = outMin >= 6 * 60 && retMin <= 21 * 60 && retMin > outMin;
    let status = autoDay ? 'Approved' : 'Warden Review';
    const pass = {
      id: 'gp_' + Math.random().toString(36).slice(2, 9),
      type, reason, loc, out, ret, status, qrSvg: null,
      createdAt: new Date().toISOString(), validUntil: new Date(Date.now() + (retMin - nowM) * 60000).toISOString()
    };
    Nexus.store.addGatePass(pass);
    renderPasses();
    Nexus.ui.toast('Gate Pass ' + (status === 'Approved' ? 'Auto-Approved' : 'Submitted'), status === 'Warden Review' ? 'Requires warden approval for demo' : 'QR generated with live validity', status === 'Approved' ? 'success' : 'warn');
  }

  function qrSvg(pass) {
    // lightweight dynamic SVG QR-like pattern (demo, not cryptographic)
    const text = pass.id + '|' + pass.out + '|' + pass.ret;
    const seed = Array.from(text).reduce((a,c) => a + c.charCodeAt(0), 0);
    let dots = '';
    const s = 6, size = 5;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = Nexus.util.rnd(seed + r * 10 + c) > 0.5;
        if (v) dots += `<rect x="${c*s}" y="${r*s}" width="${s}" height="${s}" fill="#34d399"/>`;
      }
    }
    return `<svg width="120" height="120" viewBox="0 0 ${size*s} ${size*s}">${dots}<text x="50%" y="95%" font-size="4" fill="#9aa3b8" text-anchor="middle">${pass.id}</text></svg>`;
  }

  function renderPasses() {
    const list = $('#passesList');
    const passes = Nexus.store.get().gatePasses;
    list.innerHTML = '';
    if (!passes.length) { list.appendChild(el('div', { class: 'empty' }, [el('i', { 'data-lucide': 'ticket' }), el('div', { text: 'No gate passes yet' })])); }
    passes.slice(0, 8).forEach(p => {
      const badge = p.status === 'Approved' ? 'emerald' : (p.status === 'Warden Review' ? 'amber' : 'indigo');
      const card = el('div', { class: 'row' }, [
        el('div', { class: 'avatar', html: p.status === 'Approved' ? '<i data-lucide="shield-check"></i>' : '<i data-lucide="hourglass"></i>' }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'row-title', text: p.type + ' · ' + p.loc }),
          el('div', { class: 'row-sub', text: p.reason + ' • ' + p.out + '-' + p.ret }),
          el('div', { class: 'muted mono', style: 'font-size:11px;margin-top:4px', text: 'ID: ' + p.id })
        ]),
        el('div', {}, [
          el('span', { class: 'badge ' + badge, text: p.status }),
          el('button', { class: 'btn sm ghost', style: 'margin-top:8px', text: 'View QR', onclick: () => viewQr(p) })
        ])
      ]);
      if (p.status === 'Warden Review') {
        const act = el('button', { class: 'btn sm emerald', style: 'margin-left:8px', html: '<i data-lucide="user-check"></i> Simulate Warden Approval', onclick: () => {
          Nexus.store.updateGatePass(p.id, { status: 'Approved', approvedAt: new Date().toISOString() });
          renderPasses();
          Nexus.ui.toast('Gate Pass Approved', p.id + ' auto-approved by warden simulation', 'success');
        } });
        card.appendChild(act);
      }
      list.appendChild(card);
    });
    Nexus.ui.icons(list);
  }

  function viewQr(p) {
    const svg = qrSvg(p);
    const body = el('div', { class: 'empty', style: 'padding:16px' }, [
      el('div', { class: 'row-title', text: 'Scannable Dynamic SVG Gate Pass' }),
      el('div', { class: 'row-sub', style: 'margin-bottom:12px', text: p.type + ' • Valid ' + p.out + ' - ' + p.ret }),
      el('div', { style: 'background:var(--bg-soft);padding:18px;border-radius:16px;display:grid;place-items:center' }, el('div', { html: svg })),
      el('div', { class: 'muted mono', style: 'margin-top:10px', text: p.id }),
      el('div', { class: 'badge ' + (p.status === 'Approved' ? 'emerald' : 'amber'), style: 'margin-top:10px', text: p.status })
    ]);
    const foot = el('div', { class: 'modal-foot' }, [el('button', { class: 'btn primary', text: 'Done', onclick: Nexus.ui.closeModal })]);
    Nexus.ui.openModal(Nexus.ui.modalShell('Gate Pass QR', 'qr-code', body, foot));
  }

  // Machines
  function renderMachines() {
    const grid = $('#machineGrid');
    const s = Nexus.store.get();
    grid.innerHTML = '';
    s.machines.forEach(m => {
      const st = m.status, ends = m.endsAt ? new Date(m.endsAt).getTime() : null, now = Date.now();
      let left = 0; if (st !== 'Available' && ends && ends > now) left = Math.ceil((ends - now) / 1000);
      const badge = st === 'Available' ? 'emerald' : (st === 'In Use' ? 'amber' : 'indigo');
      const ico = el('div', { class: 'tile-ico', style: 'background:var(--' + (st==='Available'?'emerald':st==='In Use'?'amber':'indigo') + '-dim);color:var(--' + (st==='Available'?'emerald':st==='In Use'?'amber':'indigo') + ')' }, el('i', { 'data-lucide': 'washing-machine' }));
      const tile = el('div', { class: 'tile ' + (st==='Available'?'available':st==='In Use'?'inuse':st==='booked') }, [
        ico,
        el('div', { class: 'tile-name', text: m.name }),
        el('div', { class: 'tile-meta', text: 'Status: ' + st + (m.user ? ' • ' + m.user : '') }),
        el('div', { class: 'tile-meta', id: m.id + '_timer' })
      ]);
      if (st === 'Available') {
        tile.appendChild(el('button', { class: 'btn emerald', html: '<i data-lucide="play"></i> Book & Start', onclick: () => startMachine(m.id, 30) }));
      } else if (st === 'In Use' || st === 'Booked') {
        if (left > 0) startTimer(tile.querySelector('#' + m.id + '_timer'), left, m.id, 'machine');
        else { tile.querySelector('#' + m.id + '_timer').textContent = 'Timer ended'; completeAsset('machine', m.id); }
        tile.appendChild(el('button', { class: 'btn ghost', disabled: true, text: st }));
      }
      grid.appendChild(tile);
    });
    Nexus.ui.icons(grid);
  }

  function renderPods() {
    const grid = $('#podGrid');
    const s = Nexus.store.get();
    grid.innerHTML = '';
    s.pods.forEach(p => {
      const st = p.status, ends = p.endsAt ? new Date(p.endsAt).getTime() : null, now = Date.now();
      let left = 0; if (st !== 'Available' && ends && ends > now) left = Math.ceil((ends - now) / 1000);
      const badge = st === 'Available' ? 'emerald' : (st === 'In Use' ? 'amber' : 'indigo');
      const ico = el('div', { class: 'tile-ico', style: 'background:var(--' + (st==='Available'?'emerald':st==='In Use'?'amber':'indigo') + '-dim);color:var(--' + (st==='Available'?'emerald':st==='In Use'?'amber':'indigo') + ')' }, el('i', { 'data-lucide': 'book-open' }));
      const tile = el('div', { class: 'tile ' + (st==='Available'?'available':st==='In Use'?'inuse':st==='booked') }, [
        ico,
        el('div', { class: 'tile-name', text: p.name }),
        el('div', { class: 'tile-meta', text: 'Status: ' + st + (p.user ? ' • ' + p.user : '') }),
        el('div', { class: 'tile-meta', id: p.id + '_timer' })
      ]);
      if (st === 'Available') {
        tile.appendChild(el('button', { class: 'btn emerald', html: '<i data-lucide="play"></i> Book & Start (45 min)', onclick: () => startPod(p.id, 45) }));
      } else if (st !== 'Available') {
        if (left > 0) startTimer(tile.querySelector('#' + p.id + '_timer'), left, p.id, 'pod');
        else { tile.querySelector('#' + p.id + '_timer').textContent = 'Timer ended'; completeAsset('pod', p.id); }
        tile.appendChild(el('button', { class: 'btn ghost', disabled: true, text: st }));
      }
      grid.appendChild(tile);
    });
    Nexus.ui.icons(grid);
  }

  function startMachine(id, min) {
    const ends = new Date(Date.now() + min * 60000).toISOString();
    Nexus.store.updateAsset('machine', id, { status: 'In Use', endsAt: ends, user: Nexus.store.get().profile.name });
    renderMachines();
    Nexus.ui.toast('Machine booked', 'Washing cycle started · ' + min + ' min', 'success');
  }
  function startPod(id, min) {
    const ends = new Date(Date.now() + min * 60000).toISOString();
    Nexus.store.updateAsset('pod', id, { status: 'In Use', endsAt: ends, user: Nexus.store.get().profile.name });
    renderPods();
    Nexus.ui.toast('Study Pod booked', 'Session started · ' + min + ' min', 'success');
  }
  function completeAsset(kind, id) {
    Nexus.store.updateAsset(kind, id, { status: 'Available', endsAt: null, user: null });
    if (kind === 'machine') renderMachines(); else renderPods();
    Nexus.ui.toast('Session completed', (kind === 'machine' ? 'Laundry' : 'Study Pod') + ' is now free', 'success');
  }

  function startTimer(elm, secLeft, id, kind) {
    let s = secLeft;
    function tick() {
      elm.textContent = 'Time left: ' + Nexus.util.fmtDuration(s);
      s -= 1;
      if (s < 0) { completeAsset(kind === 'machine' ? 'machine' : 'pod', id); return; }
      setTimeout(tick, 1000);
    }
    tick();
  }

  return { render };
})();
