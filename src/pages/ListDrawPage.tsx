import { useState, useCallback } from 'react'
import './ListDrawPage.css'

export function ListDrawPage() {
  const [text, setText] = useState('')
  const [count, setCount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(true)
  const [results, setResults] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

  const draw = useCallback(() => {
    if (items.length === 0) return

    setIsSpinning(true)

    setTimeout(() => {
      const newResults: string[] = []

      if (allowDuplicates) {
        for (let i = 0; i < count; i++) {
          const index = Math.floor(Math.random() * items.length)
          newResults.push(items[index])
        }
      } else {
        const available = [...items]
        const actualCount = Math.min(count, available.length)
        for (let i = 0; i < actualCount; i++) {
          const index = Math.floor(Math.random() * available.length)
          newResults.push(available[index])
          available.splice(index, 1)
        }
      }

      setResults(newResults)
      setIsSpinning(false)
    }, 500)
  }, [items, count, allowDuplicates])

  const maxPossible = allowDuplicates ? Infinity : items.length
  const isValid = items.length >= 1 && count > 0 && count <= maxPossible

  return (
    <div className="list-draw-page">
      <header className="page-header">
        <h1>リスト抽選機</h1>
      </header>
      <main>
        <div className="settings-card">
          <div className="input-section">
            <label>項目（1行に1つ）</label>
            <textarea
              className="items-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'りんご\nみかん\nぶどう\nバナナ'}
              rows={6}
            />
            <span className="item-count">{items.length} 件</span>
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
            onClick={draw}
            disabled={!isValid || isSpinning}
          >
            {isSpinning ? '抽選中...' : '抽選する'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-card">
            <h2>結果</h2>
            <div className="results-grid">
              {results.map((item, i) => (
                <div key={i} className="result-item">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
