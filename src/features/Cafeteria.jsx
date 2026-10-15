import { useMemo, useState, useEffect } from 'react'
import { Coffee, ShoppingCart, Plus, Minus, PlusCircle, Zap, Timer, Sparkles, Loader2, ReceiptText } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { uid } from '../lib/utils'
import { recommendFood, hasGroq } from '../lib/groq'
import { Card, CardTitle, Badge, Btn, Progress } from '../components/ui'

const cats = ['All', 'Breakfast', 'Lunch', 'Beverages', 'Snacks']

export default function Cafeteria() {
  const menu = useStore((s) => s.menu)
  const profile = useStore((s) => s.profile)
  const spend = useStore((s) => s.spend)
  const topUp = useStore((s) => s.topUp)
  const addOrder = useStore((s) => s.addOrder)
  const setCrowd = useStore((s) => s.setCrowd)
  const orders = useStore((s) => s.orders)

  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState({})
  const [token, setToken] = useState(null) // {no, total, left, status}
  const [recs, setRecs] = useState(null)
  const [recLoading, setRecLoading] = useState(false)

  const askAI = async () => {
    setRecLoading(true)
    try {
      const r = await recommendFood(menu, profile.wallet, new Date().getHours())
      setRecs(r)
    } catch (e) { toast('AI recommender failed', String(e.message || e).slice(0, 120), 'error') }
    finally { setRecLoading(false) }
  }

  const items = useMemo(() => menu.filter((m) => cat === 'All' || m.category === cat), [menu, cat])
  const lines = useMemo(() => Object.entries(cart).map(([id, qty]) => {
    const m = menu.find((x) => x.id === id)
    return m ? { ...m, qty, amt: m.price * qty } : null
  }).filter(Boolean), [cart, menu])
  const sub = lines.reduce((a, b) => a + b.amt, 0)
  const count = lines.reduce((a, b) => a + b.qty, 0)

  // demo countdown: 60s = full prep
  useEffect(() => {
    if (!token) return
    if (token.left <= 0) return
    const id = setTimeout(() => setToken((t) => t && { ...t, left: t.left - 1 }), 1000)
    return () => clearTimeout(id)
  }, [token])

  useEffect(() => {
    if (token && token.left === 0 && token.status !== 'ready') {
      setToken((t) => ({ ...t, status: 'ready' }))
      toast('Order Ready for Pickup', `${token.no} is ready`, 'success')
    }
  }, [token])

  const setQty = (id, q) => setCart((c) => {
    const n = { ...c }
    if (q <= 0) delete n[id]; else n[id] = q
    return n
  })

  const place = () => {
    if (sub <= 0) return
    if (sub > profile.wallet) return toast('Insufficient wallet balance', 'Top up to continue', 'error')
    spend(sub)
    const tk = 'TK-' + Math.floor(100 + Math.random() * 900)
    const maxPrep = Math.max(...lines.map((l) => l.prep))
    addOrder({ id: uid('ord'), items: lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, price: l.price, amt: l.amt })), amount: sub, at: new Date().toISOString(), token: tk, estReady: maxPrep + 2 })
    setCart({})
    setToken({ no: tk, total: 60, left: 60, status: 'preparing', eta: maxPrep + 2 })
    setCrowd('cafeteria', 'high')
    toast('Order placed successfully', `Digital queue token ${tk} generated`, 'success')
  }

  const pct = token ? Math.round(((token.total - token.left) / token.total) * 100) : 0

  return (
    <div className="anim-fadeUp">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[22px] font-bold tracking-tight">Smart Cafeteria Pre-Order</div>
          <div className="text-slate-400 text-[13px] mt-1">Menu filters, live prep time, wallet checkout & queue token</div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge tone="cyan">Wallet: ₹{profile.wallet.toFixed(2)}</Badge>
          {hasGroq() && <Btn variant="ghost" disabled={recLoading} onClick={askAI}>{recLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI Recommend</Btn>}
          <Btn variant="ghost" onClick={() => { topUp(500); toast('Wallet topped up', 'Added Rs.500', 'success') }}><PlusCircle size={16} /> Top Up Rs.500</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle icon={<Coffee size={17} />} right={
              <div className="flex gap-2 flex-wrap">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition ${cat === c ? 'bg-indigo-400/15 text-indigo-300 border-indigo-400/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>{c}</button>)}</div>
            }>Menu</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((m) => (
                <div key={m.id} className="border border-white/10 rounded-[11px] overflow-hidden bg-white/5 flex flex-col">
                  <div className="h-24 grid place-items-center text-[34px] bg-gradient-to-br from-white/10 to-white/5">{m.emoji}</div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="font-semibold text-[13.5px]">{m.name}</div>
                    <div className="text-[11.5px] text-slate-500">{m.category} · Prep ~{m.prep} min</div>
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="font-mono text-emerald-300 font-semibold text-[13px]">₹{m.price}</div>
                      <div className="inline-flex items-center gap-0.5 bg-white/10 rounded-[9px] p-0.5">
                        <button onClick={() => setQty(m.id, Math.max(0, (cart[m.id] || 0) - 1))} className="w-[26px] h-[26px] grid place-items-center rounded-[7px] hover:bg-white/10 cursor-pointer"><Minus size={14} /></button>
                        <span className="min-w-5 text-center font-mono text-xs">{cart[m.id] || 0}</span>
                        <button onClick={() => setQty(m.id, (cart[m.id] || 0) + 1)} className="w-[26px] h-[26px] grid place-items-center rounded-[7px] hover:bg-white/10 cursor-pointer"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle icon={<ShoppingCart size={17} />} right={<Badge tone="muted">{count} items</Badge>}>Cart</CardTitle>
            <div className="flex flex-col">
              {lines.length === 0 && <div className="text-center py-4 text-slate-500 text-[13px]">Your cart is empty</div>}
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                  <div className="w-[38px] h-[38px] rounded-full grid place-items-center font-bold text-xs bg-gradient-to-br from-emerald-400 to-cyan-400 text-emerald-950">{l.name.slice(0, 2)}</div>
                  <div className="flex-1"><div className="font-semibold text-[13.5px]">{l.name}</div><div className="text-[11.5px] text-slate-500">Qty {l.qty} × ₹{l.price}</div></div>
                  <div className="font-semibold font-mono">₹{l.amt}</div>
                </div>
              ))}
            </div>
            <div className="h-px bg-white/10 my-3.5" />
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-mono">₹{sub}</span></div>
            <div className="flex justify-between text-sm mt-1.5"><span className="text-slate-500">Wallet Balance</span><span className="font-mono">₹{profile.wallet.toFixed(2)}</span></div>
            <Btn variant="primary" className="w-full mt-3" disabled={sub === 0 || profile.wallet < sub} onClick={place}><Zap size={16} /> Place Instant Order</Btn>
          </Card>

          {recs && (
            <Card>
              <CardTitle icon={<Sparkles size={17} />} right={<Badge tone="violet">AI picks</Badge>}>Recommended for you</CardTitle>
              <div className="flex flex-col gap-2">
                {recs.picks?.map((p) => {
                  const m = menu.find((x) => x.name.toLowerCase() === String(p.name || '').toLowerCase())
                  return (
                    <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-[11px] bg-violet-400/5 border border-violet-400/20">
                      <div className="flex-1"><div className="font-semibold text-[13px]">{p.name}</div><div className="text-[11.5px] text-slate-400">{p.reason}</div></div>
                      {m && <Btn size="sm" variant="emerald" onClick={() => { setQty(m.id, (cart[m.id] || 0) + 1); toast(`${m.name} added`, 'Added to cart by AI suggestion', 'success') }}><Plus size={14} /> Add</Btn>}
                    </div>
                  )
                })}
                {recs.note && <div className="text-[11.5px] text-slate-500">{recs.note}</div>}
              </div>
            </Card>
          )}

          {token && (
            <Card>
              <CardTitle icon={<Timer size={17} />}>Live Queue Token</CardTitle>
              <div className="text-center py-2.5">
                <div className="font-mono font-extrabold text-[32px]">{token.no}</div>
                <div className="text-slate-400 text-sm mt-1.5">{token.status === 'ready' ? 'Ready for Pickup' : `Order Preparing · ETA ${token.eta} min · demo ${token.left}s left`}</div>
                <div className="mt-3"><Progress value={pct} tone="emerald" /></div>
                <div className="mt-3"><Badge tone={token.status === 'ready' ? 'emerald' : 'amber'}>{token.status === 'ready' ? 'Collect your order at counter' : 'Preparing your order…'}</Badge></div>
              </div>
            </Card>
          )}

          <Card>
            <CardTitle icon={<ReceiptText size={17} />} right={<Badge tone="muted">{orders.length}</Badge>}>Order history</CardTitle>
            {orders.length === 0 && <div className="text-center py-4 text-slate-500 text-[13px]">No orders yet — place your first pre-order above.</div>}
            <div className="flex flex-col max-h-[260px] overflow-y-auto">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-[13px] font-mono">{o.token} · ₹{o.amount}</div>
                    <div className="text-[11px] text-slate-500">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')} · {new Date(o.at).toLocaleTimeString()}</div>
                  </div>
                  <Badge tone="emerald">Paid</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
