import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDice } from '../../hooks/useDice'
import {
  DICE3D_ANIMATION,
  itemDisplayColor,
  MAX_ROLL_COUNT,
} from '../../lib/constants'
import { drawSum } from '../../lib/draw'
import { getDice3dSettings } from '../../lib/viewSettings'
import type { Dice, DiceItem } from '../../types'
import './Dice3DMode.css'
import { ModeLayout } from './ModeLayout'

/** キューブ6面の安定キー（front/back/right/left/top/bottom の順） */
const FACE_KEYS = ['front', 'back', 'right', 'left', 'top', 'bottom']

/** 面スタイル（後から切り替え可能。デフォルトはペーパー） */
export type FaceStyle = 'paper' | 'number' | 'gloss' | 'neon'

export const FACE_STYLES: { id: FaceStyle; label: string }[] = [
  { id: 'paper', label: 'ペーパー' },
  { id: 'number', label: '数字' },
  { id: 'gloss', label: 'グロス' },
  { id: 'neon', label: 'ネオン' },
]

const FACE_STYLE_KEY = 'saikoron_dice3d_style'

function loadFaceStyle(): FaceStyle {
  try {
    const value = localStorage.getItem(FACE_STYLE_KEY)
    if (value && FACE_STYLES.some((s) => s.id === value)) {
      return value as FaceStyle
    }
  } catch {
    // ignore
  }
  return 'paper'
}

interface DieState {
  faces: string[]
  color: string
  rotX: number
  rotY: number
}

/** キューブ6面のラベルを作る。index 0（正面）が当選ラベル */
function buildFaces(items: DiceItem[], pick: DiceItem): string[] {
  const others = items.filter((item) => item.id !== pick.id)
  const faces = [pick.label]
  for (let i = 0; i < 5; i++) {
    const src = others.length > 0 ? others[i % others.length] : pick
    faces.push(src.label)
  }
  return faces
}

function spins(): number {
  return (
    DICE3D_ANIMATION.MIN_SPINS +
    Math.floor(Math.random() * (DICE3D_ANIMATION.RANDOM_SPINS + 1))
  )
}

