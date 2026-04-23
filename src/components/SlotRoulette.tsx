import { useCallback, useEffect, useRef, useState } from 'react'
import { ITEM_COLORS, SLOT_ANIMATION } from '../lib/constants'
import { spinDice } from '../lib/dice'
import type { DiceItem } from '../types'
import './SlotRoulette.css'

interface Props {
  items: DiceItem[]
  onResult?: (item: DiceItem) => void
  triggerSpin?: number
}

export function SlotRoulette({ items, onResult, triggerSpin }: Props) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<DiceItem | null>(null)
  const [displayIndex, setDisplayIndex] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  const triggerRef = useRef(triggerSpin ?? 0)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
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
    const totalSteps = SLOT_ANIMATION.TOTAL_STEPS
    const delayRange = SLOT_ANIMATION.MAX_DELAY - SLOT_ANIMATION.MIN_DELAY

    const startIdx =
      (winnerIndex - (totalSteps % items.length) + items.length * 100) %
      items.length
    let currentIdx = startIdx
    let step = 0

    const tick = () => {
      step++
      currentIdx = (currentIdx + 1) % items.length
      const remaining = totalSteps - step

      if (remaining <= 0) {
        setDisplayIndex(winnerIndex)
        setIsSpinning(false)
        setResult(winner)
        onResultRef.current?.(winner)
        return
      }

      setDisplayIndex(currentIdx)

      const progress = step / totalSteps
      const delay =
        SLOT_ANIMATION.MIN_DELAY + delayRange * (progress * progress * progress)
      timeoutRef.current = window.setTimeout(tick, delay)
    }

    timeoutRef.current = window.setTimeout(tick, SLOT_ANIMATION.MIN_DELAY)
  }, [items, isSpinning])

  useEffect(() => {
    if (triggerSpin !== undefined && triggerSpin !== triggerRef.current) {
      triggerRef.current = triggerSpin
      spin()
    }
  }, [triggerSpin, spin])

  const prevIndex = (displayIndex - 1 + items.length) % items.length
  const nextIndex = (displayIndex + 1) % items.length

  return (
    <div className='slot-container'>
      <div className='slot-window'>
        {items.length > 0 ? (
          <>
            <div
              className='slot-item prev'
              style={{
                backgroundColor: ITEM_COLORS[prevIndex % ITEM_COLORS.length],
              }}
            >
              {items[prevIndex]?.label}
            </div>
            <div
              className={`slot-item current ${isSpinning ? 'spinning' : ''}`}
              style={{
                backgroundColor: ITEM_COLORS[displayIndex % ITEM_COLORS.length],
              }}
            >
              {items[displayIndex]?.label}
            </div>
            <div
              className='slot-item next'
              style={{
                backgroundColor: ITEM_COLORS[nextIndex % ITEM_COLORS.length],
              }}
            >
              {items[nextIndex]?.label}
            </div>
          </>
        ) : (
          <div className='slot-item current empty'>
            鬆・岼繧定ｿｽ蜉縺励※縺上□縺輔＞
          </div>
        )}
        <div className='slot-highlight' />
      </div>

      <button
        type='button'
        className='spin-button'
        onClick={spin}
        disabled={isSpinning || items.length === 0}
      >
        {isSpinning ? '謚ｽ驕ｸ荳ｭ...' : '繧ｹ繧ｿ繝ｼ繝・'}
      </button>

      {result && (
        <div className='result'>
          邨先棡: <strong>{result.label}</strong>
        </div>
      )}
    </div>
  )
}
