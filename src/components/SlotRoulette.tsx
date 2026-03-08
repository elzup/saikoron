import { useState, useCallback, useRef, useEffect } from 'react'
import type { DiceItem } from '../types'
import { spinDice } from '../lib/dice'
import './SlotRoulette.css'

interface Props {
  items: DiceItem[]
  onResult?: (item: DiceItem) => void
  triggerSpin?: number
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

export function SlotRoulette({ items, onResult, triggerSpin }: Props) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<DiceItem | null>(null)
  const [displayIndex, setDisplayIndex] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  const triggerRef = useRef(triggerSpin ?? 0)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

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
    // Total steps: at least 2 full cycles + approach to winner
    const minCycles = 2
    const totalSteps = minCycles * items.length + Math.floor(Math.random() * items.length)

    let step = 0
    let currentIdx = displayIndex

    const tick = () => {
      step++
      currentIdx = (currentIdx + 1) % items.length

      // On the last few steps, ensure we land on the winner
      const remaining = totalSteps - step
      if (remaining <= 0) {
        // Final: snap to winner
        setDisplayIndex(winnerIndex)
        setIsSpinning(false)
        setResult(winner)
        onResult?.(winner)
        return
      }

      // Adjust current index to land on winner at the end
      if (remaining <= items.length) {
        // In the final approach, step toward the winner
        const stepsToWinner = (winnerIndex - currentIdx + items.length) % items.length
        if (stepsToWinner === remaining) {
          // We're on track
        }
      }

      setDisplayIndex(currentIdx)

      // Easing: start fast, gradually slow down
      const progress = step / totalSteps
      // Exponential ease-out: speed goes from 40ms to 350ms
      const delay = 40 + 310 * (progress * progress * progress)

      timeoutRef.current = window.setTimeout(tick, delay)
    }

    // Calculate the starting index so we land exactly on the winner
    // Work backwards from winnerIndex
    const startIdx = (winnerIndex - totalSteps % items.length + items.length * 100) % items.length
    currentIdx = startIdx

    // First tick immediately
    timeoutRef.current = window.setTimeout(tick, 40)
  }, [items, isSpinning, onResult, displayIndex])

  useEffect(() => {
    if (triggerSpin !== undefined && triggerSpin !== triggerRef.current) {
      triggerRef.current = triggerSpin
      spin()
    }
  }, [triggerSpin, spin])

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
