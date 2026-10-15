import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Flag, Ruler, Route as RouteIcon, Navigation, Play, Building2, Flame, Plus, Minus, Maximize2, X, Footprints, Sparkles, Loader2 } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { shortestPath, edgeWeight, walkTime, directions } from '../lib/graph'
import { narrateRoute, hasGroq } from '../lib/groq'
import { Card, CardTitle, Badge, Btn, Modal, Field, inputCls } from '../components/ui'

export default function MapView({ routeSignal }) {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const crowd = useStore((s) => s.crowd)
  const indoors = useStore((s) => s.indoors)

  const [startId, setStartId] = useState('')
  const [endId, setEndId] = useState('')
  const [mode, setMode] = useState('start')
  const [showHeat, setShowHeat] = useState(false)
  const [vb, setVb] = useState({ x: 0, y: 0, w: 1000, h: 700 })
  const [routeOpen, setRouteOpen] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [narration, setNarration] = useState('')
  const [indoorOpen, setIndoorOpen] = useState(false)
  const [building, setBuilding] = useState('academic_a')
  const [floor, setFloor] = useState('Ground Floor')
  const drag = useRef(null)

  useEffect(() => {
    if (routeSignal?.from && routeSignal?.to) {
      setStartId(routeSignal.from); setEndId(routeSignal.to); setRouteOpen(true)
    }
  }, [routeSignal])

  const map = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  const route = useMemo(() => {
    if (!startId || !endId) return null
    return shortestPath(nodes, edges, startId, endId)
  }, [nodes, edges, startId, endId])

  const steps = useMemo(() => (route ? directions(nodes, edges, route) : []), [route, nodes, edges])
  const dist = route?.distance || 0

  const zoomBy = (f) => setVb((v) => {
    const w = Math.max(380, Math.min(1000, v.w / f)), h = (w * 700) / 1000
    const cx = v.x + v.w / 2, cy = v.y + v.h / 2
    return { w, h, x: cx - w / 2, y: cy - h / 2 }
  })

  const onDown = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { x: e.clientX - r.left, y: e.clientY - r.top, vx: vb.x, vy: vb.y, w: r.width, h: r.height }
  }
  const onMove = (e) => {
    if (!drag.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left - drag.current.x) * (vb.w / r.width)
    const dy = (e.clientY - r.top - drag.current.y) * (vb.h / r.height)
    setVb((v) => ({ ...v, x: drag.current.vx - dx, y: drag.current.vy - dy }))
  }

  const clickNode = (id) => {
    if (mode === 'start') { setStartId(id); setMode('end') }
    else { setEndId(id); setMode('start') }
  }

  useEffect(() => {
    if (startId && endId && route) setRouteOpen(true)
    // eslint-disable-next-line
  }, [startId, endId])

  const routeD = useMemo(() => {
    if (!route || route.path.length < 2) return ''
    const pts = route.path.map((id) => map[id]).filter(Boolean)
    return 'M ' + pts.map((p) => `${p.x} ${p.y}`).join(' L ')
  }, [route, map])

  const nodeById = (id) => map[id]
  const crowdOf = (id) => crowd[id] || 'low'

  return (
    <div className="anim-fadeUp">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[22px] font-bold tracking-tight">Live Wayfinding</div>
          <div className="text-slate-400 text-[13px] mt-1">Dijkstra shortest path · click nodes or use dropdowns · drag to pan</div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select value={startId} onChange={(e) => setStartId(e.target.value)} className={`${inputCls} !w-auto !h-9`}>
            <option value="">Start node…</option>
            {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={endId} onChange={(e) => setEndId(e.target.value)} className={`${inputCls} !w-auto !h-9`}>
            <option value="">Destination…</option>
            {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0c0e15]">
          <div className="absolute top-3.5 left-3.5 flex gap-2 flex-wrap z-[5]">
            <div className="inline-flex p-[3px] rounded-xl bg-white/5 border border-white/10">
              {['start', 'end'].map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`px-3.5 py-[7px] rounded-[9px] text-xs font-semibold cursor-pointer ${mode === m ? 'bg-white/10 text-white' : 'text-slate-400'}`}>{m === 'start' ? 'Start' : 'End'}</button>
              ))}
              <button onClick={() => { setStartId(''); setEndId(''); setRouteOpen(false); toast('Route cleared', 'Start and end removed', 'info') }} className="px-3.5 py-[7px] rounded-[9px] text-xs font-semibold text-slate-400 cursor-pointer">Clear</button>
              <button onClick={() => setIndoorOpen(true)} className="px-3.5 py-[7px] rounded-[9px] text-xs font-semibold text-slate-400 cursor-pointer">Indoor</button>
              <button onClick={() => { setShowHeat(!showHeat); toast(showHeat ? 'Heatmap disabled' : 'Heatmap enabled', 'Crowd density overlay', 'info') }} className={`px-3.5 py-[7px] rounded-[9px] text-xs font-semibold cursor-pointer ${showHeat ? 'bg-rose-400/15 text-rose-300' : 'text-slate-400'}`}>Heatmap</button>
            </div>
          </div>
          <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 z-[5]">
            <button onClick={() => zoomBy(1.25)} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-300 cursor-pointer hover:bg-white/10"><Plus size={18} /></button>
            <button onClick={() => zoomBy(0.8)} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-300 cursor-pointer hover:bg-white/10"><Minus size={18} /></button>
            <button onClick={() => setVb({ x: 0, y: 0, w: 1000, h: 700 })} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-300 cursor-pointer hover:bg-white/10"><Maximize2 size={16} /></button>
          </div>

          <svg
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="w-full h-[560px] block cursor-grab active:cursor-grabbing touch-none select-none"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={() => (drag.current = null)} onMouseLeave={() => (drag.current = null)}
          >
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <radialGradient id="heatGrad"><stop offset="0%" stopColor="rgba(251,113,133,0.28)" /><stop offset="60%" stopColor="rgba(251,113,133,0.12)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
            </defs>

            {edges.map(([a, b], i) => {
              const na = nodeById(a), nb = nodeById(b)
              if (!na || !nb) return null
              const active = route && route.path.includes(a) && route.path.includes(b) && Math.abs(route.path.indexOf(a) - route.path.indexOf(b)) === 1
              return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className={active ? 'edge-active' : 'edge-base'} style={active ? { strokeWidth: 3 } : undefined} />
            })}

            {showHeat && nodes.map((n) => {
              const lvl = crowdOf(n.id)
              const r = lvl === 'high' ? 42 : lvl === 'medium' ? 28 : 17
              return <g key={'h' + n.id} pointerEvents="none"><circle cx={n.x} cy={n.y} r={r} fill="url(#heatGrad)" /><circle cx={n.x} cy={n.y} r={4} fill="rgba(251,113,133,0.9)" /></g>
            })}

            {routeD && <path d={routeD} className="route-path" />}
            {route && route.path.slice(0, -1).map((id, i) => {
              const a = nodeById(route.path[i]), b = nodeById(route.path[i + 1])
              if (!a || !b) return null
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
              const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
              return <g key={i} transform={`translate(${mx},${my}) rotate(${ang})`}><polygon points="0,-6 10,0 0,6" fill="#22d3ee" /></g>
            })}

            {nodes.map((n) => {
              const isS = startId === n.id, isE = endId === n.id, onR = route?.path.includes(n.id)
              const base = isS || isE || onR ? '#22d3ee' : '#818cf8'
              return (
                <g key={n.id} onClick={() => clickNode(n.id)} className="cursor-pointer">
                  <circle cx={n.x} cy={n.y} r={crowdOf(n.id) === 'high' ? 9 : crowdOf(n.id) === 'medium' ? 7 : 5.5} fill={base} stroke={isS ? '#34d399' : isE ? '#fb7185' : 'rgba(255,255,255,0.2)'} strokeWidth={2} filter={onR ? 'url(#glow)' : undefined} />
                  <text x={n.x} y={n.y - 13} textAnchor="middle" fill="#e7eaf3" fontSize={11} fontWeight={700}>{n.short}</text>
                  <text x={n.x} y={n.y + 13} textAnchor="middle" fill="#5f6980" fontSize={9} fontFamily="monospace">{n.type}</text>
                </g>
              )
            })}
          </svg>

          <div className="absolute bottom-3.5 left-3.5 flex gap-3 flex-wrap px-3 py-2 rounded-[11px] bg-black/70 border border-white/10 text-[11px] text-slate-400 z-[5]">
            <span className="flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse" />Low</span>
            <span className="flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-amber-400 animate-pulse" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-rose-400 animate-pulse" />High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] bg-cyan-400" />Route</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardTitle icon={<Footprints size={17} />} right={route ? <><Badge tone="cyan">{dist} m</Badge><span className="ml-2" /><Badge tone="emerald">~{walkTime(dist)} min</Badge></> : null}>Route summary</CardTitle>
            {!route && <div className="text-slate-500 text-[13px]">Select a start and destination to compute the shortest walking route.</div>}
            {route && (
              <div className="flex flex-col gap-1">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                    <div className="w-8 h-8 grid place-items-center rounded-[9px] bg-white/5 border border-white/10 text-cyan-300"><Navigation size={15} /></div>
                    <div className="flex-1"><div className="font-semibold text-[13.5px]">{s.text}</div><div className="text-[11.5px] text-slate-500">{s.meta}</div></div>
                  </div>
                ))}
                <div className="flex gap-2 flex-wrap mt-2">
                  <Btn variant="primary" onClick={() => toast('Navigation active', 'Following highlighted route', 'success')}><Navigation size={16} /> Start Navigation</Btn>
                  {hasGroq() && (
                    <Btn variant="ghost" disabled={narrating} onClick={async () => {
                      setNarrating(true)
                      try {
                        const text = await narrateRoute(map[startId]?.name || startId, map[endId]?.name || endId, dist, walkTime(dist), steps)
                        setNarration(text)
                      } catch (e) { toast('AI narrator failed', String(e.message || e).slice(0, 120), 'error') }
                      finally { setNarrating(false) }
                    }}>{narrating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI Narrate Route</Btn>
                  )}
                </div>
                {narration && (
                  <div className="mt-3 p-3.5 rounded-[11px] bg-violet-400/10 border border-violet-400/25 text-[13px] leading-relaxed">
                    <div className="flex items-center gap-1.5 font-semibold mb-1.5 text-violet-300"><Sparkles size={14} /> AI walking guide</div>
                    {narration}
                  </div>
                )}
              </div>
            )}
          </Card>
          <Card>
            <CardTitle icon={<Flame size={17} />}>Live crowd & utility</CardTitle>
            <div className="flex flex-col gap-1">
              {nodes.map((n) => {
                const lvl = crowdOf(n.id)
                return (
                  <div key={n.id} className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-0">
                    <span className={`w-[7px] h-[7px] rounded-full animate-pulse ${lvl === 'high' ? 'bg-rose-400 shadow-[0_0_8px_#fb7185]' : lvl === 'medium' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
                    <div className="flex-1"><div className="font-semibold text-[13px]">{n.name}</div><div className="text-[11px] text-slate-500">{n.desc}</div></div>
                    <Badge tone={lvl === 'high' ? 'rose' : lvl === 'medium' ? 'amber' : 'emerald'}>{lvl}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {indoorOpen && (
        <Modal title="Indoor Floor Explorer" icon={<Building2 size={19} />} onClose={() => setIndoorOpen(false)} footer={<Btn variant="primary" onClick={() => { setIndoorOpen(false); toast('Indoor view', `${building} · ${floor}`, 'info') }}>Done</Btn>}>
          <Field label="Building">
            <select value={building} onChange={(e) => setBuilding(e.target.value)} className={inputCls}>
              {['academic_a', 'ai_lab', 'library'].map((b) => <option key={b} value={b}>{nodeById(b)?.name || b}</option>)}
            </select>
          </Field>
          <div className="inline-flex p-[3px] rounded-xl bg-white/5 border border-white/10 mb-4">
            {['Ground Floor', '1st Floor', '2nd Floor'].map((f) => (
              <button key={f} onClick={() => setFloor(f)} className={`px-3.5 py-[7px] rounded-[9px] text-xs font-semibold cursor-pointer ${floor === f ? 'bg-white/10 text-white' : 'text-slate-400'}`}>{f}</button>
            ))}
          </div>
          <div className="flex flex-col">
            {(indoors[building]?.[floor] || []).map((r) => (
              <div key={r.room} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                <div className="w-[38px] h-[38px] rounded-full grid place-items-center font-bold text-xs bg-gradient-to-br from-indigo-400 to-cyan-400 text-[#05070c]">{r.room.slice(-2)}</div>
                <div className="flex-1"><div className="font-semibold text-[13px]">{r.name} · {r.room}</div><div className="text-[11px] text-slate-500">{r.detail}</div></div>
                <Badge tone={r.status === 'Free' ? 'emerald' : r.status === 'Occupied' ? 'rose' : r.status === 'Partially Free' ? 'amber' : 'muted'}>{r.status}</Badge>
              </div>
            ))}
            {!(indoors[building]?.[floor]?.length) && <div className="text-slate-500 text-sm py-6 text-center">No indoor data for this floor</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}
