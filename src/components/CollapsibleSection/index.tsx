import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export default function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const showBadge = badge !== undefined && badge !== 0

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-700/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white uppercase tracking-wide">{title}</span>
          {showBadge && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-yellow-500 text-gray-900 text-xs font-bold leading-none">
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs select-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
