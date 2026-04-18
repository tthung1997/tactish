import { BaseComponent } from '../../types'
import { getItemIconUrl } from '../../utils/icons'

interface ItemSelectProps {
  baseComponents: BaseComponent[]
  selected: string[]
  onToggle: (componentId: string) => void
  counts?: Record<string, number>
  onCountChange?: (componentId: string, count: number) => void
}

export default function ItemSelect({
  baseComponents,
  selected,
  onToggle,
  counts,
  onCountChange,
}: ItemSelectProps) {
  function handleCountChange(id: string, delta: number) {
    if (!onCountChange) return
    const current = counts?.[id] ?? 0
    const next = Math.min(9, Math.max(0, current + delta))
    onCountChange(id, next)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {baseComponents.map((item) => {
        const isSelected = selected.includes(item.id)
        const count = counts?.[item.id] ?? 0

        return (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggle(item.id)}
              className={`w-full flex flex-col items-center rounded overflow-hidden transition-all ${
                isSelected
                  ? 'border-2 border-yellow-400'
                  : 'border-2 border-gray-600 hover:border-gray-400'
              }`}
              title={item.name}
            >
              <img
                src={getItemIconUrl(item.id)}
                alt={item.name}
                className="w-full aspect-square object-cover"
                style={{ filter: isSelected ? 'brightness(1.1)' : 'brightness(0.8)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <span className={`w-full text-center text-xs font-medium px-1 py-0.5 leading-tight ${
                isSelected ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-700 text-gray-300'
              }`}>
                {item.name}
              </span>
            </button>

            {onCountChange && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCountChange(item.id, -1)}
                  className="w-5 h-5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-xs flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-4 text-center text-xs text-gray-300">{count}</span>
                <button
                  onClick={() => handleCountChange(item.id, +1)}
                  className="w-5 h-5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
