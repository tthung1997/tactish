import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { useCompStore } from '../stores/compStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSetData } from '../hooks/useSetData'
import { scoreAllComps, DEFAULT_WEIGHTS } from '../utils/scoring'
import ChampionSelect from '../components/ChampionSelect'
import ItemSelect from '../components/ItemSelect'
import ItemHelper from '../components/ItemHelper'
import CompCard from '../components/CompCard'
import HexGrid from '../components/HexGrid'
import CollapsibleSection from '../components/CollapsibleSection'
import type { PlacedChampion } from '../components/HexGrid'
import { getItemIconUrl, getGodIconUrl, DUMMY_ICON_URL } from '../utils/icons'
import { isDummy } from '../utils/dummy'
import type { CompSuggestion, TeamComp } from '../types'

// ── Section panel wrapper ────────────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  )
}

// ── Weights slider row ───────────────────────────────────────────────────────
function WeightSlider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-gray-400 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-yellow-400"
      />
      <span className="w-8 text-xs text-gray-200 text-right">{value.toFixed(1)}</span>
    </div>
  )
}


// ── Build HexGrid placements from a TeamComp ─────────────────────────────────
function buildPlacements(
  comp: TeamComp,
  championById: Record<string, { name: string; cost: 1 | 2 | 3 | 4 | 5 }>
): Record<string, PlacedChampion> {
  const placements: Record<string, PlacedChampion> = {}
  for (const cc of comp.champions) {
    if (!cc.position) continue
    const champ = isDummy(cc.championId)
      ? { name: 'Dummy', cost: 1 as const }
      : championById[cc.championId]
    if (!champ) continue
    placements[`${cc.position.row}-${cc.position.col}`] = {
      championId: cc.championId,
      championName: champ.name,
      cost: champ.cost,
      isCarry: cc.isCarry,
      icon: isDummy(cc.championId) ? DUMMY_ICON_URL : undefined,
    }
  }
  return placements
}

