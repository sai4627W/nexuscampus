import { useEffect, useState } from 'react'
import { ShieldHalf, WashingMachine, BookOpen, Ticket, RefreshCw, Sparkles, ShieldCheck, Hourglass, UserCheck, QrCode, Play } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { uid, fmtDuration, nowMinutes, rnd } from '../lib/utils'
import { Card, CardTitle, Badge, Btn, Modal, Field, inputCls, areaCls, Empty } from '../components/ui'

function QrSvg({ pass }) {
  const text = pass.id + '|' + pass.out + '|' + pass.ret
  const seed = Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0)
  const cells = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (rnd(seed + r * 10 + c) > 0.5) cells.push([c, r])
  return (
    <svg width="120" height="120" viewBox="0 0 30 30">
      {cells.map(([c, r], i) => <rect key={i} x={c * 6} y={r * 6} width="6" height="6" fill="#34d399" />)}
      <text x="50%" y="97%" fontSize="3" fill="#9aa3b8" textAnchor="middle">{pass.id}</text>
    </svg>
  )
}

function useNow() {
  const [, setT] = useState(0)
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(id) }, [])
}

export default function Facilities() {
  const machines = useStore((s) => s.machines)
  const pods = useStore((s) => s.pods)
  const passes = useStore((s) => s.gatePasses)
  const profile = useStore((s) => s.profile)
  const addGatePass = useStore((s) => s.addGatePass)
  const updateGatePass = useStore((s) => s.updateGatePass)
  const updateAsset = useStore((s) => s.updateAsset)
  useNow()

  const [type, setType] = useState('Outing')
  const [loc, setLoc] = useState('')
  const [reason, setReason] = useState('')
  const [out, setOut] = useState('')
  const [ret, setRet] = useState('')
  const [qrPass, setQrPass] = useState(null)

  const submit = () => {
    if (!reason.trim()) return toast('Reason required', 'Enter purpose for gate pass', 'error')
    if (!out || !ret) return toast('Out & Return time required', 'Provide time window', 'error')
    const [oh, om] = out.split(':').map(Number), [rh, rm] = ret.split(':').map(Number)
    const outMin = oh * 60 + om, retMin = rh * 60 + rm
    const auto = outMin >= 360 && retMin <= 1260 && retMin > outMin
    const status = auto ? 'Approved' : 'Warden Review'
    addGatePass({ id: uid('gp'), type, reason: reason.trim(), loc: loc.trim() || 'Main Gate', out, ret, status, createdAt: new Date().toISOString() })
    setReason(''); setOut(''); setRet(''); setLoc('')
    toast(`Gate Pass ${status === 'Approved' ? 'Auto-Approved' : 'Submitted'}`, status === 'Warden Review' ? 'Requires warden approval (demo)' : 'QR generated with live validity', status === 'Approved' ? 'success' : 'warn')
  }

  const assetTile = (item, kind, icon, mins) => {
    const ends = item.endsAt ? new Date(item.endsAt).getTime() : null
    const left = item.status !== 'Available' && ends ? Math.max(0, Math.ceil((ends - Date.now()) / 1000)) : 0
    const tone = item.status === 'Available' ? 'emerald' : item.status === 'In Use' ? 'amber' : 'indigo'
    const Icon = icon
    return (
      <div key={item.id} className={`border rounded-[11px] p-3.5 bg-white/5 border-${tone}-400/30`}>
        <div className={`w-[34px] h-[34px] rounded-[9px] grid place-items-center mb-2.5 bg-${tone}-400/15 text-${tone}-300`}>
          <Icon size={18} />
        </div>
        <div className="font-bold text-[13px]">{item.name}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">Status: {item.status}{item.user ? ` · ${item.user}` : ''}</div>
        {item.status !== 'Available' && <div className="text-[11px] font-mono text-slate-400 mt-0.5">{left > 0 ? `Time left: ${fmtDuration(left)}` : 'Finishing…'}</div>}
        {item.status === 'Available'
          ? <Btn variant="emerald" className="w-full mt-2.5" onClick={() => {
              updateAsset(kind, item.id, { status: 'In Use', endsAt: new Date(Date.now() + mins * 60000).toISOString(), user: profile.name })
              toast(kind === 'machine' ? 'Machine booked' : 'Study Pod booked', `Session started · ${mins} min`, 'success')
            }}><Play size={14} /> Book & Start{kind === 'pod' ? ` (${mins} min)` : ''}</Btn>
          : <Btn variant="ghost" className="w-full mt-2.5" disabled>{item.status}</Btn>}
      </div>
    )
  }

  return (
    <div className="anim-fadeUp">
      <div className="mb-5">
        <div className="text-[22px] font-bold tracking-tight">Facilities & Gate Pass Automation</div>
        <div className="text-slate-400 text-[13px] mt-1">Digital gate pass with auto-approval, laundry & study pod slot booking</div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle icon={<ShieldHalf size={17} />} right={<Badge tone="cyan">Auto-Approval Rules Engine</Badge>}>Digital Gate Pass</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Pass Type"><select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}><option>Outing</option><option>Leave</option></select></Field>
            <Field label="Location / Block"><input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Main Gate" className={inputCls} /></Field>
          </div>
          <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Medical appointment, grocery run" className={areaCls} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Out Time (HH:MM)"><input type="time" value={out} onChange={(e) => setOut(e.target.value)} className={inputCls} /></Field>
            <Field label="Return Time (HH:MM)"><input type="time" value={ret} onChange={(e) => setRet(e.target.value)} className={inputCls} /></Field>
          </div>
          <Btn variant="primary" onClick={submit}><Sparkles size={16} /> Generate Digital Gate Pass</Btn>
          <div className="text-[11.5px] text-slate-500 mt-2">Rule: outings between 06:00–21:00 auto-approve · late-night goes to Warden Review.</div>
        </Card>

        <Card>
          <CardTitle icon={<Ticket size={17} />}>My Active Gate Passes</CardTitle>
          {passes.length === 0 && <Empty icon={<Ticket size={34} />}>No gate passes yet</Empty>}
          <div className="flex flex-col">
            {passes.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0 flex-wrap">
                <div className="w-[38px] h-[38px] rounded-full grid place-items-center bg-gradient-to-br from-indigo-400 to-cyan-400 text-[#05070c]">
                  {p.status === 'Approved' ? <ShieldCheck size={18} /> : <Hourglass size={18} />}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold text-[13.5px]">{p.type} · {p.loc}</div>
                  <div className="text-[11.5px] text-slate-500">{p.reason} · {p.out}–{p.ret}</div>
                  <div className="text-slate-600 font-mono text-[11px] mt-1">ID: {p.id}</div>
                </div>
                <Badge tone={p.status === 'Approved' ? 'emerald' : p.status === 'Warden Review' ? 'amber' : 'indigo'}>{p.status}</Badge>
                <Btn size="sm" variant="ghost" onClick={() => setQrPass(p)}>View QR</Btn>
                {p.status === 'Warden Review' && (
                  <Btn size="sm" variant="emerald" onClick={() => { updateGatePass(p.id, { status: 'Approved', approvedAt: new Date().toISOString() }); toast('Gate Pass Approved', `${p.id} approved (warden simulation)`, 'success') }}>
                    <UserCheck size={14} /> Simulate Warden Approval
                  </Btn>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={<WashingMachine size={17} />} right={<Btn size="sm" variant="ghost" onClick={() => toast('Facilities refreshed', 'Timers updated', 'info')}><RefreshCw size={14} /> Refresh</Btn>}>Smart Laundry</CardTitle>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
            {machines.map((m) => assetTile(m, 'machine', WashingMachine, 30))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={<BookOpen size={17} />}>Study Pod Booking</CardTitle>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
            {pods.map((p) => assetTile(p, 'pod', BookOpen, 45))}
          </div>
        </Card>
      </div>

      {qrPass && (
        <Modal title="Gate Pass QR" icon={<QrCode size={19} />} onClose={() => setQrPass(null)} footer={<Btn variant="primary" onClick={() => setQrPass(null)}>Done</Btn>}>
          <div className="text-center py-4">
            <div className="font-semibold">Scannable Dynamic SVG Gate Pass</div>
            <div className="text-xs text-slate-500 mb-3">{qrPass.type} · Valid {qrPass.out} – {qrPass.ret}</div>
            <div className="bg-[#0c0e15] p-[18px] rounded-2xl grid place-items-center"><QrSvg pass={qrPass} /></div>
            <div className="text-slate-500 font-mono text-xs mt-2.5">{qrPass.id}</div>
            <div className="mt-2.5"><Badge tone={qrPass.status === 'Approved' ? 'emerald' : 'amber'}>{qrPass.status}</Badge></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
