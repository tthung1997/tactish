import { useState } from 'react'
import { getChampionIconUrl } from '../../utils/icons'

export interface HexPosition {
  row: number
  col: number
}

export interface PlacedChampion {
  championId: string
  championName: string
  cost: 1 | 2 | 3 | 4 | 5
  isCarry?: boolean
  icon?: string
}

export interface HexGridProps {
  onHexClick?: (position: HexPosition) => void
  placements?: Record<string, PlacedChampion>
  selectedHex?: HexPosition | null
  interactive?: boolean
  className?: string
}

// ── Geometry constants ──────────────────────────────────────────────────────
const ROWS = 4
const COLS = 7
const R = 32                        // center-to-vertex radius
const W = R * Math.sqrt(3)          // ≈ 55.4  (hex width)
const H = R * 2                     // 64      (hex height)
const V_SPACING = H * 0.75          // 48      (row-to-row center distance)
const PADDING = 12

const VIEWBOX_W = Math.ceil(PADDING + W + COLS * W + R + PADDING)   // ~452
const VIEWBOX_H = Math.ceil(PADDING + R + (ROWS - 1) * V_SPACING + R + PADDING)  // ~232

// ── Colour helpers ──────────────────────────────────────────────────────────
const COST_COLORS: Record<number, string> = {
  1: '#808080',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b',
}

// Return SVG polygon points string for a pointy-top hex centered at (cx, cy)
function hexPoints(cx: number, cy: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angleDeg = 60 * i - 90
    const angleRad = (angleDeg * Math.PI) / 180
    return `${cx + R * Math.cos(angleRad)},${cy + R * Math.sin(angleRad)}`
  }).join(' ')
}

// Hex center coordinates for a given row/col
function hexCenter(row: number, col: number): [number, number] {
  // Even rows start at W/2, odd rows at W (offset by W/2)
  const xOffset = row % 2 === 0 ? W / 2 : W
  const cx = PADDING + xOffset + col * W
  const cy = PADDING + R + row * V_SPACING
  return [cx, cy]
}

function posKey(row: number, col: number) {
  return `${row}-${col}`
}

// ── Single hex cell ─────────────────────────────────────────────────────────
interface HexCellProps {
  row: number
  col: number
  champion: PlacedChampion | undefined
  isSelected: boolean
  interactive: boolean
  onHexClick?: (pos: HexPosition) => void
}

function HexCell({ row, col, champion, isSelected, interactive, onHexClick }: HexCellProps) {
  const [hovered, setHovered] = useState(false)
  const [cx, cy] = hexCenter(row, col)
  const points = hexPoints(cx, cy)

  let fill: string
  if (champion) {
    fill = COST_COLORS[champion.cost]
  } else if (hovered && interactive) {
    fill = '#2a3a5b'
  } else {
    fill = '#1a2035'
  }

  const strokeColor = isSelected ? '#fbbf24' : '#3a4a6b'
  const strokeWidth = isSelected ? 2.5 : 1.5

  const handleClick = () => {
    if (interactive && onHexClick) {
      onHexClick({ row, col })
    }
  }

  // Clip path ID for this hex (unique per cell)
  const clipId = `hex-clip-${row}-${col}`
  // Expand icon to cover the full hex bounding box so it fills edge-to-edge
  const iconSize = R * 2
  const iconX = cx - iconSize / 2
  const iconY = cy - iconSize / 2

  return (
    <g
      onClick={handleClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points={points} />
        </clipPath>
      </defs>

      <polygon
        points={points}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{ transition: 'fill 0.1s' }}
      />

      {/* Champion icon clipped to hex shape */}
      {champion && (
        <image
          href={champion.icon ?? getChampionIconUrl(champion.championId)}
          x={iconX}
          y={iconY}
          width={iconSize}
          height={iconSize}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.85 }}
        />
      )}

      {/* Cost-color border overlay (drawn on top of icon) */}
      {champion && (
        <polygon
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Champion name label at bottom of hex */}
      {champion && (
        <text
          x={cx}
          y={cy + R * 0.72}
          textAnchor="middle"
          fontSize={8}
          fontWeight={700}
          fill="#ffffff"
          stroke="#000"
          strokeWidth={2}
          paintOrder="stroke"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          {champion.championName.length > 8
            ? champion.championName.slice(0, 7) + '…'
            : champion.championName}
        </text>
      )}

      {/* Carry star indicator */}
      {champion?.isCarry && (
        <text
          x={cx + R * 0.55}
          y={cy - R * 0.5}
          fontSize={10}
          textAnchor="middle"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          ⭐
        </text>
      )}
    </g>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HexGrid({
  onHexClick,
  placements = {},
  selectedHex = null,
  interactive = false,
  className,
}: HexGridProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width={VIEWBOX_W}
      height={VIEWBOX_H}
      className={className}
      style={{ display: 'block' }}
    >
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = posKey(row, col)
          const champion = placements[key]
          const isSelected =
            selectedHex !== null &&
            selectedHex !== undefined &&
            selectedHex.row === row &&
            selectedHex.col === col

          return (
            <HexCell
              key={key}
              row={row}
              col={col}
              champion={champion}
              isSelected={isSelected}
              interactive={interactive}
              onHexClick={onHexClick}
            />
          )
        })
      )}
    </svg>
  )
}


