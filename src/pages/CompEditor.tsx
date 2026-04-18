import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCompStore } from '../stores/compStore'
import { useSetData } from '../hooks/useSetData'
import { ALL_RANKS } from '../utils/ranks'
import { getChampionIconUrl, getItemIconUrl } from '../utils/icons'
import type { Champion, CompChampion, CompletedItem, HexPosition, Rank, Trait } from '../types'

// ── Board geometry (pointy-top hexes, matches TFT layout) ─────────────────────
const R    = 26
const GAP  = 8                               // px gap between hexes
const PHW  = Math.round(R * Math.sqrt(3))    // pure hex width ≈ 45 px
const HW   = PHW + GAP                       // column step (PHW + gap)
const HH   = R * 2                           // = 52  (hex height)
const VS   = Math.round(HH * 0.75) + GAP    // vertical step between row centres
const PAD  = 10
const COLS = 7
const ROWS = 4
const ITEM_OVERLAP = 8   // how many px items overlap into the bottom of the hex

const BOARD_W = PAD + HW + 6 * HW + Math.ceil(HW / 2) + PAD
const BOARD_H = PAD + R + (ROWS - 1) * VS + R + PAD + (18 - ITEM_OVERLAP) + 2

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

// ── Dummy unit ────────────────────────────────────────────────────────────────
const DUMMY_ID_PREFIX = '__dummy_'
let dummyCounter = 0
function newDummyId() { return `${DUMMY_ID_PREFIX}${++dummyCounter}` }
function isDummy(championId: string) { return championId.startsWith(DUMMY_ID_PREFIX) }
const DUMMY_CHAMPION: Champion = { id: DUMMY_ID_PREFIX, name: 'Dummy', cost: 1, traits: [] }

// ── Cost palette ──────────────────────────────────────────────────────────────
const COST_BG: Record<number, string> = {
  1: '#4b5563', 2: '#15803d', 3: '#1d4ed8', 4: '#6d28d9', 5: '#b45309',
}
const COST_BORDER: Record<number, string> = {
  1: '#9ca3af', 2: '#4ade80', 3: '#60a5fa', 4: '#a78bfa', 5: '#fbbf24',
}
const COST_LABEL: Record<number, string> = {
  1: 'bg-gray-500 text-white',
  2: 'bg-green-700 text-white',
  3: 'bg-blue-700 text-white',
  4: 'bg-purple-700 text-white',
  5: 'bg-amber-600 text-black',
}

// ── Drag-and-drop state (module-level to avoid stale closures) ────────────────
type DragPayload =
  | { type: 'pool-champion'; championId: string }
  | { type: 'board-champion'; championId: string; from: HexPosition }
  | { type: 'item'; itemId: string }
  | { type: 'dummy' }

let currentDrag: DragPayload | null = null

function encDrag(p: DragPayload) { return JSON.stringify(p) }
function decDrag(s: string): DragPayload | null {
  try { return JSON.parse(s) } catch { return null }
}

function posKey(row: number, col: number) { return `${row}-${col}` }

function hexXY(row: number, col: number) {
  const cx = PAD + (row % 2 === 0 ? HW / 2 : HW) + col * HW
  const cy = PAD + R + row * VS
  return { cx, cy }
}

// ── BoardCell ─────────────────────────────────────────────────────────────────
interface BoardCell {
  championId: string
  champion: Champion
  items: string[]
  isCarry: boolean
}

