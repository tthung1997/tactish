import { CompletedItem } from '../types'

export function buildRecipeLookup(
  completedItems: CompletedItem[]
): Record<string, [string, string]> {
  return Object.fromEntries(
    completedItems.map(item => [item.id, item.components])
  )
}

export function getBuildableItems(
  availableComponentIds: string[],
  completedItems: CompletedItem[]
): string[] {
  const available = buildCountMap(availableComponentIds)
  return completedItems
    .filter(item => {
      const [a, b] = item.components
      const needed = buildCountMap([a, b])
      return Object.entries(needed).every(([id, count]) => (available[id] ?? 0) >= count)
    })
    .map(item => item.id)
}

export function expandItemsToComponents(
  completedItemIds: string[],
  completedItems: CompletedItem[]
): string[] {
  const lookup = buildRecipeLookup(completedItems)
  return completedItemIds.flatMap(id => lookup[id] ?? [])
}

export function countComponentMatches(
  availableComponentIds: string[],
  neededItemIds: string[],
  completedItems: CompletedItem[]
): { matchedCount: number; totalNeeded: number } {
  const neededComponents = expandItemsToComponents(neededItemIds, completedItems)
  const totalNeeded = neededComponents.length

  const available = buildCountMap(availableComponentIds)
  const needed = buildCountMap(neededComponents)

  let matchedCount = 0
  for (const [id, count] of Object.entries(needed)) {
    matchedCount += Math.min(count, available[id] ?? 0)
  }

  return { matchedCount, totalNeeded }
}

function buildCountMap(ids: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const id of ids) {
    map[id] = (map[id] ?? 0) + 1
  }
  return map
}
