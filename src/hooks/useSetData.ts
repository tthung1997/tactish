import { useMemo } from 'react'
import { Champion, BaseComponent, CompletedItem, SpecialItem, Trait, God } from '../types'

import set17Champions from '../data/set17/champions.json'
import set17Items from '../data/set17/items.json'
import set17Traits from '../data/set17/traits.json'
import set17Gods from '../data/set17/gods.json'

export interface SetData {
  champions: Champion[]
  baseComponents: BaseComponent[]
  completedItems: CompletedItem[]
  artifactItems: SpecialItem[]
  radiantItems: SpecialItem[]
  traits: Trait[]
  gods: God[]
  championById: Record<string, Champion>
  itemById: Record<string, CompletedItem | SpecialItem>
  componentById: Record<string, BaseComponent>
  traitById: Record<string, Trait>
  godById: Record<string, God>
}

type ItemsJson = {
  baseComponents: BaseComponent[]
  completedItems: CompletedItem[]
  artifactItems: SpecialItem[]
  radiantItems: SpecialItem[]
}

export function useSetData(): SetData {
  return useMemo(() => {
    const champions = set17Champions as Champion[]
    const { baseComponents, completedItems, artifactItems, radiantItems } = set17Items as unknown as ItemsJson
    const traits = set17Traits as Trait[]
    const gods = set17Gods as God[]

    const allEquippable = [...completedItems, ...artifactItems, ...radiantItems]

    return {
      champions,
      baseComponents,
      completedItems,
      artifactItems,
      radiantItems,
      traits,
      gods,
      championById: Object.fromEntries(champions.map(c => [c.id, c])),
      itemById: Object.fromEntries(allEquippable.map(i => [i.id, i])),
      componentById: Object.fromEntries(baseComponents.map(b => [b.id, b])),
      traitById: Object.fromEntries(traits.map(t => [t.id, t])),
      godById: Object.fromEntries(gods.map(g => [g.id, g])),
    }
  }, [])
}
