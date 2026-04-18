import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useCompStore, seedSampleComps } from './stores/compStore'
import GameAssistant from './pages/GameAssistant'
import CompManager from './pages/CompManager'
import CompEditor from './pages/CompEditor'
import Database from './pages/Database'

function App() {
  const seeded = useCompStore(state => state.seeded)

  useEffect(() => {
    if (!seeded) {
      seedSampleComps()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-yellow-400 font-semibold'
      : 'text-gray-300 hover:text-white transition-colors'

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-6">
          {/* Logo + Set badge */}
          <div className="flex items-center gap-2 mr-2 shrink-0">
            <span className="font-bold text-yellow-400 text-lg tracking-tight">Tactish</span>
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded leading-none">
              Set 17
            </span>
          </div>

          {/* Nav links */}
          <NavLink to="/" end className={navLinkClass}>
            <span className="hidden sm:inline">Game Assistant</span>
            <span className="sm:hidden text-sm">Assist</span>
          </NavLink>
          <NavLink to="/comps" className={navLinkClass}>
            <span className="hidden sm:inline">Comp Manager</span>
            <span className="sm:hidden text-sm">Comps</span>
          </NavLink>
          <NavLink to="/database" className={navLinkClass}>
            <span className="hidden sm:inline">Database</span>
            <span className="sm:hidden text-sm">DB</span>
          </NavLink>
        </nav>

        <main className="p-4">
          <Routes>
            <Route path="/" element={<GameAssistant />} />
            <Route path="/comps" element={<CompManager />} />
            <Route path="/comps/new" element={<CompEditor />} />
            <Route path="/comps/edit/:id" element={<CompEditor />} />
            <Route path="/database" element={<Database />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App

