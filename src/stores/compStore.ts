import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TeamComp, CompStoreState } from '../types'

export const useCompStore = create<CompStoreState>()(
  persist(
    (set, get) => ({
      comps: [],
      seeded: false,
      addComp: (compData) => {
        const comp: TeamComp = {
          ...compData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set(state => ({ comps: [...state.comps, comp] }))
      },
      updateComp: (id, updates) => set(state => ({
        comps: state.comps.map(c =>
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      })),
      deleteComp: (id) => set(state => ({
        comps: state.comps.filter(c => c.id !== id)
      })),
      duplicateComp: (id) => {
        const comp = get().comps.find(c => c.id === id)
        if (!comp) return
        const duplicate: TeamComp = {
          ...comp,
          id: crypto.randomUUID(),
          name: `${comp.name} (copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set(state => ({ comps: [...state.comps, duplicate] }))
      },
      importComps: (comps) => set({ comps }),
    }),
    { name: 'tft-comps' }
  )
)

// ── Sample comps seed ────────────────────────────────────────────────────────

export function seedSampleComps(): void {
  const now = Date.now()

  const samples: TeamComp[] = [
    {
      id: crypto.randomUUID(),
      name: 'Dark Star Jhin',
      rank: 'S',
      notes: 'Jhin carry with IE + Last Whisper + Rabadon. Build Dark Star for execute power.',
      createdAt: now,
      updatedAt: now,
      champions: [
        { championId: 'jhin',        isCarry: true,  items: ['infinity-edge', 'last-whisper', 'rabadons-deathcap'], position: { row: 3, col: 6 } },
        { championId: 'karma',       isCarry: false, items: ['guinsoos-rageblade'],                                 position: { row: 3, col: 4 } },
        { championId: 'kaisa',       isCarry: false, items: ['void-staff'],                                         position: { row: 3, col: 2 } },
        { championId: 'mordekaiser', isCarry: false, items: ['warmogs-armor'],                                      position: { row: 0, col: 3 } },
        { championId: 'chogath',     isCarry: false, items: ['bramble-vest'],                                       position: { row: 0, col: 1 } },
        { championId: 'lissandra',   isCarry: false, items: ['blue-buff'],                                          position: { row: 1, col: 5 } },
        { championId: 'zoe',         isCarry: false, items: [],                                                     position: { row: 1, col: 3 } },
        { championId: 'belveth',     isCarry: false, items: [],                                                     position: { row: 2, col: 5 } },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Meeple Party',
      rank: 'A',
      notes: 'Veigar carry with Jeweled Gauntlet. Poppy + Rammus frontline. Scale with Meeple trait.',
      createdAt: now,
      updatedAt: now,
      champions: [
        { championId: 'poppy',  isCarry: false, items: ['warmogs-armor', 'sunfire-cape'],           position: { row: 0, col: 0 } },
        { championId: 'veigar', isCarry: true,  items: ['rabadons-deathcap', 'jeweled-gauntlet'],   position: { row: 3, col: 3 } },
        { championId: 'gnar',   isCarry: false, items: ['titans-resolve'],                          position: { row: 0, col: 6 } },
        { championId: 'fizz',   isCarry: false, items: ['blue-buff'],                               position: { row: 2, col: 2 } },
        { championId: 'corki',  isCarry: false, items: ['spirit-visage'],                           position: { row: 1, col: 4 } },
        { championId: 'rammus', isCarry: false, items: [],                                          position: { row: 0, col: 4 } },
        { championId: 'bard',   isCarry: false, items: ['archangels-staff'],                        position: { row: 3, col: 1 } },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Psionic Ops',
      rank: 'B+',
      notes: 'Viktor AP carry. Master Yi as secondary damage. Gragas + Pyke frontline.',
      createdAt: now,
      updatedAt: now,
      champions: [
        { championId: 'viktor',    isCarry: true,  items: ['archangels-staff', 'rabadons-deathcap'],  position: { row: 3, col: 3 } },
        { championId: 'master-yi', isCarry: false, items: ['guinsoos-rageblade', 'titans-resolve'],   position: { row: 3, col: 5 } },
        { championId: 'sona',      isCarry: false, items: ['blue-buff'],                              position: { row: 2, col: 4 } },
        { championId: 'gragas',    isCarry: false, items: ['warmogs-armor', 'sunfire-cape'],          position: { row: 0, col: 2 } },
        { championId: 'pyke',      isCarry: false, items: ['edge-of-night'],                          position: { row: 0, col: 4 } },
        { championId: 'riven',     isCarry: false, items: [],                                         position: { row: 1, col: 3 } },
      ],
    },
  ]

  useCompStore.setState({ comps: samples, seeded: true })
}
