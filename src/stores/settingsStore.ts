import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SettingsState } from '../types'
import { DEFAULT_WEIGHTS } from '../utils/scoring'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weights: DEFAULT_WEIGHTS,
      activeSetId: 'set17',
      setWeights: (w) => set(state => ({ weights: { ...state.weights, ...w } })),
      setActiveSet: (setId) => set({ activeSetId: setId }),
    }),
    { name: 'tft-settings' }
  )
)
