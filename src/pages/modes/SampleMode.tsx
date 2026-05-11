import { useState } from 'react'
import {
  SAMPLE_DELAY_MS,
  SAMPLE_DUPLICATE_MULTIPLIER,
} from '../../lib/constants'
import { ModeLayout } from './ModeLayout'
import './SampleMode.css'

export function SampleMode() {
  const [count, setCount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  return (
    <ModeLayout
      modeId='sample'
      settings={(dice) => {
        const maxCount = allowDuplicates
          ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER
          : dice.items.length
        return (
          <div className='sample-settings'>
            <div className='sample-row'>
              <label htmlFor='sample-count'>謚ｽ蜃ｺ謨ｰ</label>
              <input
                id='sample-count'
                type='number'
                min='1'
                max={maxCount}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className='sample-count-input'
              />
              <span className='sample-total'>/ {dice.items.length}</span>
            </div>
            <div className='sample-row'>
              <span>驥崎､・</span>
              <div className='sample-toggle'>
                <button
                  type='button'
                  className={!allowDuplicates ? 'active' : ''}
                  onClick={() => setAllowDuplicates(false)}
                >
                  縺ｪ縺・
                </button>
                <button
                  type='button'
                  className={allowDuplicates ? 'active' : ''}
                  onClick={() => setAllowDuplicates(true)}
                >
                  縺ゅｊ
                </button>
              </div>
            </div>
          </div>
        )
      }}
    >
      {(dice) => {
        const maxCount = allowDuplicates
          ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER
          : dice.items.length
        const isValid = count > 0 && count <= maxCount && dice.items.length > 0

        const draw = () => {
          if (!isValid || isSpinning) return
          setIsSpinning(true)

          setTimeout(() => {
            const picked: string[] = []
            if (allowDuplicates) {
              for (let i = 0; i < count; i++) {
                const idx = Math.floor(Math.random() * dice.items.length)
                picked.push(dice.items[idx].label)
              }
            } else {
              const pool = [...dice.items]
              const n = Math.min(count, pool.length)
              for (let i = 0; i < n; i++) {
                const idx = Math.floor(Math.random() * pool.length)
                picked.push(pool[idx].label)
                pool.splice(idx, 1)
              }
            }
            setResults(picked)
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
              {isSpinning ? '謚ｽ蜃ｺ荳ｭ...' : '縺翫∩縺上§'}
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
