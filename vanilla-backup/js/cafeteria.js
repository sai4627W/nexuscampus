/* ============================================================
   cafeteria.js - pre-order + cart + live queue token
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.cafeteria = (function () {
  let cart = {};
  let categories = ['All', 'Breakfast', 'Lunch', 'Beverages', 'Snacks'];
  let currentCat = 'All';

  function render(container) {
    const s = Nexus.store.get();
    container.innerHTML = '';
    const head = el('div', { class: 'page-head' }, [
      el('div', {}, [el('div', { class: 'page-title' }, 'Smart Cafeteria Pre-Order'), el('div', { class: 'page-desc' }, 'Menu filters, live prep time, wallet checkout & queue token')]),
      el('div', { class: 'flex wrap' }, [
        el('span', { class: 'badge cyan', id: 'cafeWallet', text: 'Wallet: ₹' + s.profile.wallet.toFixed(2) }),
        el('button', { class: 'btn ghost', id: 'cafeTopup', html: '<i data-lucide="plus-circle"></i> Top Up ₹500' })
      ])
    ]);
    container.appendChild(head);

    const grid = el('div', { class: 'bento grid-2' });
    const left = el('div', { class: 'stack' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="coffee"></i> Menu' }), el('div', { class: 'chips', id: 'catChips' })]),
        el('div', { class: 'menu-grid', id: 'menuGrid' })
      ])
    ]);
    const right = el('div', { class: 'stack' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="shopping-cart"></i> Cart' }), el('span', { class: 'badge muted', id: 'cartCount', text: '0 items' })]),
        el('div', { id: 'cartItems' }),
        el('div', { class: 'divider' }),
        el('div', { class: 'flex between' }, [el('span', { class: 'muted', text: 'Subtotal' }), el('span', { class: 'mono', id: 'cartSub', text: '₹0' })]),
        el('div', { class: 'flex between', style: 'margin-top:6px' }, [el('span', { class: 'muted', text: 'Wallet Balance' }), el('span', { class: 'mono', id: 'cartBal', text: '₹' + s.profile.wallet.toFixed(2) })]),
        el('button', { class: 'btn primary full', style: 'margin-top:12px', id: 'placeOrder', html: '<i data-lucide="zap"></i> Place Instant Order', disabled: true })
      ]),
      el('div', { class: 'card', id: 'queueCard', style: 'display:none' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', html: '<i data-lucide="timer"></i> Live Queue Token' })]),
        el('div', { class: 'empty', style: 'padding:10px' }, [
          el('div', { class: 'stat-val mono', id: 'tokenNo', style: 'font-size:32px' }),
          el('div', { class: 'muted', id: 'tokenStatus', style: 'margin-top:6px' }),
          el('div', { class: 'progress', style: 'margin-top:12px' }, [el('span', { id: 'tokenProg', style: 'width:0%;background:var(--emerald)' })]),
          el('div', { class: 'flex wrap', style: 'margin-top:12px' }, [el('span', { class: 'badge emerald', id: 'tokenReady' })])
        ])
      ])
    ]);
    grid.appendChild(left); grid.appendChild(right);
    container.appendChild(grid);

    renderChips();
    renderMenu();
    renderCart();
    wire();

    Nexus.ui.icons(container);
  }

  function renderChips() {
    const wrap = $('#catChips');
    wrap.innerHTML = '';
    categories.forEach(c => {
      const b = el('button', { type: 'button', class: 'chip ' + (currentCat === c ? 'active' : ''), text: c });
      b.onclick = () => { currentCat = c; renderChips(); renderMenu(); };
      wrap.appendChild(b);
    });
  }

  function renderMenu() {
    const s = Nexus.store.get();
    const g = $('#menuGrid');
    g.innerHTML = '';
    s.menu.filter(m => currentCat === 'All' || m.category === currentCat).forEach(m => {
      const card = el('div', { class: 'menu-item' }, [
        el('div', { class: 'menu-thumb' }, m.emoji),
        el('div', { class: 'menu-body' }, [
          el('div', { class: 'menu-name', text: m.name }),
          el('div', { class: 'row-sub', text: m.category + ' · Prep ~' + m.prep + ' min' }),
          el('div', { class: 'menu-foot' }, [
            el('div', { class: 'menu-price', text: '₹' + m.price }),
            el('div', { class: 'qty' }, [
              el('button', { html: '<i data-lucide="minus"></i>', onclick: () => { setQty(m.id, Math.max(0, (cart[m.id]||0) - 1)); renderCart(); } }),
              el('span', { text: String(cart[m.id]||0) }),
              el('button', { html: '<i data-lucide="plus"></i>', onclick: () => { setQty(m.id, (cart[m.id]||0) + 1); renderCart(); } })
            ])
          ])
        ])
      ]);
      g.appendChild(card);
    });
    Nexus.ui.icons(g);
  }

  function setQty(id, q) { if (q <= 0) delete cart[id]; else cart[id] = q; renderCart(); }

  function renderCart() {
    const s = Nexus.store.get();
    const items = $('#cartItems'), count = $('#cartCount'), subEl = $('#cartSub'), balEl = $('#cartBal'), place = $('#placeOrder');
    items.innerHTML = '';
    const list = [];
    Object.keys(cart).forEach(id => {
      const m = s.menu.find(x => x.id === id);
      if (!m) return;
      list.push({ m, qty: cart[id], amt: m.price * cart[id] });
    });
    if (!list.length) { items.appendChild(el('div', { class: 'empty', style: 'padding:16px' }, 'Your cart is empty')); }
    list.forEach(it => {
      items.appendChild(el('div', { class: 'row' }, [
        el('div', { class: 'avatar', text: it.m.name.slice(0,2) }),
        el('div', { class: 'grow' }, [el('div', { class: 'row-title', text: it.m.name }), el('div', { class: 'row-sub', text: 'Qty ' + it.qty + ' × ₹' + it.m.price })]),
        el('div', { class: 'row-title mono', text: '₹' + it.amt })
      ]));
    });
    const sub = list.reduce((a,b) => a + b.amt, 0);
    count.textContent = list.reduce((a,b) => a + b.qty, 0) + ' items';
    subEl.textContent = '₹' + sub;
    balEl.textContent = '₹' + s.profile.wallet.toFixed(2);
    place.disabled = sub === 0 || s.profile.wallet < sub;
  }

  function wire() {
    $('#cafeTopup').onclick = () => { Nexus.store.topUp(500); render(document.querySelector('#tab-cafeteria')); Nexus.ui.toast('Wallet topped up', 'Added ₹500 to Campus Wallet', 'success'); };
    $('#placeOrder').onclick = place;
  }

  function place() {
    const s = Nexus.store.get();
    const list = [];
    Object.keys(cart).forEach(id => {
      const m = s.menu.find(x => x.id === id);
      if (m) list.push({ m, qty: cart[id], amt: m.price * cart[id] });
    });
    const sub = list.reduce((a,b) => a + b.amt, 0);
    if (sub > s.profile.wallet) { Nexus.ui.toast('Insufficient wallet balance', 'Top up to continue', 'error'); return; }
    Nexus.store.addTxn(sub, 'Cafeteria Order');
    const order = {
      id: 'ord_' + Math.random().toString(36).slice(2, 9),
      items: list.map(x => ({ id: x.m.id, name: x.m.name, qty: x.qty, price: x.m.price, amt: x.amt })),
      amount: sub, at: new Date().toISOString(), token: 'TK-' + Math.floor(100 + Math.random()*900), estReady: Math.max(...list.map(x => x.m.prep)) + 2
    };
    Nexus.store.addOrder(order);
    cart = {};
    render(document.querySelector('#tab-cafeteria'));
    showToken(order);
    Nexus.ui.toast('Order placed successfully', 'Digital queue token generated', 'success');
    // update cafeteria crowd to high for demo
    Nexus.store.setCrowd('cafeteria', 'high');
  }

  function showToken(order) {
    const card = $('#queueCard'), no = $('#tokenNo'), status = $('#tokenStatus'), prog = $('#tokenProg'), ready = $('#tokenReady');
    card.style.display = 'block';
    no.textContent = order.token;
    let sec = order.estReady * 60;
    status.textContent = 'Order Preparing · ETA ' + order.estReady + ' min';
    ready.textContent = '';
    prog.style.width = '10%';
    const iv = setInterval(() => {
      sec -= 10;
      const p = 100 - Math.max(0, Math.round((sec / (order.estReady * 60)) * 100));
      prog.style.width = Math.min(100, p) + '%';
      if (sec <= 60) {
        status.textContent = 'Order Preparing → Ready for Pickup';
        ready.textContent = 'Ready for pickup shortly';
      }
      if (sec <= 0) {
        clearInterval(iv);
        status.textContent = 'Ready for Pickup';
        ready.textContent = 'Collect your order at counter';
        prog.style.width = '100%';
        Nexus.ui.toast('Order Ready for Pickup', order.token + ' is ready', 'success');
      }
    }, 5000);
  }

  return { render };
})();
