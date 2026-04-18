import { useMemo } from 'react'
import { Champion, BaseComponent, CompletedItem, Trait, God } from '../types'

import set17Champions from '../data/set17/champions.json'
import set17Items from '../data/set17/items.json'
import set17Traits from '../data/set17/traits.json'
import set17Gods from '../data/set17/gods.json'

export interface SetData {
  champions: Champion[]
  baseComponents: BaseComponent[]
  completedItems: CompletedItem[]
  traits: Trait[]
  gods: God[]
  championById: Record<string, Champion>
  itemById: Record<string, CompletedItem>
  componentById: Record<string, BaseComponent>
  traitById: Record<string, Trait>
  godById: Record<string, God>
}

export function useSetData(): SetData {
  return useMemo(() => {
    const champions = set17Champions as Champion[]
    const baseComponents = (set17Items as unknown as { baseComponents: BaseComponent[] }).baseComponents
    const completedItems = (set17Items as unknown as { completedItems: CompletedItem[] }).completedItems
    const traits = set17Traits as Trait[]
    const gods = set17Gods as God[]

    return {
      champions,
      baseComponents,
      completedItems,
      traits,
      gods,
      championById: Object.fromEntries(champions.map(c => [c.id, c])),
      itemById: Object.fromEntries(completedItems.map(i => [i.id, i])),
      componentById: Object.fromEntries(baseComponents.map(b => [b.id, b])),
      traitById: Object.fromEntries(traits.map(t => [t.id, t])),
      godById: Object.fromEntries(gods.map(g => [g.id, g])),
    }
  }, [])
}
