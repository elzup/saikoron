import { useCallback, useEffect, useRef, useState } from 'react'
import { useDice } from '../../hooks/useDice'
import { SIGNAGE_MAX_INTERVAL } from '../../lib/constants'
import { spinDice } from '../../lib/dice'
import { drawSample } from '../../lib/draw'
import { getSignageSettings } from '../../lib/viewSettings'
import type { Dice, DiceItem } from '../../types'
import { ModeLayout } from './ModeLayout'
import './SignageMode.css'

/** サイネージは自動送りのため、各項目ではなく開始/停止のみ履歴に残す */
const EVENT_START = '▶ 開始'
const EVENT_STOP = '⏹ 停止'

function SignageSettings({ dice }: { dice: Dice }) {
  const { setViewSetting } = useDice()
  const settings = getSignageSettings(dice)
  const { interval, displayCount, loop } = settings

  const patch = (p: Partial<typeof settings>) =>
    setViewSetting(dice.id, 'signage', { ...settings, ...p })

  return (
    <div className='signage-settings'>
      <div className='signage-setting-row'>
        <label htmlFor='signage-interval'>切替間隔</label>
        <div className='signage-setting-value'>
          <input
            id='signage-interval'
            type='number'
            min='1'
            max={SIGNAGE_MAX_INTERVAL}
            value={interval}
            onChange={(e) =>
              patch({ interval: Math.max(1, Number(e.target.value)) })
            }
            className='signage-setting-input'
          />
          <span>秒</span>
        </div>
      </div>

      <div className='signage-setting-row'>
        <label htmlFor='signage-display-count'>表示数</label>
        <div className='signage-setting-value'>
          <input
            id='signage-display-count'
            type='number'
            min='1'
            max={dice.items.length}
            value={displayCount}
            onChange={(e) =>
              patch({
                displayCount: Math.max(
                  1,
                  Math.min(dice.items.length, Number(e.target.value))
                ),
              })
            }
            className='signage-setting-input'
          />
          <span>/ {dice.items.length}</span>
        </div>
      </div>

      <div className='signage-setting-row'>
        <span>ループ</span>
        <div className='signage-setting-value'>
          <button
            type='button'
            className={`signage-toggle-btn ${loop ? 'active' : ''}`}
            onClick={() => patch({ loop: !loop })}
          >
            {loop ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SignageContent({ dice }: { dice: Dice }) {
  const { addRoll } = useDice()
  const { interval, displayCount, loop } = getSignageSettings(dice)
  const [current, setCurrent] = useState<DiceItem | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [fadeKey, setFadeKey] = useState(0)
  const [displayItems, setDisplayItems] = useState<DiceItem[]>([])
  const itemsRef = useRef<DiceItem[]>([])
  const shownIdsRef = useRef<Set<string>>(new Set())
  const startedRef = useRef(false)

  itemsRef.current = dice.items

  // 開始/停止のみを履歴に残す
  const logEvent = useCallback(
    (label: string) => {
      addRoll(dice.id, [{ id: 'signage-event', label, weight: 0 }], 'signage')
    },
    [addRoll, dice.id]
  )

  useEffect(() => {
    if (dice.items.length === 0) return
    if (isPaused) {
      if (startedRef.current) {
        logEvent(EVENT_STOP)
        startedRef.current = false
      }
    } else if (!startedRef.current) {
      logEvent(EVENT_START)
      startedRef.current = true
    }
  }, [isPaused, dice.items.length, logEvent])

  const next = useCallback(() => {
    let items = itemsRef.current
    if (items.length === 0) return

    if (!loop) {
      const remaining = items.filter(
        (item) => !shownIdsRef.current.has(item.id)
      )
      if (remaining.length === 0) {
        setIsPaused(true)
        return
      }
      items = remaining
    }

    if (displayCount <= 1) {
      const picked = spinDice(items)
      if (picked) {
        setCurrent(picked)
        setDisplayItems([])
        setFadeKey((k) => k + 1)
        shownIdsRef.current.add(picked.id)
      }
      return
    }

    const picked = drawSample(items, displayCount).picks
    setCurrent(null)
    setDisplayItems(picked)
    setFadeKey((k) => k + 1)
    for (const item of picked) {
      shownIdsRef.current.add(item.id)
    }
  }, [displayCount, loop])

  useEffect(() => {
    if (dice.items.length > 0 && !current && displayItems.length === 0) {
      next()
    }
  }, [current, dice.items.length, displayItems.length, next])

  useEffect(() => {
    if (isPaused || dice.items.length === 0) return
    const id = window.setInterval(next, interval * 1000)
    return () => window.clearInterval(id)
  }, [dice.items.length, interval, isPaused, next])

  return (
    <div className='signage-mode'>
      <div className='signage-container' onClick={() => setIsPaused(!isPaused)}>
        <div className='signage-display' key={fadeKey}>
          {displayItems.length > 0 ? (
            <div className='signage-multi'>
              {displayItems.map((item) => (
                <span key={item.id}>{item.label}</span>
              ))}
            </div>
          ) : current ? (
            current.label
          ) : (
            '...'
          )}
        </div>

        <div className='signage-footer'>
          <span className='signage-status'>
            {isPaused
              ? loop
                ? '一時停止中'
                : `完了 (${shownIdsRef.current.size}/${dice.items.length})`
              : `${interval}秒ごとに切替`}
          </span>
          <span className='signage-hint'>
            {isPaused ? 'クリックで再開' : 'クリックで一時停止'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SignageMode() {
  return (
    <ModeLayout
      modeId='signage'
      settings={(dice) => <SignageSettings dice={dice} />}
    >
      {(dice) => <SignageContent dice={dice} />}
    </ModeLayout>
  )
}
