import { useState, useCallback } from 'react'
import type { RouletteItem } from '../types'
import { spinRoulette, calculateItemAngle } from '../lib/roulette'
import './RouletteWheel.css'

interface Props {
  items: RouletteItem[]
  onResult?: (item: RouletteItem) => void
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

export function RouletteWheel({ items, onResult }: Props) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<RouletteItem | null>(null)

  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    setIsSpinning(true)
    setResult(null)

    const winner = spinRoulette(items)
    if (!winner) {
      setIsSpinning(false)
      return
    }

    const winnerIndex = items.findIndex((item) => item.id === winner.id)
    const { startAngle, endAngle } = calculateItemAngle(items, winnerIndex)
    const midAngle = (startAngle + endAngle) / 2

    // 5-8周回転 + 当たり位置で止まる
    const spins = 5 + Math.random() * 3
    const targetRotation = spins * 360 + (360 - midAngle)

    setRotation((prev) => prev + targetRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(winner)
      onResult?.(winner)
    }, 4000)
  }, [items, isSpinning, onResult])

  return (
    <div className="roulette-container">
      <div className="roulette-pointer" />
      <svg
        className="roulette-wheel"
        viewBox="-110 -110 220 220"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none',
        }}
        onClick={spin}
      >
        {items.map((item, index) => {
          const { startAngle, endAngle } = calculateItemAngle(items, index)
          const largeArc = endAngle - startAngle > 180 ? 1 : 0
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180

          const x1 = Math.cos(startRad) * 100
          const y1 = Math.sin(startRad) * 100
          const x2 = Math.cos(endRad) * 100
          const y2 = Math.sin(endRad) * 100

          const midRad = ((startAngle + endAngle) / 2) * (Math.PI / 180)
          const textX = Math.cos(midRad) * 60
          const textY = Math.sin(midRad) * 60
          const textRotation = (startAngle + endAngle) / 2

          return (
            <g key={item.id}>
              <path
                d={`M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={textX}
                y={textY}
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textRotation}, ${textX}, ${textY})`}
              >
                {item.label.length > 8 ? item.label.slice(0, 8) + '...' : item.label}
              </text>
            </g>
          )
        })}
        {items.length === 0 && (
          <text fill="#999" fontSize="14" textAnchor="middle" dominantBaseline="middle">
            項目を追加してください
          </text>
        )}
      </svg>
      <button
        className="spin-button"
        onClick={spin}
        disabled={isSpinning || items.length === 0}
      >
        {isSpinning ? '回転中...' : 'スピン'}
      </button>
      {result && (
        <div className="result">
          結果: <strong>{result.label}</strong>
        </div>
      )}
    </div>
  )
}
