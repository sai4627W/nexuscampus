/* ============================================================
   map.js - interactive SVG campus map + routing + indoor + heatmap
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.map = (function () {
  const { $, $$, el, clamp } = Nexus.util;
  let svg, g, viewBox, vb = { x: 0, y: 0, w: 1000, h: 700 };
  let zoom = 1;
  let startNode = null, endNode = null, currentRoute = null;
  let indoorView = { building: null, floor: 'Ground Floor' };

  function panStart(e) {
    const pt = getPt(e);
    svg.dataset.px = pt.x; svg.dataset.py = pt.y; svg.classList.add('dragging');
    window.addEventListener('mousemove', panMove);
    window.addEventListener('mouseup', panEnd);
    window.addEventListener('touchmove', panMove, { passive: false });
    window.addEventListener('touchend', panEnd);
  }
  function panMove(e) { e.preventDefault(); const pt = getPt(e), dx = pt.x - svg.dataset.px, dy = pt.y - svg.dataset.py; svg.dataset.px = pt.x; svg.dataset.py = pt.y; vb.x -= dx / zoom; vb.y -= dy / zoom; setVB(); }
  function panEnd() { svg.classList.remove('dragging'); window.removeEventListener('mousemove', panMove); window.removeEventListener('mouseup', panEnd); window.removeEventListener('touchmove', panMove); window.removeEventListener('touchend', panEnd); }
  function getPt(e) { const r = svg.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left, y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top; return { x: (x / zoom) + vb.x, y: (y / zoom) + vb.y }; }
  function setZoom(z, cx = 500, cy = 350) { const nz = clamp(z, 0.8, 2.6); const wx = (cx - vb.x) / vb.w, wy = (cy - vb.y) / vb.h; vb.w = 1000 / nz; vb.h = 700 / nz; vb.x = cx - vb.w * wx; vb.y = cy - vb.h * wy; zoom = nz; setVB(); }
  function setVB() { svg.setAttribute('viewBox', `${Math.round(vb.x)} ${Math.round(vb.y)} ${Math.round(vb.w)} ${Math.round(vb.h)}`); }

  function init(container) {
    container.innerHTML = '';
    const wrap = el('div', { class: 'map-wrap' }, [
      el('svg', { class: 'map-svg', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 1000 700', id: 'campusSvg' }),
      el('div', { class: 'map-toolbar' }, [
        el('div', { class: 'seg' }, [
          el('button', { text: 'Start', id: 'selStart', class: 'active' }),
          el('button', { text: 'End', id: 'selEnd' }),
          el('button', { text: 'Clear', id: 'clearRoute' }),
          el('button', { text: 'Indoor', id: 'toggleIndoor' }),
          el('button', { text: 'Heatmap', id: 'toggleHeatmap' })
        ]),
        el('select', { class: 'select', id: 'startSel', style: 'height:36px' }),
        el('select', { class: 'select', id: 'endSel', style: 'height:36px' }),
        el('div', { class: 'muted', text: 'Click nodes or use dropdowns', style: 'align-self:center' })
      ]),
      el('div', { class: 'map-legend' }),
      el('div', { class: 'map-zoom' }, [
        el('button', { class: 'icon-btn', id: 'zoomIn', html: '<i data-lucide="plus"></i>' }),
        el('button', { class: 'icon-btn', id: 'zoomOut', html: '<i data-lucide="minus"></i>' }),
        el('button', { class: 'icon-btn', id: 'zoomFit', html: '<i data-lucide="maximize-2"></i>' })
      ])
    ]);
    container.appendChild(wrap);
    svg = wrap.querySelector('#campusSvg');
    viewBox = svg.viewBox.baseVal;
    vb = { x: 0, y: 0, w: 1000, h: 700 };
    svg.addEventListener('mousedown', panStart);
    svg.addEventListener('touchstart', panStart, { passive: true });
    $('#zoomIn').onclick = () => setZoom(zoom * 1.2);
    $('#zoomOut').onclick = () => setZoom(zoom / 1.2);
    $('#zoomFit').onclick = () => { vb = { x: 0, y: 0, w: 1000, h: 700 }; zoom = 1; setVB(); };
    $('#clearRoute').onclick = clearRoute;
    $('#toggleHeatmap').onclick = () => { state.heat = !state.heat; render(); Nexus.ui.toast(state.heat ? 'Heatmap enabled' : 'Heatmap disabled', 'Crowd density overlay', 'info'); };
    $('#toggleIndoor').onclick = () => openIndoorPicker();
    $('#selStart').onclick = () => { state.mode = 'start'; renderToolbar(); };
    $('#selEnd').onclick = () => { state.mode = 'end'; renderToolbar(); };
    Nexus.ui.icons(wrap);
    render();
  }

  const state = { heat: false, mode: 'start' };

  function renderToolbar() {
    const s = Nexus.store.get();
    const startSel = $('#startSel'), endSel = $('#endSel');
    if (startSel) { startSel.innerHTML = ''; s.nodes.forEach(n => startSel.appendChild(el('option', { value: n.id, selected: startNode === n.id }, n.name))); startSel.onchange = e => { startNode = e.target.value; computeRoute(); render(); }; }
    if (endSel) { endSel.innerHTML = ''; s.nodes.forEach(n => endSel.appendChild(el('option', { value: n.id, selected: endNode === n.id }, n.name))); endSel.onchange = e => { endNode = e.target.value; computeRoute(); render(); }; }
    $('#selStart').classList.toggle('active', state.mode === 'start');
    $('#selEnd').classList.toggle('active', state.mode === 'end');
  }

  function clearRoute() { startNode = null; endNode = null; currentRoute = null; render(); Nexus.ui.toast('Route cleared', 'Start and end removed', 'info'); }

  function computeRoute() {
    if (startNode && endNode) {
      currentRoute = Nexus.graph.shortestPath(startNode, endNode);
      if (!currentRoute) { Nexus.ui.toast('No route found', 'Could not connect selected nodes', 'error'); }
      else { render(); showRouteModal(); }
    } else { currentRoute = null; render(); }
  }

  function showRouteModal() {
    const s = Nexus.store.get();
    const map = {};
    s.nodes.forEach(n => map[n.id] = n);
    const r = currentRoute;
    if (!r) return;
    const dist = r.distance, mins = Nexus.graph.walkTime(dist);
    const dirs = Nexus.graph.directions(r);
    const body = el('div', {}, [
      el('div', { class: 'bento grid-2' }, [
        el('div', { class: 'card' }, [
          el('div', { class: 'card-title', html: '<i data-lucide="map-pin"></i> Start' }),
          el('div', { class: 'row-title', text: map[r.path[0]].name }),
          el('div', { class: 'row-sub', text: map[r.path[0]].desc })
        ]),
        el('div', { class: 'card' }, [
          el('div', { class: 'card-title', html: '<i data-lucide="flag"></i> Destination' }),
          el('div', { class: 'row-title', text: map[r.path[r.path.length - 1]].name }),
          el('div', { class: 'row-sub', text: map[r.path[r.path.length - 1]].desc })
        ])
      ]),
      el('div', { class: 'card', style: 'margin-top:14px' }, [
        el('div', { class: 'flex wrap between' }, [
          el('div', { class: 'stat-ico', style: 'background:var(--cyan-dim);color:var(--cyan)', html: '<i data-lucide="ruler"></i>' }),
          el('div', { class: 'flex' }, [el('span', { class: 'badge cyan', text: dist + ' m' }), el('span', { class: 'badge emerald', text: mins + ' min walk' })])
        ])
      ]),
      el('div', { class: 'card', style: 'margin-top:14px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:10px', html: '<i data-lucide="route"></i> Turn-by-turn directions' }),
        el('div', { class: 'stack' }, dirs.map(d => el('div', { class: 'row' }, [
          el('div', { class: 'icon-btn ghost', html: '<i data-lucide="' + d.icon + '"></i>' }),
          el('div', { class: 'grow' }, [el('div', { class: 'row-title', text: d.text }), el('div', { class: 'row-sub', text: d.meta })])
        ])))
      ])
    ]);
    const foot = el('div', { class: 'modal-foot' }, [
      el('button', { class: 'btn ghost', text: 'Close', onclick: Nexus.ui.closeModal }),
      el('button', { class: 'btn primary', html: '<i data-lucide="navigation"></i> Start Navigation', onclick: () => { Nexus.ui.closeModal(); Nexus.ui.toast('Navigation active', 'Following highlighted route', 'success'); } })
    ]);
    Nexus.ui.openModal(Nexus.ui.modalShell('Route Details', 'route', body, foot));
  }

  function openIndoorPicker() {
    const s = Nexus.store.get();
    const buildings = ['academic_a', 'ai_lab', 'library'];
    const body = el('div', {}, [
      el('div', { class: 'field' }, [
        el('label', { text: 'Building' }),
        el('select', { class: 'select', id: 'indoorBuilding' }, buildings.map(b => {
          const n = s.nodes.find(x => x.id === b);
          return el('option', { value: b, selected: indoorView.building === b }, n ? n.name : b);
        }))
      ]),
      el('div', { class: 'field' }, [
        el('label', { text: 'Floor' }),
        el('div', { class: 'seg', id: 'floorSeg' }, ['Ground Floor', '1st Floor', '2nd Floor'].map(f =>
          el('button', { type: 'button', text: f, class: f === indoorView.floor ? 'active' : '' })
        ))
      ]),
      el('div', { id: 'indoorList' })
    ]);
    const foot = el('div', { class: 'modal-foot' }, [
      el('button', { class: 'btn ghost', text: 'Close', onclick: Nexus.ui.closeModal }),
      el('button', { class: 'btn primary', text: 'Switch View', onclick: () => {
        const b = body.querySelector('#indoorBuilding').value;
        indoorView.building = b; indoorView.floor = floorSegActive();
        Nexus.ui.closeModal();
        renderIndoor();
      } })
    ]);
    Nexus.ui.openModal(Nexus.ui.modalShell('Indoor Floor Explorer', 'building', body, foot));
    body.querySelector('#indoorBuilding').onchange = updateIndoorList;
    $$('#floorSeg button').forEach(btn => btn.onclick = () => { $$('#floorSeg button').forEach(x => x.classList.remove('active')); btn.classList.add('active'); updateIndoorList(); });
    updateIndoorList();
    function floorSegActive() { return $$('#floorSeg button').find(x => x.classList.contains('active'))?.textContent || 'Ground Floor'; }
    function updateIndoorList() {
      const b = body.querySelector('#indoorBuilding').value;
      const f = floorSegActive();
      const data = s.indoors[b]?.[f] || [];
      const list = $('#indoorList');
      list.innerHTML = data.length ? '' : el('div', { class: 'empty', html: '<i data-lucide="door-open"></i><div>No indoor data for this floor</div>' }).outerHTML;
      data.forEach(r => {
        const badge = r.status === 'Free' ? 'emerald' : (r.status === 'Occupied' ? 'rose' : (r.status === 'Partially Free' ? 'amber' : 'muted'));
        list.appendChild(el('div', { class: 'row' }, [
          el('div', { class: 'avatar', text: r.room.slice(-2) || 'RM' }),
          el('div', { class: 'grow' }, [el('div', { class: 'row-title', text: r.name + ' · ' + r.room }), el('div', { class: 'row-sub', text: r.detail })]),
          el('span', { class: 'badge ' + badge, text: r.status })
        ]));
      });
      Nexus.ui.refresh(list);
    }
  }

  function renderIndoor() {
    const s = Nexus.store.get();
    const b = indoorView.building, f = indoorView.floor;
    if (!b) return;
    const n = s.nodes.find(x => x.id === b);
    Nexus.ui.toast('Indoor View', (n?.name || b) + ' · ' + f, 'indigo');
  }

  function render() {
    const s = Nexus.store.get();
    const mapN = {};
    s.nodes.forEach(n => mapN[n.id] = n);
    svg.innerHTML = '';
    // defs
    const defs = el('defs');
    defs.innerHTML = `
      <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="heatGrad"><stop offset="0%" stop-color="rgba(251,113,133,0.28)"/><stop offset="60%" stop-color="rgba(251,113,133,0.12)"/><stop offset="100%" stop-color="transparent"/></radialGradient>`;
    svg.appendChild(defs);

    // edges base
    const edgesG = el('g');
    s.edges.forEach(([a,b,w]) => {
      const na = mapN[a], nb = mapN[b];
      if (!na || !nb) return;
      const path = el('path', { class: 'edge', d: `M ${na.x} ${na.y} L ${nb.x} ${nb.y}` });
      edgesG.appendChild(path);
    });
    svg.appendChild(edgesG);

    // heatmap
    if (state.heat) {
      const heatG = el('g', { class: 'heat' });
      s.nodes.forEach(n => {
        const lvl = s.crowd[n.id] || 'low';
        const r = lvl === 'high' ? 38 : (lvl === 'medium' ? 26 : 16);
        const op = lvl === 'high' ? 0.22 : (lvl === 'medium' ? 0.16 : 0.10);
        const c = el('circle', { cx: n.x, cy: n.y, r, fill: 'url(#heatGrad)', opacity: op });
        heatG.appendChild(c);
        const dot = el('circle', { cx: n.x, cy: n.y, r: 4, fill: 'rgba(251,113,133,0.9)' });
        heatG.appendChild(dot);
      });
      svg.appendChild(heatG);
    }

    // route
    if (currentRoute && currentRoute.path.length >= 2) {
      const rpath = currentRoute.path.map(id => mapN[id]).filter(Boolean);
      let d = `M ${rpath[0].x} ${rpath[0].y}`;
      for (let i = 1; i < rpath.length; i++) d += ` L ${rpath[i].x} ${rpath[i].y}`;
      svg.appendChild(el('path', { class: 'route-path', d }));
      // arrows at midpoint
      for (let i = 0; i < rpath.length - 1; i++) {
        const a = rpath[i], b = rpath[i + 1];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        const gArr = el('g', { transform: `translate(${mx},${my}) rotate(${ang})` });
        gArr.appendChild(el('polygon', { class: 'route-arrow', points: '0,-6 10,0 0,6', opacity: 0.98 }));
        svg.appendChild(gArr);
      }
    }

    // edges highlight
    if (currentRoute && currentRoute.path.length >= 2) {
      for (let i = 0; i < currentRoute.path.length - 1; i++) {
        const a = mapN[currentRoute.path[i]], b = mapN[currentRoute.path[i+1]];
        if (!a || !b) continue;
        svg.appendChild(el('path', { class: 'edge active', d: `M ${a.x} ${a.y} L ${b.x} ${b.y}` }));
      }
    }

    // nodes
    const nodesG = el('g');
    s.nodes.forEach(n => {
      const g = el('g', { class: 'node-group' });
      g.onclick = () => selectNode(n.id);
      const lvl = s.crowd[n.id] || 'low';
      const r = lvl === 'high' ? 9 : (lvl === 'medium' ? 7 : 5);
      const isStart = startNode === n.id, isEnd = endNode === n.id, isRoute = currentRoute?.path.includes(n.id);
      const base = isStart || isEnd ? 'var(--cyan)' : (isRoute ? 'var(--cyan)' : 'var(--indigo)');
      const stroke = isStart ? 'var(--emerald)' : (isEnd ? 'var(--rose)' : 'rgba(255,255,255,0.16)');
      g.appendChild(el('circle', { class: 'node', cx: n.x, cy: n.y, r, fill: base, stroke, 'stroke-width': 2, filter: isRoute ? 'url(#glow)' : null }));
      // label
      g.appendChild(el('text', { class: 'node-label', x: n.x, y: n.y - 12, 'text-anchor': 'middle' }, n.short || n.name));
      g.appendChild(el('text', { class: 'node-sub', x: n.x, y: n.y + 12, 'text-anchor': 'middle' }, n.type));
      if (isStart) g.appendChild(el('circle', { cx: n.x - r - 2, cy: n.y, r: 3, fill: 'var(--emerald)' }));
      if (isEnd) g.appendChild(el('circle', { cx: n.x + r + 2, cy: n.y, r: 3, fill: 'var(--rose)' }));
      nodesG.appendChild(g);
    });
    svg.appendChild(nodesG);

    // legend
    const leg = wrap.querySelector('.map-legend');
    leg.innerHTML = '';
    leg.appendChild(el('div', { class: 'legend-item' }, [el('span', { class: 'pulse-dot low' }), 'Low']));
    leg.appendChild(el('div', { class: 'legend-item' }, [el('span', { class: 'pulse-dot medium' }), 'Medium']));
    leg.appendChild(el('div', { class: 'legend-item' }, [el('span', { class: 'pulse-dot high' }), 'High']));
    leg.appendChild(el('div', { class: 'legend-item' }, [el('span', { style: 'width:10px;height:3px;background:var(--cyan)' }), 'Route']));

    Nexus.ui.refresh(svg);
    renderToolbar();
  }

  function selectNode(id) {
    if (state.mode === 'start') { startNode = id; state.mode = 'end'; }
    else { endNode = id; state.mode = 'start'; }
    computeRoute();
  }

  // API for commands
  function routeByNames(a, b) {
    const s = Nexus.store.get();
    const f = (name) => s.nodes.find(n => n.id === name || n.name.toLowerCase().includes(name.toLowerCase()) || n.short.toLowerCase().includes(name.toLowerCase()));
    const na = f(a), nb = f(b);
    if (!na || !nb) { Nexus.ui.toast('Could not resolve locations', a + ' → ' + b, 'error'); return false; }
    startNode = na.id; endNode = nb.id; computeRoute(); return true;
  }

  return { init, render, routeByNames, clearRoute };
})();
