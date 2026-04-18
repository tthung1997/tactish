import { create } from 'zustand'
import { GameStoreState } from '../types'

const MAX_COMPONENT_COUNT = 3

export const useGameStore = create<GameStoreState>()((set) => ({
  selectedChampionIds: [],
  selectedComponentIds: [],
  toggleChampion: (championId) => set(state => ({
    selectedChampionIds: state.selectedChampionIds.includes(championId)
      ? state.selectedChampionIds.filter(id => id !== championId)
      : [...state.selectedChampionIds, championId]
  })),
  toggleComponent: (componentId) => set(state => {
    const currentCount = state.selectedComponentIds.filter(id => id === componentId).length
    if (currentCount >= MAX_COMPONENT_COUNT) {
      // cycle back to 0: remove all copies
      return { selectedComponentIds: state.selectedComponentIds.filter(id => id !== componentId) }
    }
    // add one more copy
    return { selectedComponentIds: [...state.selectedComponentIds, componentId] }
  }),
  clearAll: () => set({ selectedChampionIds: [], selectedComponentIds: [] }),
}))
