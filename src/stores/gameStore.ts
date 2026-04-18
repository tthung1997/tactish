import { create } from 'zustand'
import { GameStoreState } from '../types'

const MAX_COMPONENT_COUNT = 3
const MAX_GOD_COUNT = 2

export const useGameStore = create<GameStoreState>()((set) => ({
  selectedChampionIds: [],
  selectedComponentIds: [],
  selectedGodIds: [],
  toggleChampion: (championId) => set(state => ({
    selectedChampionIds: state.selectedChampionIds.includes(championId)
      ? state.selectedChampionIds.filter(id => id !== championId)
      : [...state.selectedChampionIds, championId]
  })),
  toggleComponent: (componentId) => set(state => {
    const currentCount = state.selectedComponentIds.filter(id => id === componentId).length
    if (currentCount >= MAX_COMPONENT_COUNT) {
      return { selectedComponentIds: state.selectedComponentIds.filter(id => id !== componentId) }
    }
    return { selectedComponentIds: [...state.selectedComponentIds, componentId] }
  }),
  toggleGod: (godId) => set(state => {
    if (state.selectedGodIds.includes(godId)) {
      return { selectedGodIds: state.selectedGodIds.filter(id => id !== godId) }
    }
    const next = [...state.selectedGodIds, godId]
    // Keep only the most recent MAX_GOD_COUNT selections (drop oldest)
    return { selectedGodIds: next.slice(-MAX_GOD_COUNT) }
  }),
  clearAll: () => set({ selectedChampionIds: [], selectedComponentIds: [], selectedGodIds: [] }),
}))
