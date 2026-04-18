import { TeamComp } from '../../types'
import RankBadge from '../RankBadge'

interface CompCardProps {
  comp: TeamComp
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  score?: number
  directRatio?: number
  traitRatio?: number
  itemMatchRatio?: number
  matchedChampionIds?: string[]
  sharedTraitIds?: string[]
  championNames?: Record<string, string>
}

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-gray-300">{Math.round(value * 100)}%</span>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#6b7280'
}

export default function CompCard({
  comp,
  onClick,
  onEdit,
  onDelete,
  score,
  directRatio,
  traitRatio,
  itemMatchRatio,
  matchedChampionIds,
  sharedTraitIds,
  championNames,
}: CompCardProps) {
  const hasScore = score !== undefined
  const hasActions = onEdit || onDelete

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-action]')) return
    onClick?.()
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors p-4 flex flex-col gap-3 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <RankBadge rank={comp.rank} size="md" />
          <span className="font-bold text-white truncate">{comp.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-400">{comp.champions.filter(c => !c.championId.startsWith('__dummy_')).length} champs</span>
          {hasActions && (
            <div className="flex gap-1 ml-2" data-action>
              {onEdit && (
                <button
                  data-action
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="text-xs text-gray-400 hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  data-action
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="text-xs text-gray-400 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Score section */}
      {hasScore && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Score</span>
            <span className="font-bold text-sm" style={{ color: scoreColor(score) }}>
              {Math.round(score)}
            </span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ width: `${Math.min(score, 100)}%`, backgroundColor: scoreColor(score) }}
              />
            </div>
          </div>

          {directRatio !== undefined && (
            <ScoreBar value={directRatio} label="Champions" color="#60a5fa" />
          )}
          {traitRatio !== undefined && (
            <ScoreBar value={traitRatio} label="Traits" color="#a78bfa" />
          )}
          {itemMatchRatio !== undefined && (
            <ScoreBar value={itemMatchRatio} label="Items" color="#34d399" />
          )}

          {/* Why this comp */}
          {((matchedChampionIds && matchedChampionIds.length > 0) ||
            (sharedTraitIds && sharedTraitIds.length > 0)) && (
            <details className="mt-1">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
                Why this comp?
              </summary>
              <div className="mt-2 flex flex-col gap-1.5 text-xs">
                {matchedChampionIds && matchedChampionIds.length > 0 && (
                  <div>
                    <span className="text-gray-400">Matched champions: </span>
                    <span className="text-blue-300">
                      {matchedChampionIds
                        .map((id) => championNames?.[id] ?? id)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {sharedTraitIds && sharedTraitIds.length > 0 && (
                  <div>
                    <span className="text-gray-400">Shared traits: </span>
                    <span className="text-purple-300">{sharedTraitIds.join(', ')}</span>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
