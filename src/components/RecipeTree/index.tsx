import { CompletedItem, BaseComponent } from '../../types'

interface RecipeTreeProps {
  completedItems: CompletedItem[]
  baseComponents: BaseComponent[]
  availableComponentIds?: string[]
  className?: string
}

function matchStatus(
  item: CompletedItem,
  availableIds: string[] | undefined,
): 'full' | 'partial' | 'none' | 'unknown' {
  if (!availableIds) return 'unknown'
  const matched = item.components.filter((c) => availableIds.includes(c)).length
  if (matched === 2) return 'full'
  if (matched === 1) return 'partial'
  return 'none'
}

export default function RecipeTree({
  completedItems,
  baseComponents,
  availableComponentIds,
  className = '',
}: RecipeTreeProps) {
  const componentMap = Object.fromEntries(baseComponents.map((c) => [c.id, c.name]))

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {completedItems.map((item) => {
        const status = matchStatus(item, availableComponentIds)

        let rowClass = 'flex items-center gap-2 px-3 py-2 rounded text-sm'
        if (status === 'full') rowClass += ' bg-green-900/40 border border-green-700 text-green-200'
        else if (status === 'partial') rowClass += ' bg-yellow-900/30 border border-yellow-700 text-yellow-200'
        else if (status === 'none') rowClass += ' bg-gray-800/60 border border-gray-700 text-gray-500'
        else rowClass += ' bg-gray-800 border border-gray-700 text-gray-300'

        const [c1, c2] = item.components
        return (
          <div key={item.id} className={rowClass}>
            <span className="font-medium min-w-0 truncate">
              {componentMap[c1] ?? c1}
            </span>
            <span className="text-gray-500 shrink-0">+</span>
            <span className="font-medium min-w-0 truncate">
              {componentMap[c2] ?? c2}
            </span>
            <span className="text-gray-500 shrink-0">→</span>
            <span className="font-bold shrink-0">{item.name}</span>
            {status === 'full' && (
              <span className="ml-auto text-green-400 text-xs shrink-0">✓ Ready</span>
            )}
            {status === 'partial' && (
              <span className="ml-auto text-yellow-400 text-xs shrink-0">½</span>
            )}
          </div>
        )
      })}
      {completedItems.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No items to show</p>
      )}
    </div>
  )
}
