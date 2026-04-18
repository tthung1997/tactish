import { useState, useMemo } from 'react'
import { useSetData } from '../hooks/useSetData'
import { useCompStore } from '../stores/compStore'

// ── Cost colour helpers ───────────────────────────────────────────────────────

const COST_BORDER: Record<number, string> = {
  1: 'border-l-gray-400',
  2: 'border-l-green-500',
  3: 'border-l-blue-500',
  4: 'border-l-purple-500',
  5: 'border-l-amber-400',
}

const COST_TEXT: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
}

const COST_BG: Record<number, string> = {
  1: 'bg-gray-700',
  2: 'bg-green-900/60',
  3: 'bg-blue-900/60',
  4: 'bg-purple-900/60',
  5: 'bg-amber-900/60',
}

const COST_LABEL: Record<number, string> = {
  1: '1★',
  2: '2★',
  3: '3★',
  4: '4★',
  5: '5★',
}

// ── Trait colour cycling (simple palette) ─────────────────────────────────────

const TRAIT_CHIP_COLOURS = [
  'bg-cyan-900/60 text-cyan-300',
  'bg-indigo-900/60 text-indigo-300',
  'bg-rose-900/60 text-rose-300',
  'bg-emerald-900/60 text-emerald-300',
  'bg-orange-900/60 text-orange-300',
  'bg-violet-900/60 text-violet-300',
  'bg-sky-900/60 text-sky-300',
  'bg-teal-900/60 text-teal-300',
]

// ── Tab bar ───────────────────────────────────────────────────────────────────

