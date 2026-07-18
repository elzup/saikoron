import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ITEM_COLORS,
  itemDisplayColor,
  WHEEL_ANIMATION,
} from '../lib/constants'
import { calculateItemAngle, spinDice } from '../lib/dice'
import type { DiceItem } from '../types'
import './RouletteWheel.css'

interface Props {
  items: DiceItem[]
  onResult?: (item: DiceItem) => void
  triggerSpin?: number
}

export function RouletteWheel({ items, onResult, triggerSpin }: Props) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<DiceItem | null>(null)
  const triggerRef = useRef(triggerSpin ?? 0)
  const onResultRef = useRef(onResult)
  const wheelTitleId = useRef(
    `roulette-wheel-${Math.random().toString(36).slice(2)}`
  )
  onResultRef.current = onResult

  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    setIsSpinning(true)
    setResult(null)

    const winner = spinDice(items)
    if (!winner) {
      setIsSpinning(false)
      return
    }

    const winnerIndex = items.findIndex((item) => item.id === winner.id)
    const { startAngle, endAngle } = calculateItemAngle(items, winnerIndex)
    const midAngle = (startAngle + endAngle) / 2

    const spins =
      WHEEL_ANIMATION.MIN_SPINS + Math.random() * WHEEL_ANIMATION.RANDOM_SPINS
    const targetRotation = spins * 360 + (360 - midAngle)

    setRotation((prev) => prev + targetRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(winner)
      onResultRef.current?.(winner)
    }, WHEEL_ANIMATION.DURATION_MS)
  }, [items, isSpinning])

  useEffect(() => {
    if (triggerSpin !== undefined && triggerSpin !== triggerRef.current) {
      triggerRef.current = triggerSpin
      spin()
    }
  }, [triggerSpin, spin])

  return (
    <div className='roulette-container'>
      <div className='roulette-pointer' />
      <svg
        className='roulette-wheel'
        viewBox='-110 -110 220 220'
        role='button'
        tabIndex={0}
        aria-labelledby={wheelTitleId.current}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning
            ? `transform ${WHEEL_ANIMATION.DURATION_MS}ms ${WHEEL_ANIMATION.EASING}`
            : 'none',
        }}
        onClick={spin}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            spin()
          }
        }}
      >
        <title id={wheelTitleId.current}>ルーレットを回す</title>
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
                fill={
                  item.color ||
                  itemDisplayColor(
                    ITEM_COLORS[index % ITEM_COLORS.length],
                    index
                  )
                }
                stroke='#fff'
                strokeWidth='2'
              />
              <text
                x={textX}
                y={textY}
                fill='#fff'
                fontSize='12'
                fontWeight='bold'
                textAnchor='middle'
                dominantBaseline='middle'
                transform={`rotate(${textRotation}, ${textX}, ${textY})`}
              >
                {item.label.length > 8
                  ? `${item.label.slice(0, 8)}...`
                  : item.label}
              </text>
            </g>
          )
        })}
        {items.length === 0 && (
          <text
            fill='#999'
            fontSize='14'
            textAnchor='middle'
            dominantBaseline='middle'
          >
            項目を追加してください
          </text>
        )}
      </svg>
      <button
        type='button'
        className='spin-button'
        onClick={spin}
        disabled={isSpinning || items.length === 0}
      >
        {isSpinning ? '回転中...' : 'スピン'}
      </button>
      {result && (
        <div className='result'>
          邨先棡: <strong>{result.label}</strong>
        </div>
      )}
    </div>
  )
}
