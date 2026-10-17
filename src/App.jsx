import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CommandPalette from './components/CommandPalette'
import Assistant from './components/Assistant'
import Toasts from './components/Toasts'
import MapView from './features/MapView'
import Attendance from './features/Attendance'
import Cafeteria from './features/Cafeteria'
import Facilities from './features/Facilities'
import Maintenance from './features/Maintenance'
import { useStore, toast } from './lib/store'
import { watchAuth, hasFirebase } from './lib/firebase'

export default function App() {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem('nexus.tab') || 'map' } catch { return 'map' } })
  const [palette, setPalette] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!hasFirebase) return
    return watchAuth((u) => setUser(u))
  }, [])
  const [routeSignal, setRouteSignal] = useState(null)
  const [checkInSignal, setCheckInSignal] = useState(0)
  const resetDemo = useStore((s) => s.resetDemo)

  useEffect(() => { try { localStorage.setItem('nexus.tab', tab) } catch {} }, [tab])

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) }
      if (e.key === 'Escape') { setPalette(false); setSidebarOpen(false) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => toast('NexusCampus OS ready', 'Ctrl+K for commands · Demo data loaded', 'success'), 400)
    return () => clearTimeout(t)
  }, [])

  // Live campus pulse: drift crowd levels every 45s so heatmap + crowd panel feel alive
  useEffect(() => {
    const id = setInterval(() => useStore.getState().tickCrowd(), 45000)
    return () => clearInterval(id)
  }, [])

  const onReset = useCallback(() => {
    resetDemo()
    toast('Demo data reset', 'Rich realistic seed restored', 'success')
  }, [resetDemo])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar tab={tab} setTab={setTab} onReset={onReset} user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="max-md:block hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onPalette={() => setPalette(true)} onAssistant={() => setAssistant(true)} onMenu={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 max-md:p-4">
          <div key={tab} className="anim-fadeUp">
            {tab === 'map' && <MapView routeSignal={routeSignal} />}
            {tab === 'attendance' && <Attendance checkInSignal={checkInSignal} />}
            {tab === 'cafeteria' && <Cafeteria />}
            {tab === 'facilities' && <Facilities />}
            {tab === 'maintenance' && <Maintenance />}
          </div>
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        setTab={setTab}
        routeSignal={routeSignal}
        setRouteSignal={setRouteSignal}
        setAssistantOpen={setAssistant}
        openCheckIn={() => setCheckInSignal(Date.now())}
      />
      <Assistant open={assistant} onClose={() => setAssistant(false)} setTab={setTab} setRouteSignal={setRouteSignal} />
      <Toasts />
    </div>
  )
}
