import { BaseComponent, CompletedItem, TeamComp } from '../../types'
import { getBuildableItems } from '../../utils/items'

interface ItemHelperProps {
  availableComponentIds: string[]   // user's selected components (with multiplicity)
  baseComponents: BaseComponent[]
  completedItems: CompletedItem[]
  comps?: TeamComp[]
  className?: string
}

function buildCountMap(ids: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const id of ids) map[id] = (map[id] ?? 0) + 1
  return map
}

/** Items where exactly 1 of 2 required components is available (and can't be fully built). */
function getAlmostItems(
  availableComponentIds: string[],
  completedItems: CompletedItem[],
  buildableIds: Set<string>,
): CompletedItem[] {
  const available = buildCountMap(availableComponentIds)
  return completedItems.filter(item => {
    if (buildableIds.has(item.id)) return false
    const [a, b] = item.components
    // treat same-component recipe (e.g. a===b) correctly
    const needed = buildCountMap([a, b])
    let matched = 0
    const pool = { ...available }
    for (const [id, count] of Object.entries(needed)) {
      const have = pool[id] ?? 0
      matched += Math.min(have, count)
      pool[id] = Math.max(0, have - count)
    }
    return matched === 1
  })
}

export default function ItemHelper({
  availableComponentIds,
  baseComponents,
  completedItems,
  comps,
  className = '',
}: ItemHelperProps) {
  const componentMap = Object.fromEntries(baseComponents.map(c => [c.id, c.name]))
  const buildableIds = new Set(getBuildableItems(availableComponentIds, completedItems))
  const buildableItems = completedItems.filter(i => buildableIds.has(i.id))
  const almostItems = getAlmostItems(availableComponentIds, completedItems, buildableIds)

  // For each buildable item, find comps that need it
  const compWantsItem: Record<string, string[]> = {}
  if (comps) {
    for (const item of buildableItems) {
      const wantedBy = comps
        .filter(c => c.champions.some(ch => ch.items.includes(item.id)))
        .map(c => c.name)
      if (wantedBy.length > 0) compWantsItem[item.id] = wantedBy
    }
  }

  const hasCompsWanting = Object.keys(compWantsItem).length > 0

  return (
    <div className={`flex flex-col gap-4 ${className}`}>

      {/* ── You can build ────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          You can build
        </h3>
        {buildableItems.length === 0 ? (
          <p className="text-gray-600 text-xs py-1">No complete items available</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {buildableItems.map(item => {
              const [c1, c2] = item.components
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs
                             bg-green-900/40 border border-green-700 text-green-200"
                >
                  <span className="truncate">{componentMap[c1] ?? c1}</span>
                  <span className="text-gray-500 shrink-0">+</span>
                  <span className="truncate">{componentMap[c2] ?? c2}</span>
                  <span className="text-gray-500 shrink-0">→</span>
                  <span className="font-semibold shrink-0 text-green-100">{item.name}</span>
                  <span className="ml-auto text-green-400 shrink-0">✓</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Almost there ─────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Almost there
        </h3>
        {almostItems.length === 0 ? (
          <p className="text-gray-600 text-xs py-1">Nothing close</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {almostItems.map(item => {
              const [c1, c2] = item.components
              const available = buildCountMap(availableComponentIds)
              // figure out which component is missing
              const pool = { ...available }
              const c1have = Math.min(pool[c1] ?? 0, 1)
              pool[c1] = (pool[c1] ?? 0) - c1have
              const c2have = Math.min(pool[c2] ?? 0, 1)
              const c1missing = c1have === 0
              const c2missing = c2have === 0 && !c1missing

              return (
                <li
                  key={item.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs
                             bg-yellow-900/30 border border-yellow-700 text-yellow-200"
                >
                  <span className={`truncate ${c1missing ? 'line-through text-yellow-600' : ''}`}>
                    {componentMap[c1] ?? c1}
                  </span>
                  <span className="text-gray-500 shrink-0">+</span>
                  <span className={`truncate ${c2missing ? 'line-through text-yellow-600' : ''}`}>
                    {componentMap[c2] ?? c2}
                  </span>
                  <span className="text-gray-500 shrink-0">→</span>
                  <span className="font-semibold shrink-0">{item.name}</span>
                  <span className="ml-auto text-yellow-400 shrink-0 text-xs">½</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Comps that want these ─────────────────────────────── */}
      {comps && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Comps that want these
          </h3>
          {!hasCompsWanting ? (
            <p className="text-gray-600 text-xs py-1">No comps need your buildable items</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {buildableItems
                .filter(item => compWantsItem[item.id])
                .map(item => (
                  <li key={item.id}>
                    <span className="text-xs font-semibold text-green-300">{item.name}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {compWantsItem[item.id].map(name => (
                        <span
                          key={name}
                          className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 text-xs"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
