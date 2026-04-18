import { Rank } from '../types'

export const RANK_WEIGHTS: Record<Rank, number> = {
  'S+': 20, 'S': 18, 'S-': 16,
  'A+': 14, 'A': 12, 'A-': 10,
  'B+': 9,  'B': 8,  'B-': 7,
  'C+': 6,  'C': 5,  'C-': 4,
  'D+': 3,  'D': 2,  'D-': 1,
}

export const ALL_RANKS: Rank[] = [
  'S+', 'S', 'S-', 'A+', 'A', 'A-',
  'B+', 'B', 'B-', 'C+', 'C', 'C-',
  'D+', 'D', 'D-'
]

export function rankToWeight(rank: Rank): number {
  return RANK_WEIGHTS[rank]
}

export function rankColorClass(rank: Rank): string {
  const tier = rank[0]
  if (tier === 'S') return 'bg-amber-500 text-black'
  if (tier === 'A') return 'bg-orange-500 text-white'
  if (tier === 'B') return 'bg-blue-500 text-white'
  if (tier === 'C') return 'bg-green-500 text-white'
  return 'bg-gray-500 text-white'
}
