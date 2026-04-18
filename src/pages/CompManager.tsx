import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompStore } from '../stores/compStore'
import CompCard from '../components/CompCard'
import type { TeamComp } from '../types'

const TIER_GROUPS: { label: string; prefix: string }[] = [
  { label: 'S-tier', prefix: 'S' },
  { label: 'A-tier', prefix: 'A' },
  { label: 'B-tier', prefix: 'B' },
  { label: 'C-tier', prefix: 'C' },
  { label: 'D-tier', prefix: 'D' },
]

export default function CompManager() {
  const navigate = useNavigate()
  const { comps, importComps, deleteComp } = useCompStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string | null>(null)

  const filtered = comps.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (tierFilter && !c.rank.startsWith(tierFilter)) return false
    return true
  })

  function handleExport() {
    const json = JSON.stringify(comps, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comps.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as TeamComp[]
        if (Array.isArray(data)) {
          importComps(data)
        }
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">Comp Manager</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 transition-colors"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={comps.length === 0}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export All
          </button>
          <button
            onClick={() => navigate('/comps/new')}
            className="px-3 py-1.5 text-sm rounded bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold transition-colors"
          >
            + New Comp
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comps…"
          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setTierFilter(null)}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
              tierFilter === null
                ? 'bg-white text-gray-900 border-white'
                : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
            }`}
          >
            All
          </button>
          {TIER_GROUPS.map(({ label, prefix }) => (
            <button
              key={prefix}
              onClick={() => setTierFilter(tierFilter === prefix ? null : prefix)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                tierFilter === prefix
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((comp) => (
            <CompCard
              key={comp.id}
              comp={comp}
              onClick={() => navigate(`/comps/edit/${comp.id}`)}
              onEdit={() => navigate(`/comps/edit/${comp.id}`)}
              onDelete={() => {
                if (window.confirm(`Delete "${comp.name}"?`)) deleteComp(comp.id)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-16">
          {comps.length === 0
            ? 'No comps yet. Create your first comp!'
            : 'No comps match your search.'}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