// ── DragDropBoard ─────────────────────────────────────────────────────────────
function DragDropBoard({
  cellMap,
  selectedChampId,
  onSelect,
  onPlace,
  onPlaceDummy,
  onRemove,
  onItemDrop,
}: {
  cellMap: Record<string, BoardCell>
  selectedChampId: string | null
  onSelect: (id: string | null) => void
  onPlace: (championId: string, pos: HexPosition, fromPos?: HexPosition) => void
  onPlaceDummy: (pos: HexPosition) => void
  onRemove: (championId: string) => void
  onItemDrop: (championId: string, itemId: string) => void
}){
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const cells = useMemo(() => {
    const out: { row: number; col: number }[] = []
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        out.push({ row, col })
    return out
  }, [])

  return (
    <div style={{ position: 'relative', width: BOARD_W, height: BOARD_H, flexShrink: 0 }}>
      {cells.map(({ row, col }) => {
        const key = posKey(row, col)
        const cell = cellMap[key]
        const { cx, cy } = hexXY(row, col)
        const isSelected = !!cell && cell.championId === selectedChampId
        const isDragOver = dragOverKey === key
        const isItemDragOver = isDragOver && currentDrag?.type === 'item' && !!cell

        const bg = isDragOver && !isItemDragOver
          ? '#1e3a8a'
          : isItemDragOver
          ? '#78350f'
          : isSelected
          ? '#451a03'
          : cell
          ? (COST_BG[cell.champion.cost] ?? '#374151')
          : '#1f2937'

        const glowColor = isSelected ? '#f59e0b' : isDragOver ? '#60a5fa' : null

        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: cx - PHW / 2,
              top: cy - R,
              width: PHW,
              height: HH,          // events only within hex height
              zIndex: cell ? 2 : 1,
              cursor: cell ? 'grab' : 'default',
              overflow: 'visible',  // allow item strip to render below
            }}
            draggable={!!cell}
            onDragStart={(e) => {
              if (!cell) return
              const payload: DragPayload = { type: 'board-champion', championId: cell.championId, from: { row, col } }
              currentDrag = payload
              e.dataTransfer.setData('text/plain', encDrag(payload))
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => { currentDrag = null; setDragOverKey(null) }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverKey(key)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragOverKey(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverKey(null)
              const p = decDrag(e.dataTransfer.getData('text/plain'))
              if (!p) return
              if (p.type === 'pool-champion' || p.type === 'board-champion') {
                onPlace(p.championId, { row, col }, p.type === 'board-champion' ? p.from : undefined)
              } else if (p.type === 'dummy') {
                onPlaceDummy({ row, col })
              } else if (p.type === 'item' && cell && !isDummy(cell.championId)) {
                onItemDrop(cell.championId, p.itemId)
              }
            }}
            onClick={() => onSelect(cell ? (isSelected ? null : cell.championId) : null)}
            onContextMenu={(e) => { e.preventDefault(); if (cell) onRemove(cell.championId) }}
          >
            {/* Visual hex shape (pointer-events: none — all events handled by parent) */}
            <div
              style={{
                width: PHW,
                height: HH,
                clipPath: HEX_CLIP,
                background: bg,
                pointerEvents: 'none',
                overflow: 'hidden',
                position: 'relative',
                transition: 'background 0.1s',
                filter: glowColor ? `drop-shadow(0 0 6px ${glowColor})` : 'none',
              }}
            >
              {cell && (
                <>
                  {isDummy(cell.championId) ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#6b7280', userSelect: 'none' }}>
                      👤
                    </div>
                  ) : (
                    <img
                      src={getChampionIconUrl(cell.championId)}
                      alt={cell.champion.name}
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  {cell.isCarry && (
                    <span style={{
                      position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 10, pointerEvents: 'none', textShadow: '0 0 4px #000',
                    }}>⭐</span>
                  )}
                </>
              )}
            </div>

            {/* Item icons — overlapping bottom edge of hex */}
            {cell && !isDummy(cell.championId) && (
              <div style={{
                position: 'absolute',
                top: HH - ITEM_OVERLAP,
                left: 0,
                width: PHW,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                pointerEvents: 'none',
                zIndex: 20,
              }}>
                {[0, 1, 2].map((slot) => {
                  const itemId = cell.items[slot]
                  return (
                    <div key={slot} style={{
                      width: 18, height: 18, borderRadius: 3,
                      background: '#111827',
                      border: `1px solid ${itemId ? '#6b7280' : '#374151'}`,
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {itemId && (
                        <img
                          src={getItemIconUrl(itemId)}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── ChampionPool ──────────────────────────────────────────────────────────────
function ChampionPool({
  champions,
  placedIds,
}: {
  champions: Champion[]
  placedIds: Set<string>
}) {
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q ? champions.filter(c => c.name.toLowerCase().includes(q)) : champions
    const byGroup: Record<number, Champion[]> = {}
    for (const c of filtered) {
      ;(byGroup[c.cost] ??= []).push(c)
    }
    return [1, 2, 3, 4, 5].flatMap(cost => (byGroup[cost] ? [{ cost, champs: byGroup[cost] }] : []))
  }, [champions, search])

  return (
    <div className="flex flex-col gap-2" style={{ maxWidth: BOARD_W }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Champions</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 w-28 focus:outline-none focus:border-blue-500"
        />
      </div>
      {/* Dummy tile */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Dummy</span>
        <div
          draggable
          onDragStart={(e) => {
            const p: DragPayload = { type: 'dummy' }
            currentDrag = p
            e.dataTransfer.setData('text/plain', encDrag(p))
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragEnd={() => { currentDrag = null }}
          title="Dummy unit (placeholder)"
          style={{
            width: 40, height: 40, borderRadius: 4, flexShrink: 0,
            border: '2px dashed #4b5563', cursor: 'grab', background: '#1f2937',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, userSelect: 'none',
          }}
        >
          👤
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {grouped.map(({ cost, champs }) => (
          <div key={cost} className="flex flex-wrap items-center gap-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${COST_LABEL[cost]}`}>{cost}g</span>
            {champs.map((champ) => {
              const placed = placedIds.has(champ.id)
              return (
                <div
                  key={champ.id}
                  draggable={!placed}
                  onDragStart={(e) => {
                    if (placed) { e.preventDefault(); return }
                    const p: DragPayload = { type: 'pool-champion', championId: champ.id }
                    currentDrag = p
                    e.dataTransfer.setData('text/plain', encDrag(p))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => { currentDrag = null }}
                  title={champ.name}
                  style={{
                    width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                    border: `2px solid ${placed ? '#374151' : COST_BORDER[cost]}`,
                    opacity: placed ? 0.3 : 1,
                    cursor: placed ? 'default' : 'grab',
                    background: COST_BG[cost],
                  }}
                >
                  <img
                    src={getChampionIconUrl(champ.id)}
                    alt={champ.name}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ItemPool ──────────────────────────────────────────────────────────────────
function ItemPool({ items }: { items: CompletedItem[] }) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="flex flex-col gap-2 min-w-0" style={{ maxWidth: 260 }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Items</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 w-28 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {filtered.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              const p: DragPayload = { type: 'item', itemId: item.id }
              currentDrag = p
              e.dataTransfer.setData('text/plain', encDrag(p))
              e.dataTransfer.effectAllowed = 'copy'
            }}
            onDragEnd={() => { currentDrag = null }}
            title={item.name}
            style={{
              width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
              border: '1px solid #4b5563', cursor: 'grab', background: '#1f2937',
            }}
          >
            <img
              src={getItemIconUrl(item.id)}
              alt={item.name}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ItemSlotsPanel ────────────────────────────────────────────────────────────
function ItemSlotsPanel({
  selected,
  completedItems,
  onItemDropToSlot,
  onItemClear,
  onCarryToggle,
}: {
  selected: { championId: string; champion: Champion; cc: CompChampion } | null
  completedItems: CompletedItem[]
  onItemDropToSlot: (championId: string, slot: number, itemId: string) => void
  onItemClear: (championId: string, slot: number) => void
  onCarryToggle: (championId: string, isCarry: boolean) => void
}) {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)

  const itemById = useMemo(
    () => Object.fromEntries(completedItems.map((i) => [i.id, i])),
    [completedItems],
  )

  const emptySlot = (
    <div style={{
      width: 52, height: 52, borderRadius: 6,
      border: '2px dashed #374151', background: '#111827',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#4b5563', fontSize: 22 }}>+</span>
    </div>
  )

  if (!selected) {
    return (
      <div className="flex flex-col items-center gap-2 shrink-0" style={{ width: 70 }}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide self-start">Items</span>
        {[0, 1, 2].map((i) => <div key={i}>{emptySlot}</div>)}
        <span className="text-xs text-gray-600 text-center mt-1 leading-tight">Select a<br/>champion</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2 shrink-0" style={{ width: 70 }}>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Items</span>
      {[0, 1, 2].map((slot) => {
        const itemId = selected.cc.items[slot]
        const item = itemId ? itemById[itemId] : null
        const isOver = dragOverSlot === slot

        return (
          <div
            key={slot}
            onDragOver={(e) => {
              if (currentDrag?.type !== 'item') return
              e.preventDefault()
              setDragOverSlot(slot)
            }}
            onDragLeave={() => setDragOverSlot(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverSlot(null)
              const p = decDrag(e.dataTransfer.getData('text/plain'))
              if (p?.type === 'item') onItemDropToSlot(selected.championId, slot, p.itemId)
            }}
            style={{
              width: 52, height: 52, borderRadius: 6,
              border: `2px ${isOver ? 'solid #60a5fa' : item ? 'solid #6b7280' : 'dashed #374151'}`,
              background: isOver ? '#1e3a8a' : '#111827',
              position: 'relative', overflow: 'hidden', cursor: item ? 'pointer' : 'default',
              transition: 'border-color 0.1s, background 0.1s',
            }}
          >
            {item ? (
              <>
                <img
                  src={getItemIconUrl(item.id)}
                  alt={item.name}
                  title={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <button
                  onClick={() => onItemClear(selected.championId, slot)}
                  title="Remove item"
                  style={{
                    position: 'absolute', top: 1, right: 1,
                    width: 15, height: 15, background: '#1f2937',
                    border: '1px solid #6b7280', borderRadius: '50%',
                    color: '#9ca3af', fontSize: 10, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >×</button>
              </>
            ) : (
              <span style={{ color: '#4b5563', fontSize: 22, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
            )}
          </div>
        )
      })}
      <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer select-none mt-1">
        <input
          type="checkbox"
          checked={selected.cc.isCarry}
          onChange={(e) => onCarryToggle(selected.championId, e.target.checked)}
          className="accent-yellow-400"
        />
        Carry ⭐
      </label>
    </div>
  )
}

// ── TraitsPanel ───────────────────────────────────────────────────────────────
function TraitsPanel({
  champList,
  championById,
  traitById,
}: {
  champList: CompChampion[]
  championById: Record<string, Champion>
  traitById: Record<string, Trait>
}) {
  const traitCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cc of champList) {
      for (const tid of (championById[cc.championId]?.traits ?? []))
        counts[tid] = (counts[tid] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, trait: traitById[id] }))
      .filter((t) => t.trait)
      .sort((a, b) => b.count - a.count)
  }, [champList, championById, traitById])

  return (
    <div className="flex flex-col gap-1 shrink-0" style={{ width: 190 }}>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Traits</span>
      {traitCounts.length === 0 ? (
        <span className="text-xs text-gray-600">No champions</span>
      ) : (
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
      )}
    </div>
  )
}

// ── Main CompEditor ───────────────────────────────────────────────────────────
export default function CompEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const { comps, addComp, updateComp, deleteComp } = useCompStore()
  const { champions, completedItems, championById, traitById } = useSetData()

  const existingComp = isEdit ? comps.find((c) => c.id === id) : undefined

  const [name, setName] = useState('')
  const [rank, setRank] = useState<Rank>('A')
  const [notes, setNotes] = useState('')
  const [champList, setChampList] = useState<CompChampion[]>([])
  const [selectedChampId, setSelectedChampId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingComp) {
      setName(existingComp.name)
      setRank(existingComp.rank)
      setNotes(existingComp.notes ?? '')
      setChampList(existingComp.champions.map((c) => ({ ...c, items: [...c.items] })))
    }
  }, [existingComp?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Board cell map ───────────────────────────────────────────────────────────
  const cellMap = useMemo(() => {
    const map: Record<string, BoardCell> = {}
    for (const cc of champList) {
      if (!cc.position) continue
      const champ = isDummy(cc.championId) ? DUMMY_CHAMPION : championById[cc.championId]
      if (!champ) continue
      map[posKey(cc.position.row, cc.position.col)] = {
        championId: cc.championId, champion: champ, items: cc.items, isCarry: cc.isCarry,
      }
    }
    return map
  }, [champList, championById])

  const placedIds = useMemo(
    () => new Set(champList.filter((c) => c.position).map((c) => c.championId)),
    [champList],
  )

  // ── Place / move champion ────────────────────────────────────────────────────
  function handlePlace(championId: string, pos: HexPosition, fromPos?: HexPosition) {
    const targetKey = posKey(pos.row, pos.col)
    const occupant = cellMap[targetKey]

    setChampList((prev) => {
      const alreadyIn = prev.find((c) => c.championId === championId)
      let updated = prev.map((c) => {
        if (c.championId === championId) return { ...c, position: pos }
        // Swap occupant to fromPos when moving board→board
        if (occupant && c.championId === occupant.championId && fromPos)
          return { ...c, position: fromPos }
        // Clear occupant position when placing from pool
        if (occupant && c.championId === occupant.championId && !fromPos)
          return { ...c, position: undefined }
        return c
      })
      // Placing a brand-new champion from pool
      if (!alreadyIn) {
        if (isDummy(championId) || championById[championId]) {
          updated = updated.map((c) =>
            occupant && c.championId === occupant.championId ? { ...c, position: undefined } : c,
          )
          updated = [...updated, { championId, items: [], isCarry: false, position: pos }]
        }
      }
      return updated
    })
  }

  // ── Place dummy ──────────────────────────────────────────────────────────────
  function handlePlaceDummy(pos: HexPosition) {
    handlePlace(newDummyId(), pos)
  }

  // ── Remove champion ──────────────────────────────────────────────────────────
  function handleRemove(championId: string) {
    if (selectedChampId === championId) setSelectedChampId(null)
    setChampList((prev) => prev.filter((c) => c.championId !== championId))
  }

  // ── Item management ──────────────────────────────────────────────────────────
  function handleItemDrop(championId: string, itemId: string) {
    setChampList((prev) =>
      prev.map((c) => {
        if (c.championId !== championId) return c
        if (c.items.length >= 3 || c.items.includes(itemId)) return c
        return { ...c, items: [...c.items, itemId] }
      }),
    )
  }

  function handleItemDropToSlot(championId: string, slot: number, itemId: string) {
    setChampList((prev) =>
      prev.map((c) => {
        if (c.championId !== championId) return c
        const newItems = [c.items[0] ?? '', c.items[1] ?? '', c.items[2] ?? '']
        newItems[slot] = itemId
        return { ...c, items: newItems.filter(Boolean).slice(0, 3) }
      }),
    )
  }

  function handleItemClear(championId: string, slot: number) {
    setChampList((prev) =>
      prev.map((c) => {
        if (c.championId !== championId) return c
        const newItems = [...c.items]
        newItems.splice(slot, 1)
        return { ...c, items: newItems }
      }),
    )
  }

  function handleCarryToggle(championId: string, isCarry: boolean) {
    setChampList((prev) => prev.map((c) => c.championId === championId ? { ...c, isCarry } : c))
  }

  // ── Save / Cancel / Delete ───────────────────────────────────────────────────
  function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return }
    const realChampions = champList.filter((c) => !isDummy(c.championId))
    if (realChampions.length === 0) { setError('Add at least one champion.'); return }
    setError(null)
    if (isEdit && id) {
      updateComp(id, { name: name.trim(), rank, notes: notes.trim() || undefined, champions: realChampions })
    } else {
      addComp({ name: name.trim(), rank, notes: notes.trim() || undefined, champions: realChampions })
    }
    navigate('/comps')
  }

  function handleDelete() {
    if (!id) return
    if (window.confirm(`Delete "${name}"?`)) { deleteComp(id); navigate('/comps') }
  }

  const selectedCC = selectedChampId ? champList.find((c) => c.championId === selectedChampId) : null
  const selectedData =
    selectedCC && !isDummy(selectedCC.championId) && championById[selectedCC.championId]
      ? { championId: selectedCC.championId, champion: championById[selectedCC.championId], cc: selectedCC }
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 'fit-content', minWidth: 0, margin: '0 auto' }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-white shrink-0">{isEdit ? 'Edit Comp' : 'New Comp'}</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Comp name…"
          className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          style={{ width: 160 }}
        />
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value as Rank)}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {ALL_RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes…"
          className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          style={{ width: 180 }}
        />
        <div className="flex gap-2 shrink-0">
          {isEdit && (
            <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded bg-red-700 text-white hover:bg-red-600 transition-colors">Delete</button>
          )}
          <button onClick={() => navigate('/comps')} className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm rounded bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold transition-colors">Save</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded px-3 py-2">{error}</div>
      )}

      {/* ── Middle row: Traits | Board | Items ── */}
      <div className="flex gap-4 items-start">
        <TraitsPanel champList={champList} championById={championById} traitById={traitById} />
        <div className="flex flex-col items-center gap-1 shrink-0">
          <DragDropBoard
            cellMap={cellMap}
            selectedChampId={selectedChampId}
            onSelect={setSelectedChampId}
            onPlace={handlePlace}
            onPlaceDummy={handlePlaceDummy}
            onRemove={handleRemove}
            onItemDrop={handleItemDrop}
          />
          <span className="text-xs text-gray-600">Drag champions onto board • right-click to remove</span>
        </div>
        <ItemSlotsPanel
          selected={selectedData}
          completedItems={completedItems}
          onItemDropToSlot={handleItemDropToSlot}
          onItemClear={handleItemClear}
          onCarryToggle={handleCarryToggle}
        />
      </div>

      {/* ── Bottom row: Champion pool + Item pool ── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <ChampionPool champions={champions} placedIds={placedIds} />
        <ItemPool items={completedItems} />
      </div>
    </div>
  )
}

