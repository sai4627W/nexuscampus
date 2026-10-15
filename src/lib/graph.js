export function buildAdj(nodes, edges) {
  const adj = {}
  nodes.forEach((n) => { adj[n.id] = [] })
  edges.forEach(([a, b, w]) => {
    if (!adj[a] || !adj[b]) return
    adj[a].push({ to: b, w })
    adj[b].push({ to: a, w })
  })
  return adj
}

export function shortestPath(nodes, edges, startId, endId) {
  const adj = buildAdj(nodes, edges)
  if (startId === endId) return { path: [startId], distance: 0 }
  const dist = {}, prev = {}, visited = new Set()
  nodes.forEach((n) => { dist[n.id] = Infinity })
  dist[startId] = 0
  while (visited.size < nodes.length) {
    let u = null, best = Infinity
    nodes.forEach((n) => {
      if (!visited.has(n.id) && dist[n.id] < best) { best = dist[n.id]; u = n.id }
    })
    if (u === null || u === endId) break
    visited.add(u)
    ;(adj[u] || []).forEach((e) => {
      if (visited.has(e.to)) return
      const nd = dist[u] + e.w
      if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u }
    })
  }
  if (dist[endId] === Infinity) return null
  const path = []
  let cur = endId
  while (cur) { path.unshift(cur); cur = prev[cur] }
  return { path, distance: Math.round(dist[endId]) }
}

export function edgeWeight(edges, a, b) {
  const e = edges.find((x) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a))
  return e ? e[2] : 0
}

export const walkTime = (m) => Math.max(1, Math.round(m / 81))

function bearing(a, b) {
  return ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 360) % 360
}

function turnWord(from, to) {
  const d = ((to - from + 540) % 360) - 180
  if (Math.abs(d) < 25) return 'Continue straight'
  if (d > 0) return d > 120 ? 'Make a U-turn' : d > 55 ? 'Turn right' : 'Bear right'
  return d < -120 ? 'Make a U-turn' : d < -55 ? 'Turn left' : 'Bear left'
}

export function directions(nodes, edges, route) {
  const map = Object.fromEntries(nodes.map((n) => [n.id, n]))
  if (!route || route.path.length < 2) return []
  const steps = [{ icon: 'start', text: 'Start at ' + map[route.path[0]].name, meta: 'Begin your walk' }]
  let prevB = null
  for (let i = 0; i < route.path.length - 1; i++) {
    const a = map[route.path[i]], b = map[route.path[i + 1]]
    const w = edgeWeight(edges, a.id, b.id)
    const brg = bearing(a, b)
    const text = prevB === null ? 'Head towards ' + b.name : turnWord(prevB, brg) + ' toward ' + b.name
    steps.push({ icon: 'walk', text, meta: w + ' m · ~' + Math.max(1, Math.round(w / 81)) + ' min' })
    prevB = brg
  }
  const dest = map[route.path[route.path.length - 1]]
  steps.push({ icon: 'end', text: 'Arrive at ' + dest.name, meta: dest.desc })
  return steps
}

export function resolveNode(nodes, q) {
  const s = q.trim().toLowerCase()
  return nodes.find(
    (n) => n.id === s || n.name.toLowerCase().includes(s) || n.short.toLowerCase() === s || n.type === s
  )
}