// ── Expanded comp detail panel ───────────────────────────────────────────────
function CompDetail({
  suggestion,
  championById,
  itemById,
  traitById,
  godById,
  selectedChampionIds,
  selectedGodIds,
}: {
  suggestion: CompSuggestion
  championById: Record<string, { id: string; name: string; cost: 1 | 2 | 3 | 4 | 5; traits: string[] }>
  itemById: Record<string, { id: string; name: string }>
  traitById: Record<string, { id: string; name: string; breakpoints: number[] }>
  godById: Record<string, { id: string; name: string; title: string }>
  selectedChampionIds: string[]
  selectedGodIds: string[]
}){
  const { comp } = suggestion

  const placements = useMemo(
    () => buildPlacements(comp, championById),
    [comp, championById]
  )
  const hasPositions = Object.keys(placements).length > 0

  const traitCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cc of comp.champions) {
      if (isDummy(cc.championId)) continue
      for (const tid of (championById[cc.championId]?.traits ?? []))
        counts[tid] = (counts[tid] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, trait: traitById[id] }))
      .filter((t) => t.trait)
      .sort((a, b) => b.count - a.count)
  }, [comp.champions, championById, traitById])

  const missingChampionIds = comp.champions
    .map((cc) => cc.championId)
    .filter((id) => !isDummy(id) && !selectedChampionIds.includes(id))

  const allNeededItemIds = [...new Set(comp.champions.flatMap((cc) => cc.items))]

  return (
    <div className="mt-3 pt-3 border-t border-gray-700 flex flex-col gap-4">
      {/* Board layout + Traits side by side */}
      {(hasPositions || traitCounts.length > 0) && (
        <div className="flex gap-4 items-start">
          {hasPositions && (
            <div className="shrink-0 overflow-x-auto">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Board Layout</p>
              <HexGrid placements={placements} interactive={false} />
            </div>
          )}

          {traitCounts.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Traits</p>
              <div className="flex flex-col gap-0.5">
                {traitCounts.map(({ id, count, trait }) => {
                  const active = (trait.breakpoints ?? []).filter((b) => count >= b).pop()
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs ${active !== undefined ? 'bg-amber-900/40 text-amber-200' : 'text-gray-400'}`}
                    >
                      <span className={`font-bold tabular-nums shrink-0 ${active !== undefined ? 'text-amber-400' : ''}`}>{count}</span>
                      <span className="truncate">{trait.name}</span>
                      <span className="ml-auto shrink-0 tabular-nums">
                        {(trait.breakpoints ?? []).map((bp, i) => (
                          <span key={bp} className={bp === active ? 'text-amber-400 font-bold' : 'text-gray-600'}>
                            {i > 0 && <span className="text-gray-700">/</span>}
                            {bp}
                          </span>
                        ))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Champions with items */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Champions</p>
        <div className="flex flex-col gap-1.5">
          {comp.champions.filter((cc) => !isDummy(cc.championId)).map((cc) => {
            const champ = championById[cc.championId]
            const isOwned = selectedChampionIds.includes(cc.championId)
            return (
              <div
                key={cc.championId}
                className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 ${
                  isOwned ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-gray-750 border border-gray-700'
                }`}
              >
                {cc.isCarry && <span title="Carry">⭐</span>}
                <span className={`font-semibold ${isOwned ? 'text-blue-200' : 'text-gray-300'}`}>
                  {champ?.name ?? cc.championId}
                </span>
                {cc.items.length > 0 && (
                  <span className="ml-auto flex gap-1">
                    {cc.items.map((itemId, i) => (
                      <img
                        key={`${itemId}-${i}`}
                        src={getItemIconUrl(itemId)}
                        alt={itemById[itemId]?.name ?? itemId}
                        title={itemById[itemId]?.name ?? itemId}
                        style={{ width: 22, height: 22, borderRadius: 3, border: '1px solid #4b5563' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ))}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Missing champions */}
      {missingChampionIds.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">
            Missing Champions ({missingChampionIds.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {missingChampionIds.map((id) => (
              <span key={id} className="px-2 py-0.5 rounded bg-red-900/30 border border-red-700/50 text-red-300 text-xs">
                {championById[id]?.name ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items needed */}
      {allNeededItemIds.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Items Needed</p>
          <div className="flex flex-wrap gap-1">
            {allNeededItemIds.map((id) => {
              const detail = suggestion.itemDetails.find((d) => d.completedItemId === id)
              const canBuild = detail?.canBuild
              const partial = detail ? detail.partialMatch > 0 : false
              return (
                <div
                  key={id}
                  title={`${itemById[id]?.name ?? id}${canBuild ? ' (can build)' : partial ? ' (partial)' : ''}`}
                  style={{
                    position: 'relative', width: 28, height: 28, borderRadius: 4, overflow: 'visible', flexShrink: 0,
                  }}
                >
                  <img
                    src={getItemIconUrl(id)}
                    alt={itemById[id]?.name ?? id}
                    style={{
                      width: 28, height: 28, borderRadius: 4, objectFit: 'cover', display: 'block',
                      border: `2px solid ${canBuild ? '#16a34a' : partial ? '#ca8a04' : '#4b5563'}`,
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  {(canBuild || partial) && (
                    <span style={{
                      position: 'absolute', bottom: -4, right: -4,
                      fontSize: 9, lineHeight: 1, background: canBuild ? '#16a34a' : '#ca8a04',
                      color: '#fff', borderRadius: 3, padding: '1px 2px',
                    }}>
                      {canBuild ? '✓' : '½'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {comp.notes && (
        <div>
          <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Notes</p>
          <p className="text-xs text-gray-300 leading-relaxed">{comp.notes}</p>
        </div>
      )}

      {/* Preferred gods */}
      {(comp.preferredGods ?? []).length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Preferred Gods</p>
          <div className="flex flex-wrap gap-2">
            {(comp.preferredGods ?? []).map((godId) => {
              const god = godById[godId]
              const isActive = selectedGodIds.includes(godId)
              return (
                <div
                  key={godId}
                  title={god ? `${god.name} — ${god.title}` : godId}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                    isActive ? 'bg-amber-900/40 border border-amber-600/60 text-amber-200' : 'bg-gray-700/50 border border-gray-600 text-gray-400'
                  }`}
                >
                  <img
                    src={getGodIconUrl(godId)}
                    alt={god?.name ?? godId}
                    style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>{god?.name ?? godId}</span>
                  {isActive && <span className="text-amber-400">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Keyboard shortcuts modal ─────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-600 rounded-xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">⌨ Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {[
            { key: 'Esc', desc: 'Clear all selections' },
            { key: '?',   desc: 'Toggle this help' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs font-mono text-yellow-300 shrink-0">
                {key}
              </kbd>
              <span className="text-gray-300 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GameAssistant() {
  const { selectedChampionIds, selectedComponentIds, selectedGodIds, toggleChampion, toggleComponent, toggleGod, clearAll } =
    useGameStore()
  const { comps } = useCompStore()
  const { weights, setWeights } = useSettingsStore()
  const { champions, baseComponents, completedItems, championById, itemById, traitById, gods, godById } = useSetData()

  const [showWeights, setShowWeights] = useState(false)
  const [expandedCompId, setExpandedCompId] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else {
          clearAll()
        }
      } else if (e.key === '?') {
        setShowShortcuts((v) => !v)
      }
    },
    [clearAll, showShortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Computed component counts for ItemSelect
  const componentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const id of selectedComponentIds) counts[id] = (counts[id] ?? 0) + 1
    return counts
  }, [selectedComponentIds])

  // Set component count: remove all then add N
  function setComponentCount(componentId: string, count: number) {
    useGameStore.setState((state) => {
      const without = state.selectedComponentIds.filter((id) => id !== componentId)
      const entries: string[] = Array(Math.min(Math.max(0, count), 9)).fill(componentId)
      return { selectedComponentIds: [...without, ...entries] }
    })
  }

  // Champion name map for CompCard
  const championNames = useMemo(
    () => Object.fromEntries(champions.map((c) => [c.id, c.name])),
    [champions]
  )

  // Scored / sorted suggestions
  const suggestions = useMemo<CompSuggestion[]>(() => {
    if (comps.length === 0) return []
    return scoreAllComps(
      comps,
      selectedChampionIds,
      selectedComponentIds,
      champions,
      weights,
      completedItems,
      selectedGodIds
    )
  }, [comps, selectedChampionIds, selectedComponentIds, champions, weights, completedItems, selectedGodIds])

  const hasSelections = selectedChampionIds.length > 0 || selectedComponentIds.length > 0 || selectedGodIds.length > 0

  function toggleExpand(compId: string) {
    setExpandedCompId((prev) => (prev === compId ? null : compId))
  }

  return (
    <>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <div className="flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:w-[40%] flex flex-col gap-4 min-w-0">

          {/* Top bar: page title + Clear All */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Game Assistant</h1>
            <button
              onClick={clearAll}
              disabled={!hasSelections}
              className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>

          {/* ── Champion Selection ────────────────────── */}
          <CollapsibleSection title="Champions" badge={selectedChampionIds.length}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => useGameStore.setState({ selectedChampionIds: [] })}
                disabled={selectedChampionIds.length === 0}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <ChampionSelect
              champions={champions}
              selected={selectedChampionIds}
              onToggle={toggleChampion}
              mode="multi"
            />
          </CollapsibleSection>

          {/* ── Item Components ───────────────────────── */}
          <CollapsibleSection title="Item Components" badge={selectedComponentIds.length}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => useGameStore.setState({ selectedComponentIds: [] })}
                disabled={selectedComponentIds.length === 0}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <ItemSelect
              baseComponents={baseComponents}
              selected={selectedComponentIds}
              onToggle={toggleComponent}
              counts={componentCounts}
              onCountChange={setComponentCount}
            />
          </CollapsibleSection>

          {/* ── Gods ──────────────────────────────────── */}
          <CollapsibleSection title="Gods" badge={selectedGodIds.length}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Select up to 2 gods active this game</p>
              <button
                onClick={() => useGameStore.setState({ selectedGodIds: [] })}
                disabled={selectedGodIds.length === 0}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {gods.map((god) => {
                const isSelected = selectedGodIds.includes(god.id)
                return (
                  <button
                    key={god.id}
                    type="button"
                    onClick={() => toggleGod(god.id)}
                    title={`${god.name} — ${god.title}`}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-900/30 text-amber-200'
                        : 'border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                    }`}
                    style={{ width: 56 }}
                  >
                    <img
                      src={getGodIconUrl(god.id)}
                      alt={god.name}
                      style={{
                        width: 36, height: 36, borderRadius: 6, objectFit: 'cover',
                        opacity: isSelected ? 1 : 0.5,
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <span className="text-xs leading-tight text-center truncate w-full">{god.name}</span>
                  </button>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* ── Item Helper ───────────────────────────── */}
          <CollapsibleSection title="Item Helper" defaultOpen={true}>
            <ItemHelper
              availableComponentIds={selectedComponentIds}
              baseComponents={baseComponents}
              completedItems={completedItems}
              comps={comps}
            />
          </CollapsibleSection>

          {/* ── Keyboard shortcuts hint ───────────────── */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-left flex items-center gap-1"
          >
            <span>⌨</span>
            <span>Shortcuts</span>
          </button>
        </div>

      {/* ── Right column ────────────────────────────────────────────────── */}
      <div className="lg:w-[60%] flex flex-col gap-4 min-w-0">

        {/* Suggestions header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Suggestions</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {comps.length === 0
                ? 'No comps saved'
                : hasSelections
                ? `${suggestions.length} comp${suggestions.length !== 1 ? 's' : ''} scored`
                : `${suggestions.length} comp${suggestions.length !== 1 ? 's' : ''} ranked`}
            </p>
          </div>
          <button
            onClick={() => setShowWeights((v) => !v)}
            className={`p-2 rounded transition-colors ${
              showWeights
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
            }`}
            title="Scoring weights"
          >
            ⚙
          </button>
        </div>

        {/* Weights panel */}
        {showWeights && (
          <Panel>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Scoring Weights</h3>
              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <WeightSlider
                label="Champion match"
                value={weights.directWeight}
                min={0.1}
                max={5.0}
                onChange={(v) => setWeights({ directWeight: v })}
              />
              <WeightSlider
                label="Trait overlap"
                value={weights.traitWeight}
                min={0.1}
                max={3.0}
                onChange={(v) => setWeights({ traitWeight: v })}
              />
              <WeightSlider
                label="Item match"
                value={weights.itemWeight}
                min={0.1}
                max={5.0}
                onChange={(v) => setWeights({ itemWeight: v })}
              />
              <WeightSlider
                label="God match"
                value={weights.godWeight}
                min={0.0}
                max={3.0}
                onChange={(v) => setWeights({ godWeight: v })}
              />
            </div>
          </Panel>
        )}

        {/* ── Empty: no comps ───────────────────────── */}
        {comps.length === 0 && (
          <Panel>
            <div className="py-10 text-center">
              <p className="text-gray-400 mb-3">No comps saved yet.</p>
              <Link
                to="/comps"
                className="px-4 py-2 rounded bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors text-sm"
              >
                Go to Comp Manager
              </Link>
            </div>
          </Panel>
        )}

        {/* ── Suggestion list ───────────────────────── */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            {suggestions.map((s) => {
              const isExpanded = expandedCompId === s.comp.id
              return (
                <div key={s.comp.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                  <CompCard
                    comp={s.comp}
                    onClick={() => toggleExpand(s.comp.id)}
                    score={hasSelections ? s.finalScore : undefined}
                    directRatio={hasSelections ? s.directRatio : undefined}
                    traitRatio={hasSelections ? s.traitRatio : undefined}
                    itemMatchRatio={hasSelections ? s.itemMatchRatio : undefined}
                    matchedChampionIds={hasSelections ? s.matchedChampionIds : undefined}
                    sharedTraitIds={hasSelections ? s.sharedTraitIds : undefined}
                    matchedGodIds={hasSelections ? s.matchedGodIds : undefined}
                    championNames={championNames}
                  />

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <CompDetail
                        suggestion={s}
                        championById={championById}
                        itemById={itemById}
                        traitById={traitById}
                        godById={godById}
                        selectedChampionIds={selectedChampionIds}
                        selectedGodIds={selectedGodIds}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* No selections but comps exist: handled by suggestions being rank-sorted above */}
        {comps.length > 0 && suggestions.length === 0 && (
          <Panel>
            <p className="text-gray-500 text-sm text-center py-6">
              No suggestions available.
            </p>
          </Panel>
        )}
      </div>
    </div>
    </>
  )
}
