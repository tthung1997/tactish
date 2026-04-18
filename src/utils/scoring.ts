import { Champion, TeamComp, CompSuggestion, ScoringWeights, CompletedItem } from '../types'
import { rankToWeight } from './ranks'
import { countComponentMatches } from './items'
import { isDummy } from './dummy'

export const DEFAULT_WEIGHTS: ScoringWeights = {
  directWeight: 3.0,
  traitWeight: 1.0,
  itemWeight: 2.0,
  godWeight: 1.5,
}

export function scoreComp(
  comp: TeamComp,
  selectedChampionIds: string[],
  selectedComponentIds: string[],
  champions: Champion[],
  weights: ScoringWeights,
  completedItems: CompletedItem[],
  selectedGodIds: string[] = []
): CompSuggestion {
  const rankScore = rankToWeight(comp.rank)

  // Direct champion match (exclude dummies)
  const realCompChampions = comp.champions.filter(c => !isDummy(c.championId))
  const compChampIds = realCompChampions.map(c => c.championId)
  const matchedChampionIds = selectedChampionIds.filter(id => compChampIds.includes(id))
  const directRatio = realCompChampions.length > 0
    ? matchedChampionIds.length / realCompChampions.length
    : 0

  // Trait overlap
  const champById = Object.fromEntries(champions.map(c => [c.id, c]))
  const userTraits = new Set(
    selectedChampionIds.flatMap(id => champById[id]?.traits ?? [])
  )
  const compTraits = new Set(
    realCompChampions.flatMap(c => champById[c.championId]?.traits ?? [])
  )
  const sharedTraitIds = [...compTraits].filter(t => userTraits.has(t))
  const traitRatio = compTraits.size > 0 ? sharedTraitIds.length / compTraits.size : 0

  // Item match (exclude dummies)
  const neededItemIds = realCompChampions.flatMap(c => c.items)
  const { matchedCount, totalNeeded } = countComponentMatches(
    selectedComponentIds,
    neededItemIds,
    completedItems
  )
  const itemMatchRatio = totalNeeded > 0 ? matchedCount / totalNeeded : 0

  // God match
  const preferredGods = comp.preferredGods ?? []
  const matchedGodIds = selectedGodIds.filter(id => preferredGods.includes(id))
  const godMatchRatio = preferredGods.length > 0
    ? matchedGodIds.length / preferredGods.length
    : 0

  // Score
  const champSignal = directRatio * weights.directWeight + traitRatio * weights.traitWeight
  const itemSignal = itemMatchRatio * weights.itemWeight
  const godSignal = godMatchRatio * weights.godWeight
  const finalScore = rankScore * (1 + champSignal + itemSignal + godSignal)

  // Item details
  const uniqueItemIds = [...new Set(neededItemIds)]
  const itemDetails = uniqueItemIds.map(itemId => {
    const item = completedItems.find(i => i.id === itemId)
    if (!item) return null
    const [a, b] = item.components
    const available: string[] = [...selectedComponentIds]
    let partialMatch = 0
    const idxA = available.indexOf(a)
    if (idxA !== -1) { partialMatch++; available.splice(idxA, 1) }
    const idxB = available.indexOf(b)
    if (idxB !== -1) { partialMatch++; available.splice(idxB, 1) }
    return {
      completedItemId: item.id,
      completedItemName: item.name,
      canBuild: partialMatch === 2,
      partialMatch,
    }
  }).filter((d): d is NonNullable<typeof d> => d !== null)

  return {
    comp,
    finalScore,
    rankScore,
    directRatio,
    traitRatio,
    itemMatchRatio,
    godMatchRatio,
    matchedChampionIds,
    sharedTraitIds,
    matchedGodIds,
    itemDetails,
  }
}

export function scoreAllComps(
  comps: TeamComp[],
  selectedChampionIds: string[],
  selectedComponentIds: string[],
  champions: Champion[],
  weights: ScoringWeights,
  completedItems: CompletedItem[],
  selectedGodIds: string[] = []
): CompSuggestion[] {
  return comps
    .map(comp => scoreComp(comp, selectedChampionIds, selectedComponentIds, champions, weights, completedItems, selectedGodIds))
    .sort((a, b) => b.finalScore - a.finalScore)
}
