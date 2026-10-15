/* ============================================================
   graph.js - campus graph + Dijkstra shortest path + directions
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.graph = (function () {
  let adj = {};

  function build(nodes, edges) {
    adj = {};
    nodes.forEach((n) => { adj[n.id] = []; });
    edges.forEach(([a, b, w]) => {
      if (!adj[a] || !adj[b]) return;
      adj[a].push({ to: b, w });
      adj[b].push({ to: a, w });
    });
  }

  function nodeMap() {
    const map = {};
    Nexus.store.get().nodes.forEach((n) => { map[n.id] = n; });
    return map;
  }

  // Dijkstra with priority via simple array (campus is tiny)
  function shortestPath(startId, endId) {
    const nodes = Nexus.store.get().nodes;
    build(nodes, Nexus.store.get().edges);
    if (startId === endId) return { path: [startId], distance: 0 };

    const dist = {};
    const prev = {};
    const visited = new Set();
    nodes.forEach((n) => { dist[n.id] = Infinity; });
    dist[startId] = 0;

    while (visited.size < nodes.length) {
      let u = null, best = Infinity;
      nodes.forEach((n) => {
        if (!visited.has(n.id) && dist[n.id] < best) { best = dist[n.id]; u = n.id; }
      });
      if (u === null) break;
      if (u === endId) break;
      visited.add(u);
      (adj[u] || []).forEach((e) => {
        if (visited.has(e.to)) return;
        const nd = dist[u] + e.w;
        if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; }
      });
    }

    if (dist[endId] === Infinity) return null;
    const path = [];
    let cur = endId;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    return { path, distance: Math.round(dist[endId]) };
  }

  function edgeWeight(a, b) {
    const e = Nexus.store.get().edges.find((x) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a));
    return e ? e[2] : 0;
  }

  function walkTime(distanceMeters) {
    // average brisk campus walking speed ~1.35 m/s => ~81 m/min
    return Math.max(1, Math.round(distanceMeters / 81));
  }

  function bearing(a, b) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return (ang + 360) % 360;
  }

  function turnWord(fromDeg, toDeg) {
    let d = ((toDeg - fromDeg + 540) % 360) - 180;
    if (Math.abs(d) < 25) return 'Continue straight';
    if (d > 0) return d > 120 ? 'Make a U-turn' : (d > 55 ? 'Turn right' : 'Bear right');
    return d < -120 ? 'Make a U-turn' : (d < -55 ? 'Turn left' : 'Bear left');
  }

  // Human-friendly turn-by-turn directions
  function directions(route) {
    const map = nodeMap();
    if (!route || route.path.length < 2) return [];
    const steps = [];
    steps.push({
      icon: 'play',
      text: 'Start at ' + map[route.path[0]].name,
      meta: 'Begin your walk'
    });
    let prevBearing = null;
    for (let i = 0; i < route.path.length - 1; i++) {
      const a = map[route.path[i]];
      const b = map[route.path[i + 1]];
      const w = edgeWeight(a.id, b.id);
      const brg = bearing(a, b);
      let text;
      if (prevBearing === null) {
        text = 'Head towards ' + b.name;
      } else {
        text = turnWord(prevBearing, brg) + ' toward ' + b.name;
      }
      steps.push({
        icon: prevBearing === null ? 'navigation' : (turnWord(prevBearing, brg).startsWith('Turn left') || turnWord(prevBearing, brg).startsWith('Bear left') ? 'corner-up-left' : 'corner-up-right'),
        text,
        meta: w + ' m · ~' + Math.max(1, Math.round(w / 81)) + ' min'
      });
      prevBearing = brg;
    }
    const dest = map[route.path[route.path.length - 1]];
    steps.push({ icon: 'flag', text: 'Arrive at ' + dest.name, meta: dest.desc });
    return steps;
  }

  function neighbors(nodeId) {
    build(Nexus.store.get().nodes, Nexus.store.get().edges);
    return (adj[nodeId] || []).map((e) => e.to);
  }

  return { build, shortestPath, walkTime, directions, edgeWeight, neighbors };
})();
