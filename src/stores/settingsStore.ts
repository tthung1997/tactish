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
    {
      name: 'tft-settings',
      // Merge persisted weights with defaults so new fields (e.g. godWeight) are always present
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsState>),
        weights: {
          ...DEFAULT_WEIGHTS,
          ...((persisted as Partial<SettingsState>)?.weights ?? {}),
        },
      }),
    }
  )
)
