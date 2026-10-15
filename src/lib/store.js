import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seed } from './seed'
import { uid } from './utils'

export const useStore = create(
  persist(
    (set, get) => ({
      ...seed(),

      resetDemo: () => set(() => ({ ...seed() })),

      markAttendance: (id, present) =>
        set((s) => {
          const subjects = s.subjects.map((x) =>
            x.id === id ? { ...x, total: x.total + 1, attended: x.attended + (present ? 1 : 0) } : x
          )
          const sub = s.subjects.find((x) => x.id === id)
          const log = [
            { id: uid('log'), subjectId: id, code: sub?.code, present, at: new Date().toISOString() },
            ...s.attendanceLog,
          ].slice(0, 40)
          return { subjects, attendanceLog: log }
        }),

      topUp: (amt) => set((s) => ({ profile: { ...s.profile, wallet: Math.round((s.profile.wallet + amt) * 100) / 100 } })),
      spend: (amt) =>
        set((s) => ({ profile: { ...s.profile, wallet: Math.round((s.profile.wallet - amt) * 100) / 100 } })),

      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      setCrowd: (nodeId, level) => set((s) => ({ crowd: { ...s.crowd, [nodeId]: level } })),

      addGatePass: (pass) => set((s) => ({ gatePasses: [pass, ...s.gatePasses] })),
      updateGatePass: (id, patch) =>
        set((s) => ({ gatePasses: s.gatePasses.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
      updateTicket: (id, patch) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      updateAsset: (kind, id, patch) =>
        set((s) => {
          const key = kind === 'machine' ? 'machines' : 'pods'
          return { [key]: s[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) }
        }),

      // Live campus pulse: drift one random zone's crowd level (called on an interval)
      tickCrowd: () =>
        set((s) => {
          const keys = Object.keys(s.crowd)
          const pick = keys[Math.floor(Math.random() * keys.length)]
          const order = ['low', 'medium', 'high']
          const cur = order.indexOf(s.crowd[pick])
          const step = Math.random() < 0.5 ? -1 : 1
          const next = order[Math.max(0, Math.min(2, cur + step))]
          if (next === s.crowd[pick]) return {}
          return { crowd: { ...s.crowd, [pick]: next } }
        }),
    }),
    { name: 'nexuscampus.v2', version: 3 }
  )
)

// ---- toasts (tiny event bus, no dep) ----
let toastPush = null
export function registerToast(fn) { toastPush = fn }
export function toast(title, sub, kind = 'info') {
  if (toastPush) toastPush({ id: uid('t'), title, sub, kind })
}
