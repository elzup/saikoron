import { useState } from 'react'
import { useDice } from '../../hooks/useDice'
import {
  SAMPLE_DELAY_MS,
  SAMPLE_DUPLICATE_MULTIPLIER,
} from '../../lib/constants'
import { drawSample } from '../../lib/draw'
import { getSampleSettings } from '../../lib/viewSettings'
import { ModeLayout } from './ModeLayout'
import './SampleMode.css'

export function SampleMode() {
  const { setViewSetting, addRoll } = useDice()
  const [results, setResults] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  return (
    <ModeLayout
      modeId='sample'
      settings={(dice) => {
        const { count, allowDuplicates } = getSampleSettings(dice)
        const maxCount = allowDuplicates
          ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER
          : dice.items.length

        const setCount = (value: number) =>
          setViewSetting(dice.id, 'sample', {
            count: Math.max(1, value),
            allowDuplicates,
          })
        const setAllowDuplicates = (value: boolean) =>
          setViewSetting(dice.id, 'sample', { count, allowDuplicates: value })

        return (
          <div className='sample-settings'>
            <div className='sample-row'>
              <label htmlFor='sample-count'>抽出数</label>
              <input
                id='sample-count'
                type='number'
                min='1'
                max={maxCount}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className='sample-count-input'
              />
              <span className='sample-total'>/ {dice.items.length}</span>
            </div>
            <div className='sample-row'>
              <span>重複</span>
              <div className='sample-toggle'>
                <button
                  type='button'
                  className={!allowDuplicates ? 'active' : ''}
                  onClick={() => setAllowDuplicates(false)}
                >
                  なし
                </button>
                <button
                  type='button'
                  className={allowDuplicates ? 'active' : ''}
                  onClick={() => setAllowDuplicates(true)}
                >
                  あり
                </button>
              </div>
            </div>
          </div>
        )
      }}
    >
      {(dice) => {
        const { count, allowDuplicates } = getSampleSettings(dice)
        const maxCount = allowDuplicates
          ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER
          : dice.items.length
        const isValid = count > 0 && count <= maxCount && dice.items.length > 0

        const draw = () => {
          if (!isValid || isSpinning) return
          setIsSpinning(true)

          setTimeout(() => {
            const rolled = drawSample(dice.items, count, { allowDuplicates })
            setResults(rolled.picks.map((item) => item.label))
            if (rolled.picks.length > 0) {
              addRoll(dice.id, rolled.picks, 'sample')
            }
            setIsSpinning(false)
          }, SAMPLE_DELAY_MS)
        }

        return (
          <div className='sample-container'>
            <button
              type='button'
              className='sample-button'
              onClick={draw}
              disabled={!isValid || isSpinning}
            >
              {isSpinning ? '抽出中...' : 'おみくじ'}
            </button>

            {results.length > 0 && (
              <div className='sample-results'>
                {results.map((item, i) => (
                  <div key={i} className='sample-result-item'>
                    <span className='sample-result-number'>{i + 1}</span>
                    <span className='sample-result-label'>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }}
    </ModeLayout>
  )
}