type Tab = 'champions' | 'items' | 'traits'

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? 'border-yellow-400 text-yellow-400'
          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
      }`}
    >
      {label}
    </button>
  )
}

// ── Champions tab ─────────────────────────────────────────────────────────────

function ChampionsTab() {
  const { champions, traits, traitById } = useSetData()
  const { comps } = useCompStore()

  const [search, setSearch] = useState('')
  const [costFilter, setCostFilter] = useState<number | null>(null)
  const [traitFilter, setTraitFilter] = useState<string>('all')

  // precompute: how many comps use each champion
  const champCompCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const comp of comps) {
      for (const cc of comp.champions) {
        counts[cc.championId] = (counts[cc.championId] ?? 0) + 1
      }
    }
    return counts
  }, [comps])

  // trait colour index map (stable)
  const traitColourIndex = useMemo(() => {
    const map: Record<string, number> = {}
    traits.forEach((t, i) => { map[t.id] = i % TRAIT_CHIP_COLOURS.length })
    return map
  }, [traits])

  const filtered = useMemo(() => {
    return champions.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (costFilter !== null && c.cost !== costFilter) return false
      if (traitFilter !== 'all' && !c.traits.includes(traitFilter)) return false
      return true
    })
  }, [champions, search, costFilter, traitFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search champions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-yellow-400"
        />

        {/* Cost filter */}
        <div className="flex gap-1">
          <button
            onClick={() => setCostFilter(null)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              costFilter === null ? 'bg-gray-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {([1, 2, 3, 4, 5] as const).map((cost) => (
            <button
              key={cost}
              onClick={() => setCostFilter(costFilter === cost ? null : cost)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                costFilter === cost
                  ? `${COST_BG[cost]} ${COST_TEXT[cost]} ring-1 ring-current`
                  : `bg-gray-800 ${COST_TEXT[cost]} hover:bg-gray-700`
              }`}
            >
              {COST_LABEL[cost]}
            </button>
          ))}
        </div>

        {/* Trait filter */}
        <select
          value={traitFilter}
          onChange={(e) => setTraitFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="all">All traits</option>
          {traits.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <span className="text-gray-500 text-xs">{filtered.length} champions</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((champ) => (
          <div
            key={champ.id}
            className={`bg-gray-800 border border-gray-700 border-l-4 ${COST_BORDER[champ.cost]} rounded-lg p-3 space-y-2`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm truncate">{champ.name}</span>
              <span className={`text-xs font-bold shrink-0 ${COST_TEXT[champ.cost]}`}>
                {COST_LABEL[champ.cost]}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {champ.traits.map((tid) => {
                const t = traitById[tid]
                const colour = TRAIT_CHIP_COLOURS[traitColourIndex[tid] ?? 0]
                return (
                  <span key={tid} className={`text-xs px-1.5 py-0.5 rounded ${colour}`}>
                    {t?.name ?? tid}
                  </span>
                )
              })}
            </div>

            {(champCompCount[champ.id] ?? 0) > 0 && (
              <div className="text-xs text-yellow-400 font-medium">
                Used in {champCompCount[champ.id]} comp{champCompCount[champ.id] !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">No champions match filters.</p>
      )}
    </div>
  )
}

// ── Items tab ─────────────────────────────────────────────────────────────────

function ItemsTab() {
  const { baseComponents, completedItems } = useSetData()
  const [search, setSearch] = useState('')

  // Map: componentId → completed item names that use it
  const componentUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const comp of completedItems) {
      for (const cid of comp.components) {
        if (!map[cid]) map[cid] = []
        if (!map[cid].includes(comp.name)) map[cid].push(comp.name)
      }
    }
    return map
  }, [completedItems])

  // Group completed items by first component
  const grouped = useMemo(() => {
    const filtered = search
      ? completedItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : completedItems

    const groups: Record<string, typeof completedItems> = {}
    for (const item of filtered) {
      const key = item.components[0]
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [completedItems, search])

  const componentMap = useMemo(
    () => Object.fromEntries(baseComponents.map((b) => [b.id, b.name])),
    [baseComponents],
  )

  return (
    <div className="space-y-8">
      {/* Base Components */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-gray-200">Components</h2>
        <div className="grid grid-cols-3 gap-3">
          {baseComponents.map((comp) => {
            const usedIn = componentUsageMap[comp.id] ?? []
            return (
              <div key={comp.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-1">
                <div className="font-semibold text-sm text-white">{comp.name}</div>
                {usedIn.length > 0 && (
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Used in: </span>
                    {usedIn.slice(0, 3).join(', ')}
                    {usedIn.length > 3 && <span className="text-gray-500"> +{usedIn.length - 3} more</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Completed Items */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-lg font-bold text-gray-200">Completed Items</h2>
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div className="space-y-5">
          {Object.entries(grouped).map(([firstCompId, items]) => (
            <div key={firstCompId}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {componentMap[firstCompId] ?? firstCompId}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const [c1, c2] = item.components
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                    >
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                        {componentMap[c1] ?? c1}
                      </span>
                      <span className="text-gray-500">+</span>
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                        {componentMap[c2] ?? c2}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-gray-500 py-10">No items match search.</p>
        )}
      </section>
    </div>
  )
}

// ── Traits tab ────────────────────────────────────────────────────────────────

const STAR_ICONS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐']

function TraitsTab() {
  const { traits, champions } = useSetData()
  const { comps } = useCompStore()

  // For each trait: which champions have it
  const traitChampions = useMemo(() => {
    const map: Record<string, typeof champions> = {}
    for (const t of traits) map[t.id] = []
    for (const c of champions) {
      for (const tid of c.traits) {
        if (map[tid]) map[tid].push(c)
      }
    }
    return map
  }, [traits, champions])

  // For each trait: how many comps include ≥1 champion with that trait
  const traitCompCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const comp of comps) {
      const traitsSeen = new Set<string>()
      for (const cc of comp.champions) {
        const champ = champions.find((c) => c.id === cc.championId)
        if (champ) {
          for (const tid of champ.traits) traitsSeen.add(tid)
        }
      }
      for (const tid of traitsSeen) {
        counts[tid] = (counts[tid] ?? 0) + 1
      }
    }
    return counts
  }, [comps, champions])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {traits.map((trait) => {
        const champList = traitChampions[trait.id] ?? []
        const compCount = traitCompCount[trait.id] ?? 0

        return (
          <div key={trait.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base text-white">{trait.name}</h3>
              {compCount > 0 && (
                <span className="text-xs text-yellow-400 font-medium shrink-0">
                  {compCount} comp{compCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed">{trait.description}</p>

            {/* Breakpoints */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {trait.breakpoints.map((bp, idx) => (
                <span
                  key={bp}
                  className="inline-flex items-center gap-1 bg-gray-700 rounded px-2 py-0.5 text-xs font-semibold text-gray-200"
                >
                  <span>{bp}</span>
                  <span className="text-yellow-400 text-[10px]">{STAR_ICONS[idx] ?? '⭐'}</span>
                </span>
              ))}
            </div>

            {/* Champions */}
            <div className="flex flex-wrap gap-1.5">
              {champList.map((c) => (
                <span
                  key={c.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${COST_BG[c.cost]} ${COST_TEXT[c.cost]}`}
                >
                  {c.name}
                  <span className="opacity-70">{COST_LABEL[c.cost]}</span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function Database() {
  const [activeTab, setActiveTab] = useState<Tab>('champions')

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">Database</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-700">
        <TabButton label="Champions" active={activeTab === 'champions'} onClick={() => setActiveTab('champions')} />
        <TabButton label="Items"     active={activeTab === 'items'}     onClick={() => setActiveTab('items')} />
        <TabButton label="Traits"    active={activeTab === 'traits'}    onClick={() => setActiveTab('traits')} />
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === 'champions' && <ChampionsTab />}
        {activeTab === 'items'     && <ItemsTab />}
        {activeTab === 'traits'    && <TraitsTab />}
      </div>
    </div>
  )
}
