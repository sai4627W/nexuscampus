/* ============================================================
   attendance.js - attendance & QR check-in
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.attendance = (function () {
  function render(container) {
    const s = Nexus.store.get();
    container.innerHTML = '';
    const head = el('div', { class: 'page-head' }, [
      el('div', {}, [el('div', { class: 'page-title' }, 'Smart Attendance & Margin Calculator'), el('div', { class: 'page-desc' }, 'Live tracking with margin advice & smart QR check-in')]),
      el('div', { class: 'flex wrap' }, [
        el('button', { class: 'btn primary', id: 'qrCheckIn', html: '<i data-lucide="qr-code"></i> Simulate Smart Class Check-In' })
      ])
    ]);
    container.appendChild(head);

    const grid = el('div', { class: 'bento grid-2' });
    s.subjects.forEach(sub => {
      const pct = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100);
      const c = Nexus.ui.attendanceColor(pct);
      const advice = pct >= 80 ? 'Safe to skip next 2 classes' : (pct >= 75 ? 'Tight margin - attend next 2 classes' : `Must attend next ${Math.max(1, 3 - Math.floor(pct/25))} classes to hit 75%`);
      const card = el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [
          el('div', {}, [el('div', { class: 'card-title', text: sub.code + ' · ' + sub.name }), el('div', { class: 'card-desc', text: 'Faculty: ' + sub.faculty })]),
          el('div', {}, [Nexus.ui.ring(pct, c), el('span', { class: 'badge ' + c, style: 'margin-top:9px;display:inline-flex', text: pct + '%' })])
        ]),
        el('div', { class: 'row', style: 'justify-content:space-between' }, [el('span', { class: 'muted', text: sub.attended + ' / ' + sub.total + ' classes attended' }), el('span', { class: 'muted mono', text: (sub.total - sub.attended) + ' missed' })]),
        el('div', { class: 'progress', style: 'margin:10px 0' }, [el('span', { style: 'width:' + pct + '%;background:var(--' + c + ')' })]),
        el('div', { class: 'badge ' + (pct < 75 ? 'rose' : 'indigo'), text: advice, style: 'margin-bottom:12px' }),
        el('div', { class: 'flex wrap' }, [
          el('button', { class: 'btn emerald', html: '<i data-lucide="check"></i> + Present', onclick: () => { Nexus.store.updateSubject(sub.id, true); render(container); Nexus.ui.toast('Present marked', sub.code + ' attendance updated', 'success'); } }),
          el('button', { class: 'btn rose', html: '<i data-lucide="x"></i> + Absent', onclick: () => { Nexus.store.updateSubject(sub.id, false); render(container); Nexus.ui.toast('Absent marked', sub.code + ' updated', 'warn'); } })
        ])
      ]);
      grid.appendChild(card);
    });
    container.appendChild(grid);

    $('#qrCheckIn').onclick = openQr;
    Nexus.ui.icons(container);
  }

  function openQr() {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const body = el('div', {}, [
      el('div', { class: 'empty', style: 'padding:16px' }, [
        el('div', { class: 'row-title', text: 'Smart Class Check-In' }),
        el('div', { class: 'row-sub', style: 'margin-bottom:12px', text: 'Scan or enter the 4-digit faculty OTP to auto-mark attendance' }),
        el('div', { class: 'stat-val mono', style: 'font-size:34px;text-align:center', text: otp }),
        el('div', { class: 'muted', style: 'text-align:center', text: 'Live OTP · Valid for 120 seconds' })
      ]),
      el('div', { class: 'field', style: 'margin-top:14px' }, [
        el('label', { text: 'Enter OTP to confirm' }),
        el('input', { class: 'input', id: 'otpInput', placeholder: 'e.g. 1234', maxlength: 4 })
      ])
    ]);
    const foot = el('div', { class: 'modal-foot' }, [
      el('button', { class: 'btn ghost', text: 'Cancel', onclick: Nexus.ui.closeModal }),
      el('button', { class: 'btn primary', html: '<i data-lucide="shield-check"></i> Verify & Mark Present', onclick: () => {
        const v = $('#otpInput').value.trim();
        if (v !== otp) { Nexus.ui.toast('Invalid OTP', 'Check the code and try again', 'error'); return; }
        // mark a random subject as present for demo
        const s = Nexus.store.get();
        const sub = s.subjects[Math.floor(Math.random() * s.subjects.length)];
        Nexus.store.updateSubject(sub.id, true);
        Nexus.ui.closeModal();
        Nexus.ui.toast('Check-in successful', 'Marked present for ' + sub.code + ' at ' + new Date().toLocaleTimeString(), 'success');
        // re-render attendance panel if open
        const c = document.querySelector('#tab-attendance');
        if (c && c.classList.contains('active')) Nexus.attendance.render(c);
      } })
    ]);
    Nexus.ui.openModal(Nexus.ui.modalShell('Smart QR Check-In', 'qr-code', body, foot));
  }

  return { render, openQr };
})();
