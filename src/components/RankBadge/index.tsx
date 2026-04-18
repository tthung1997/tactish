import { Rank } from '../../types'

interface RankBadgeProps {
  rank: Rank
  size?: 'sm' | 'md' | 'lg'
}

const rankStyle: Record<string, { bg: string; text: string }> = {
  'S+': { bg: '#f59e0b', text: '#111827' },
  'S':  { bg: '#f59e0b', text: '#111827' },
  'S-': { bg: '#f59e0b', text: '#111827' },
  'A+': { bg: '#f97316', text: '#ffffff' },
  'A':  { bg: '#f97316', text: '#ffffff' },
  'A-': { bg: '#f97316', text: '#ffffff' },
  'B+': { bg: '#3b82f6', text: '#ffffff' },
  'B':  { bg: '#3b82f6', text: '#ffffff' },
  'B-': { bg: '#3b82f6', text: '#ffffff' },
  'C+': { bg: '#22c55e', text: '#ffffff' },
  'C':  { bg: '#22c55e', text: '#ffffff' },
  'C-': { bg: '#22c55e', text: '#ffffff' },
  'D+': { bg: '#6b7280', text: '#ffffff' },
  'D':  { bg: '#6b7280', text: '#ffffff' },
  'D-': { bg: '#6b7280', text: '#ffffff' },
}

const sizeClass = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
}

export default function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const { bg, text } = rankStyle[rank] ?? { bg: '#6b7280', text: '#ffffff' }
  return (
    <span
      className={`inline-block font-bold rounded leading-none ${sizeClass[size]}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {rank}
    </span>
  )
}