function Cube({ die, rolling }: { die: DieState; rolling: boolean }) {
  const style = {
    transform: `rotateX(${die.rotX}deg) rotateY(${die.rotY}deg)`,
    transition: rolling
      ? `transform ${DICE3D_ANIMATION.DURATION_MS}ms ${DICE3D_ANIMATION.EASING}`
      : 'none',
    '--die-color': die.color,
  } as React.CSSProperties

  return (
    <div className='dice3d-cube-scene'>
      <div className='dice3d-cube' style={style}>
        {die.faces.map((label, i) => (
          <div key={FACE_KEYS[i]} className={`dice3d-face dice3d-face-${i}`}>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dice3DContent({
  dice,
  faceStyle,
}: {
  dice: Dice
  faceStyle: FaceStyle
}) {
  const { addRoll } = useDice()
  const rollCount = Math.max(1, getDice3dSettings(dice).rollCount)

  const restingDice = useMemo<DieState[]>(
    () =>
      Array.from({ length: rollCount }, (_, i) => ({
        faces: buildFaces(dice.items, dice.items[i % dice.items.length]),
        color: itemDisplayColor(undefined, i),
        rotX: 0,
        rotY: 0,
      })),
    [rollCount, dice.items]
  )

  const [dieStates, setDieStates] = useState<DieState[]>(restingDice)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<{
    picks: DiceItem[]
    sum: number | null
  } | null>(null)
  const timerRef = useRef<number | null>(null)

  const handleRoll = useCallback(() => {
    if (rolling || dice.items.length === 0) return
    if (timerRef.current) window.clearTimeout(timerRef.current)

    const rolled = drawSum(dice.items, rollCount)
    setRolling(true)
    setResult(null)

    setDieStates((prev) =>
      rolled.picks.map((pick, i) => {
        const base = prev[i] ?? restingDice[i]
        return {
          faces: buildFaces(dice.items, pick),
          color: itemDisplayColor(pick.color, i),
          rotX: base.rotX + spins() * 360,
          rotY: base.rotY + spins() * 360,
        }
      })
    )

    timerRef.current = window.setTimeout(() => {
      setRolling(false)
      setResult({ picks: rolled.picks, sum: rolled.sum })
      addRoll(dice.id, rolled.picks, 'dice3d')
    }, DICE3D_ANIMATION.DURATION_MS)
  }, [rolling, dice, restingDice, addRoll])

  const displayDice = rolling || result ? dieStates : restingDice

  return (
    <div className={`dice3d-mode style-${faceStyle}`}>
      <div className='dice3d-stage'>
        {displayDice.map((die, i) => (
          <Cube key={i} die={die} rolling={rolling} />
        ))}
      </div>

      <div className='dice3d-result'>
        {result ? (
          result.sum !== null && result.picks.length > 1 ? (
            <>
              <span className='dice3d-result-sum'>{result.sum}</span>
              <span className='dice3d-result-detail'>
                {result.picks.map((p) => p.label).join(' + ')}
              </span>
            </>
          ) : (
            <span className='dice3d-result-sum'>
              {result.picks.map((p) => p.label).join(' , ')}
            </span>
          )
        ) : (
          <span className='dice3d-result-placeholder'>
            {rollCount}D（{dice.items.length}面）
          </span>
        )}
      </div>

      <button
        type='button'
        className='dice3d-roll-button'
        onClick={handleRoll}
        disabled={rolling}
      >
        {rolling ? '振っています…' : '振る'}
      </button>
    </div>
  )
}

function Dice3DSettings({
  dice,
  faceStyle,
  onFaceStyleChange,
}: {
  dice: Dice
  faceStyle: FaceStyle
  onFaceStyleChange: (style: FaceStyle) => void
}) {
  const { setViewSetting } = useDice()
  const rollCount = Math.max(1, getDice3dSettings(dice).rollCount)

  const setRollCount = (value: number) => {
    const next = Math.max(1, Math.min(MAX_ROLL_COUNT, value))
    if (next !== rollCount)
      setViewSetting(dice.id, 'dice3d', { rollCount: next })
  }

  return (
    <div className='dice3d-settings'>
      <div className='dice3d-setting-row'>
        <span>面スタイル</span>
        <div className='dice3d-style-picker'>
          {FACE_STYLES.map((s) => (
            <button
              key={s.id}
              type='button'
              className={`dice3d-style-btn ${s.id === faceStyle ? 'active' : ''}`}
              onClick={() => onFaceStyleChange(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className='dice3d-setting-row'>
        <label htmlFor='dice3d-roll-count'>振る個数</label>
        <div className='dice3d-setting-value'>
          <button
            type='button'
            onClick={() => setRollCount(rollCount - 1)}
            disabled={rollCount <= 1}
          >
            −
          </button>
          <input
            id='dice3d-roll-count'
            type='number'
            min='1'
            max={MAX_ROLL_COUNT}
            value={rollCount}
            onChange={(e) => setRollCount(Number(e.target.value))}
            className='dice3d-setting-input'
          />
          <button
            type='button'
            onClick={() => setRollCount(rollCount + 1)}
            disabled={rollCount >= MAX_ROLL_COUNT}
          >
            ＋
          </button>
          <span className='dice3d-setting-hint'>
            {rollCount}D（{dice.items.length}面）
          </span>
        </div>
      </div>
    </div>
  )
}

export function Dice3DMode() {
  const [faceStyle, setFaceStyle] = useState<FaceStyle>(loadFaceStyle)

  useEffect(() => {
    try {
      localStorage.setItem(FACE_STYLE_KEY, faceStyle)
    } catch {
      // ignore
    }
  }, [faceStyle])

  return (
    <ModeLayout
      modeId='dice3d'
      settings={(dice) => (
        <Dice3DSettings
          dice={dice}
          faceStyle={faceStyle}
          onFaceStyleChange={setFaceStyle}
        />
      )}
    >
      {(dice) => <Dice3DContent dice={dice} faceStyle={faceStyle} />}
    </ModeLayout>
  )
}
