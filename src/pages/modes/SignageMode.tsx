import { useState, useEffect, useCallback, useRef } from 'react'
import { ModeLayout } from './ModeLayout'
import { spinDice } from '../../lib/dice'
import type { DiceItem } from '../../types'
import './SignageMode.css'

export function SignageMode() {
  const [current, setCurrent] = useState<DiceItem | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [fadeKey, setFadeKey] = useState(0)
  const [interval, setInterval_] = useState(5)
  const [displayCount, setDisplayCount] = useState(1)
  const [displayItems, setDisplayItems] = useState<DiceItem[]>([])
  const itemsRef = useRef<DiceItem[]>([])

  const next = useCallback(() => {
    const items = itemsRef.current
    if (items.length === 0) return
    if (displayCount <= 1) {
      const picked = spinDice(items)
      if (picked) {
        setCurrent(picked)
        setDisplayItems([])
        setFadeKey((k) => k + 1)
      }
    } else {
      const picked: DiceItem[] = []
      const pool = [...items]
      const n = Math.min(displayCount, pool.length)
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length)
        picked.push(pool[idx])
        pool.splice(idx, 1)
      }
      setCurrent(null)
      setDisplayItems(picked)
      setFadeKey((k) => k + 1)
    }
  }, [displayCount])

  return (
    <ModeLayout
      modeId="signage"
      settings={(dice) => (
        <div className="signage-settings">
          <div className="signage-setting-row">
            <label>切替間隔</label>
            <div className="signage-setting-value">
              <input
                type="number"
                min="1"
                max="60"
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, Number(e.target.value)))}
                className="signage-setting-input"
              />
              <span>秒</span>
            </div>
          </div>
          <div className="signage-setting-row">
            <label>表示数</label>
            <div className="signage-setting-value">
              <input
                type="number"
                min="1"
                max={dice.items.length}
                value={displayCount}
                onChange={(e) => setDisplayCount(Math.max(1, Math.min(dice.items.length, Number(e.target.value))))}
                className="signage-setting-input"
              />
              <span>/ {dice.items.length}</span>
            </div>
          </div>
        </div>
      )}
    >
      {(dice) => {
        itemsRef.current = dice.items

        useEffect(() => {
          if (dice.items.length > 0 && !current && displayItems.length === 0) {
            next()
          }
        }, [dice.items.length])

        useEffect(() => {
          if (isPaused || dice.items.length === 0) return
          const id = window.setInterval(next, interval * 1000)
          return () => window.clearInterval(id)
        }, [isPaused, dice.items.length, interval, next])

        return (
          <div className="signage-container" onClick={() => setIsPaused(!isPaused)}>
            <div className="signage-display" key={fadeKey}>
              {displayItems.length > 0 ? (
                <div className="signage-multi">
                  {displayItems.map((item, i) => (
                    <span key={i}>{item.label}</span>
                  ))}
                </div>
              ) : (
                current ? current.label : '—'
              )}
            </div>
            <div className="signage-footer">
              <span className="signage-status">
                {isPaused ? '一時停止中' : `${interval}秒ごとに切替`}
              </span>
              <span className="signage-hint">
                {isPaused ? 'クリックで再開' : 'クリックで一時停止'}
              </span>
            </div>
          </div>
        )
      }}
    </ModeLayout>
  )
}
