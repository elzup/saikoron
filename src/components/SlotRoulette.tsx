import { useState, useCallback, useRef, useEffect } from 'react'
import type { RouletteItem } from '../types'
import { spinRoulette } from '../lib/roulette'
import './SlotRoulette.css'

interface Props {
  items: RouletteItem[]
  onResult?: (item: RouletteItem) => void
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

export function SlotRoulette({ items, onResult }: Props) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<RouletteItem | null>(null)
  const [displayIndex, setDisplayIndex] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    setIsSpinning(true)
    setResult(null)

    const winner = spinRoulette(items)
    if (!winner) {
      setIsSpinning(false)
      return
    }

    let speed = 50
    let iterations = 0
    const maxIterations = 30 + Math.floor(Math.random() * 20)
    const winnerIndex = items.findIndex((item) => item.id === winner.id)

    const animate = () => {
      iterations++
      setDisplayIndex((prev) => (prev + 1) % items.length)

      if (iterations >= maxIterations - 5) {
        speed += 50
      }

      if (iterations >= maxIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setDisplayIndex(winnerIndex)
        setIsSpinning(false)
        setResult(winner)
        onResult?.(winner)
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        intervalRef.current = window.setInterval(animate, speed)
      }
    }

    intervalRef.current = window.setInterval(animate, speed)
  }, [items, isSpinning, onResult])

  const prevIndex = (displayIndex - 1 + items.length) % items.length
  const nextIndex = (displayIndex + 1) % items.length

  return (
    <div className="slot-container">
      <div className="slot-window">
        {items.length > 0 ? (
          <>
            <div className="slot-item prev" style={{ backgroundColor: COLORS[prevIndex % COLORS.length] }}>
              {items[prevIndex]?.label}
            </div>
            <div
              className={`slot-item current ${isSpinning ? 'spinning' : ''}`}
              style={{ backgroundColor: COLORS[displayIndex % COLORS.length] }}
            >
              {items[displayIndex]?.label}
            </div>
            <div className="slot-item next" style={{ backgroundColor: COLORS[nextIndex % COLORS.length] }}>
              {items[nextIndex]?.label}
            </div>
          </>
        ) : (
          <div className="slot-item current empty">項目を追加してください</div>
        )}
        <div className="slot-highlight" />
      </div>

      <button
        className="spin-button"
        onClick={spin}
        disabled={isSpinning || items.length === 0}
      >
        {isSpinning ? '抽選中...' : 'スタート'}
      </button>

      {result && (
        <div className="result">
          結果: <strong>{result.label}</strong>
        </div>
      )}
    </div>
  )
}
