// ── Rank System ──────────────────────────────────────────────────────────────

export type Rank =
  | 'S+' | 'S' | 'S-'
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'

// ── Set data types (read-only, from JSON files) ───────────────────────────────

export interface Trait {
  id: string          // e.g. "dark-star"
  name: string        // e.g. "Dark Star"
  description: string
  breakpoints: number[] // e.g. [2, 4, 6]
  icon?: string
}

export interface Champion {
  id: string          // e.g. "jhin"
  name: string        // e.g. "Jhin"
  cost: 1 | 2 | 3 | 4 | 5
  traits: string[]    // trait ids
  icon?: string
}

export interface BaseComponent {
  id: string          // e.g. "bf-sword"
  name: string        // e.g. "B.F. Sword"
  icon?: string
}

export interface CompletedItem {
  id: string          // e.g. "infinity-edge"
  name: string        // e.g. "Infinity Edge"
  components: [string, string]  // two BaseComponent ids
  icon?: string
}

export type AnyItem = BaseComponent | CompletedItem

export function isCompletedItem(item: AnyItem): item is CompletedItem {
  return 'components' in item
}

// ── User comp types (stored in localStorage) ─────────────────────────────────

export interface HexPosition {
  row: number   // 0-3  (TFT board is 4 rows)
  col: number   // 0-6  (TFT board is 7 cols)
}

export interface CompChampion {
  championId: string
  items: string[]        // CompletedItem ids (max 3)
  position?: HexPosition
  isCarry: boolean
}

export interface TeamComp {
  id: string
  name: string
  rank: Rank
  champions: CompChampion[]
  notes?: string
  createdAt: number      // Date.now()
  updatedAt: number
}

// ── Game session types (in-memory, not persisted) ─────────────────────────────

export interface GameState {
  selectedChampionIds: string[]    // champions currently on bench/board
  selectedComponentIds: string[]   // base component items held
}

// ── Scoring / suggestion types ────────────────────────────────────────────────

export interface ItemMatchDetail {
  completedItemId: string
  completedItemName: string
  canBuild: boolean            // all components available
  partialMatch: number         // 0, 1, or 2 components matched
}

export interface CompSuggestion {
  comp: TeamComp
  finalScore: number
  rankScore: number
  directRatio: number          // 0.0–1.0
  traitRatio: number           // 0.0–1.0
  itemMatchRatio: number       // 0.0–1.0
  matchedChampionIds: string[]
  sharedTraitIds: string[]
  itemDetails: ItemMatchDetail[]
}

// ── Store types ───────────────────────────────────────────────────────────────

export interface CompStoreState {
  comps: TeamComp[]
  seeded: boolean
  addComp: (comp: Omit<TeamComp, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateComp: (id: string, updates: Partial<Omit<TeamComp, 'id' | 'createdAt'>>) => void
  deleteComp: (id: string) => void
  duplicateComp: (id: string) => void
  importComps: (comps: TeamComp[]) => void
}

export interface GameStoreState extends GameState {
  toggleChampion: (championId: string) => void
  toggleComponent: (componentId: string) => void
  clearAll: () => void
}

export interface ScoringWeights {
  directWeight: number    // default 3.0
  traitWeight: number     // default 1.0
  itemWeight: number      // default 2.0
}

export interface SettingsState {
  weights: ScoringWeights
  activeSetId: string     // e.g. "set17"
  setWeights: (weights: Partial<ScoringWeights>) => void
  setActiveSet: (setId: string) => void
}

