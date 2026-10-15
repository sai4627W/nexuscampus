export const pad = (n) => String(n).padStart(2, '0')

export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9)

export function fmtClock(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d)
  return pad(x.getHours()) + ':' + pad(x.getMinutes()) + ':' + pad(x.getSeconds())
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec))
  return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60)
}

export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function rnd(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function formatAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff <= 1) return 'Just now'
  if (diff < 60) return diff + ' min ago'
  return Math.floor(diff / 60) + 'h ' + (diff % 60) + 'm ago'
}

export function attendanceColor(pct) {
  if (pct < 75) return 'rose'
  if (pct < 80) return 'amber'
  return 'emerald'
}
