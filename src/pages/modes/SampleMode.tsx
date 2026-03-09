import { useState } from 'react'
import { ModeLayout } from './ModeLayout'
import { SAMPLE_DELAY_MS, SAMPLE_DUPLICATE_MULTIPLIER } from '../../lib/constants'
import './SampleMode.css'

export function SampleMode() {
  const [count, setCount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  return (
    <ModeLayout
      modeId="sample"
      settings={(dice) => {
        const maxCount = allowDuplicates ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER : dice.items.length
        return (
          <div className="sample-settings">
            <div className="sample-row">
              <label>抽出数</label>
              <input
                type="number"
                min="1"
                max={maxCount}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className="sample-count-input"
              />
              <span className="sample-total">/ {dice.items.length}</span>
            </div>
            <div className="sample-row">
              <label>重複</label>
              <div className="sample-toggle">
                <button
                  className={!allowDuplicates ? 'active' : ''}
                  onClick={() => setAllowDuplicates(false)}
                >
                  なし
                </button>
                <button
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
        const maxCount = allowDuplicates ? dice.items.length * SAMPLE_DUPLICATE_MULTIPLIER : dice.items.length
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
          <div className="sample-container">
            <button
              className="sample-button"
              onClick={draw}
              disabled={!isValid || isSpinning}
            >
              {isSpinning ? '抽出中...' : 'おみくじ'}
            </button>

            {results.length > 0 && (
              <div className="sample-results">
                {results.map((item, i) => (
                  <div key={i} className="sample-result-item">
                    <span className="sample-result-number">{i + 1}</span>
                    <span className="sample-result-label">{item}</span>
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
