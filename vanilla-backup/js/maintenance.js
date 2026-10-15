/* ============================================================
   maintenance.js - auto-triage + Kanban tracker
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.maintenance = (function () {
  function render(container) {
    container.innerHTML = '';
    const head = el('div', { class: 'page-head' }, [
      el('div', {}, [el('div', { class: 'page-title' }, 'Campus Maintenance & Lost-and-Found Router'), el('div', { class: 'page-desc' }, 'Auto-triage by keywords → auto-assign dept & priority → live Kanban')])
    ]);
    container.appendChild(head);

    const grid = el('div', { class: 'bento' }, [
      el('div', { class: 'card' }, [el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="alert-circle"></i> Report New Issue' }), el('span', { class: 'badge amber', text: 'Auto-Triage Enabled' })]), renderForm()]),
      el('div', { class: 'card' }, [el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="layout-kanban"></i> Live Status Tracker (Kanban)' }), el('button', { class: 'btn ghost sm', id: 'refreshKan', html: '<i data-lucide="refresh-cw"></i> Refresh' })]), renderKanban()])
    ]);
    container.appendChild(grid);

    $('#submitIssue').onclick = submit;
    $('#refreshKan').onclick = () => { renderKanban(); Nexus.ui.toast('Kanban refreshed', 'Statuses synced', 'info'); };
    Nexus.ui.icons(container);
  }

  function renderForm() {
    return el('div', {}, [
      el('div', { class: 'field' }, [el('label', { text: 'Location' }), el('input', { class: 'input', id: 'issLoc', placeholder: 'e.g. Academic Block A Room 204, Library Entrance, Boys Hostel' }) ]),
      el('div', { class: 'field' }, [el('label', { text: 'Issue Title/Description' }), el('textarea', { id: 'issDesc', placeholder: 'e.g. AC leaking in Block A Room 204, Lost Blue Water Bottle near Library, Projector bulb flickering' }) ]),
      el('button', { class: 'btn primary', id: 'submitIssue', html: '<i data-lucide="send"></i> Submit & Auto-Triage' })
    ]);
  }

  function renderKanban() {
    const cols = [
      { id: 'Reported', title: 'Reported', color: 'var(--cyan)' },
      { id: 'Assigned', title: 'Assigned', color: 'var(--amber)' },
      { id: 'Resolved', title: 'Resolved', color: 'var(--emerald)' }
    ];
    const wrap = el('div', { class: 'kanban' });
    const s = Nexus.store.get();
    const list = s.tickets.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    cols.forEach(c => {
      const col = el('div', { class: 'kcol' });
      col.appendChild(el('div', { class: 'kcol-head' }, [el('span', { text: c.title }), el('span', { class: 'badge muted', text: list.filter(x => x.status === c.id).length })]));
      list.filter(x => x.status === c.id).forEach(t => {
        const k = el('div', { class: 'kcard' }, [
          el('div', { class: 'kcard-title', text: t.title }),
          el('div', { class: 'kcard-meta', text: t.location + ' • ' + formatAgo(t.createdAt) }),
          el('div', { class: 'flex wrap', style: 'gap:6px;margin-bottom:8px' }, [
            el('span', { class: 'badge ' + badgeForDept(t.dept), text: t.dept }),
            el('span', { class: 'badge ' + badgeForPri(t.priority), text: t.priority })
          ]),
          el('div', { class: 'kcard-actions' }, [
            nextAction(t)
          ])
        ]);
        col.appendChild(k);
      });
      wrap.appendChild(col);
    });
    const target = document.querySelector('#tab-maintenance');
    if (target) { const kan = target.querySelector('.kanban'); if (kan) kan.remove(); target.querySelector('.card').appendChild(wrap); }
    else wrap;
    Nexus.ui.icons(wrap);
    return wrap;
  }

  function nextAction(t) {
    if (t.status === 'Reported') {
      return el('button', { class: 'btn sm', html: '<i data-lucide="chevrons-right"></i> Move to Assigned', onclick: () => { Nexus.store.updateTicket(t.id, { status: 'Assigned' }); render(document.querySelector('#tab-maintenance')); Nexus.ui.toast('Ticket assigned', t.id, 'info'); } });
    }
    if (t.status === 'Assigned') {
      return el('button', { class: 'btn sm emerald', html: '<i data-lucide="check-circle-2"></i> Mark Resolved', onclick: () => { Nexus.store.updateTicket(t.id, { status: 'Resolved', resolvedAt: new Date().toISOString() }); render(document.querySelector('#tab-maintenance')); Nexus.ui.toast('Issue resolved', 'Marked as resolved', 'success'); } });
    }
    return el('button', { class: 'btn sm ghost', disabled: true, text: 'Resolved' });
  }

  function badgeForDept(d) {
    return d === 'Electrical' ? 'amber' : (d === 'IT Support' ? 'indigo' : (d === 'Housekeeping' ? 'cyan' : 'muted'));
  }
  function badgeForPri(p) {
    return p === 'Urgent' ? 'rose' : (p === 'Medium' ? 'amber' : 'emerald');
  }
  function formatAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return diff <= 1 ? 'Just now' : diff < 60 ? diff + ' min ago' : Math.floor(diff/60) + 'h ' + (diff%60) + 'm ago';
  }

  function triage(desc) {
    const d = desc.toLowerCase();
    let dept = 'Housekeeping', pri = 'Medium';
    if (d.includes('ac') || d.includes('electric') || d.includes('power') || d.includes('switch') || d.includes('bulb') || d.includes('leak')) { dept = 'Electrical'; pri = 'Urgent'; }
    else if (d.includes('wifi') || d.includes('internet') || d.includes('projector') || d.includes('lab pc') || d.includes('laptop') || d.includes('printer') || d.includes('network')) { dept = 'IT Support'; pri = 'Medium'; }
    else if (d.includes('plumber') || d.includes('washroom') || d.includes('clean') || d.includes('dust') || d.includes('garbage') || d.includes('room')) { dept = 'Housekeeping'; pri = 'Low'; }
    else if (d.includes('lost') || d.includes('found') || d.includes('bottle') || d.includes('key') || d.includes('id') || d.includes('wallet')) { dept = 'Lost & Found'; pri = 'Low'; }
    else if (d.includes('fan') || d.includes('light') || d.includes('tap') || d.includes('broken')) { dept = 'Electrical'; pri = 'Medium'; }
    return { dept, pri };
  }

  function submit() {
    const desc = $('#issDesc').value.trim(), loc = $('#issLoc').value.trim() || 'Campus';
    if (!desc) { Nexus.ui.toast('Description required', 'Describe the issue to auto-triage', 'error'); return; }
    const t = triage(desc);
    const ticket = {
      id: 'tic_' + Math.random().toString(36).slice(2, 9),
      title: desc.length > 60 ? desc.slice(0, 57) + '…' : desc,
      desc, loc, dept: t.dept, priority: t.pri, status: 'Reported', createdAt: new Date().toISOString()
    };
    Nexus.store.addTicket(ticket);
    $('#issDesc').value = ''; $('#issLoc').value = '';
    render(document.querySelector('#tab-maintenance'));
    Nexus.ui.toast('Ticket submitted & auto-triaged', t.dept + ' · ' + t.pri, 'success');
  }

  return { render };
})();
