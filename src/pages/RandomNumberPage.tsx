import { useState, useCallback } from 'react'
import './RandomNumberPage.css'

export function RandomNumberPage() {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [count, setCount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(true)
  const [results, setResults] = useState<number[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  const generate = useCallback(() => {
    if (min >= max) return

    setIsSpinning(true)

    setTimeout(() => {
      const newResults: number[] = []
      const range = max - min + 1

      if (allowDuplicates) {
        for (let i = 0; i < count; i++) {
          newResults.push(Math.floor(Math.random() * range) + min)
        }
      } else {
        const available = Array.from({ length: range }, (_, i) => i + min)
        const actualCount = Math.min(count, range)
        for (let i = 0; i < actualCount; i++) {
          const index = Math.floor(Math.random() * available.length)
          newResults.push(available[index])
          available.splice(index, 1)
        }
      }

      setResults(newResults)
      setIsSpinning(false)
    }, 500)
  }, [min, max, count, allowDuplicates])

  const maxPossible = allowDuplicates ? Infinity : max - min + 1
  const isValid = min < max && count > 0 && count <= maxPossible

  return (
    <div className="random-number-page">
      <header className="page-header">
        <h1>ランダム数字</h1>
      </header>
      <main>
        <div className="settings-card">
          <div className="setting-row">
            <label>範囲</label>
            <div className="range-inputs">
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              />
              <span>〜</span>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="setting-row">
            <label>抽選回数</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="count-input"
            />
          </div>

          <div className="setting-row">
            <label>重複</label>
            <div className="toggle-buttons">
              <button
                className={allowDuplicates ? 'active' : ''}
                onClick={() => setAllowDuplicates(true)}
              >
                あり
              </button>
              <button
                className={!allowDuplicates ? 'active' : ''}
                onClick={() => setAllowDuplicates(false)}
              >
                なし
              </button>
            </div>
          </div>

          <button
            className="generate-button"
            onClick={generate}
            disabled={!isValid || isSpinning}
          >
            {isSpinning ? '抽選中...' : '抽選する'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-card">
            <h2>結果</h2>
            <div className="results-grid">
              {results.map((num, i) => (
                <div key={i} className="result-item">
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
