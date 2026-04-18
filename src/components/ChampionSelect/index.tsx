import { useState } from 'react'
import { Champion } from '../../types'
import { getChampionIconUrl } from '../../utils/icons'

interface ChampionSelectProps {
  champions: Champion[]
  selected: string[]
  onToggle: (championId: string) => void
  mode?: 'multi' | 'single'
  filterByCost?: number[]
  maxSelected?: number
  className?: string
}

const costColor: Record<number, { border: string; bg: string; text: string }> = {
  1: { border: '#9ca3af', bg: '#374151', text: '#d1d5db' },
  2: { border: '#22c55e', bg: '#14532d', text: '#86efac' },
  3: { border: '#3b82f6', bg: '#1e3a5f', text: '#93c5fd' },
  4: { border: '#a855f7', bg: '#3b0764', text: '#d8b4fe' },
  5: { border: '#f59e0b', bg: '#451a03', text: '#fcd34d' },
}

const costFilterLabel: Record<number, string> = {
  1: '1★', 2: '2★', 3: '3★', 4: '4★', 5: '5★',
}

export default function ChampionSelect({
  champions,
  selected,
  onToggle,
  mode = 'multi',
  filterByCost,
  maxSelected,
  className = '',
}: ChampionSelectProps) {
  const [search, setSearch] = useState('')
  const [activeCost, setActiveCost] = useState<number | null>(null)

  const atMax = maxSelected !== undefined && selected.length >= maxSelected

  const availableCosts = filterByCost ?? [1, 2, 3, 4, 5]

  const filtered = champions.filter((c) => {
    if (!availableCosts.includes(c.cost)) return false
    if (activeCost !== null && c.cost !== activeCost) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleToggle(id: string) {
    if (mode === 'single') {
      onToggle(id)
      return
    }
    const isSelected = selected.includes(id)
    if (!isSelected && atMax) return
    onToggle(id)
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search champions…"
        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
      />

      {/* Cost filters */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setActiveCost(null)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            activeCost === null
              ? 'bg-white text-gray-900 font-bold'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {availableCosts.map((cost) => {
          const col = costColor[cost]
          const isActive = activeCost === cost
          return (
            <button
              key={cost}
              onClick={() => setActiveCost(isActive ? null : cost)}
              className="text-xs px-2 py-1 rounded font-bold transition-colors"
              style={{
                backgroundColor: isActive ? col.border : col.bg,
                color: isActive ? '#111827' : col.text,
                border: `1px solid ${col.border}`,
              }}
            >
              {costFilterLabel[cost]}
            </button>
          )
        })}
      </div>

      {/* Champion grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
        {filtered.map((champ) => {
          const isSelected = selected.includes(champ.id)
          const isDisabled = !isSelected && atMax
          const col = costColor[champ.cost]
          return (
            <button
              key={champ.id}
              onClick={() => handleToggle(champ.id)}
              disabled={isDisabled}
              className="flex flex-col items-center rounded overflow-hidden transition-all"
              style={{
                border: `2px solid ${isSelected ? '#ffffff' : col.border}`,
                opacity: isDisabled ? 0.35 : 1,
                backgroundColor: col.bg,
              }}
              title={champ.name}
            >
              <img
                src={getChampionIconUrl(champ.id)}
                alt={champ.name}
                className="w-full aspect-square object-cover"
                style={{ filter: isSelected ? 'brightness(1.15)' : 'brightness(0.85)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <span
                className="w-full text-center text-xs font-medium truncate px-0.5 py-0.5 leading-none"
                style={{ color: isSelected ? '#fff' : col.text, backgroundColor: isSelected ? col.border : col.bg }}
              >
                {champ.name}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <span className="col-span-full text-gray-500 text-sm text-center py-4">
            No champions found
          </span>
        )}
      </div>
    </div>
  )
}
