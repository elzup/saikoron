import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDice } from '../hooks/useDice'
import { createDiceItem, generateDiceName } from '../lib/dice'
import type { DiceItem } from '../types'
import './NewPage.css'

type CreateMode = 'list' | 'range' | 'text'

const VALID_MODES: CreateMode[] = ['list', 'range', 'text']

export function NewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addDice } = useDice()
  const initialMode = VALID_MODES.includes(searchParams.get('mode') as CreateMode)
    ? (searchParams.get('mode') as CreateMode)
    : 'list'
  const [mode, setMode] = useState<CreateMode>(initialMode)
  const [name, setName] = useState('')
  const [items, setItems] = useState<DiceItem[]>([
    createDiceItem(''),
    createDiceItem(''),
  ])

  // Range mode state
  const [rangeMin, setRangeMin] = useState(1)
  const [rangeMax, setRangeMax] = useState(100)

  // Text mode state
  const [text, setText] = useState('')

  const updateItem = useCallback((id: string, updates: Partial<DiceItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createDiceItem('')])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const getItemsForCreate = (): DiceItem[] => {
    if (mode === 'list') {
      return items.filter((item) => item.label.trim())
    }
    if (mode === 'range') {
      const min = Math.min(rangeMin, rangeMax)
      const max = Math.max(rangeMin, rangeMax)
      const count = max - min + 1
      if (count < 2 || count > 1000) return []
      return Array.from({ length: count }, (_, i) =>
        createDiceItem(String(min + i))
      )
    }
    // text mode
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
    return lines.map((label) => createDiceItem(label))
  }

  const canCreate = (): boolean => {
    const items = getItemsForCreate()
    return items.length >= 2
  }

  const rangeCount = Math.abs(rangeMax - rangeMin) + 1

  const handleCreate = () => {
    const createItems = getItemsForCreate()
    if (createItems.length < 2) return
    const diceName = name.trim() || generateDiceName(createItems)
    const newDice = addDice(diceName, createItems)
    navigate(`/dice/${newDice.id}/slot`)
  }

  return (
    <div className="new-page">
      <header className="page-header">
        <h1>新規作成</h1>
        <button
          className="create-button"
          onClick={handleCreate}
          disabled={!canCreate()}
        >
          作成
        </button>
      </header>
      <main>
        <div className="name-field">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ダイス名（空欄で自動生成）"
            className="name-input"
          />
        </div>

        <div className="create-mode-tabs">
          <button
            className={mode === 'list' ? 'active' : ''}
            onClick={() => setMode('list')}
          >
            リスト
          </button>
          <button
            className={mode === 'range' ? 'active' : ''}
            onClick={() => setMode('range')}
          >
            範囲
          </button>
          <button
            className={mode === 'text' ? 'active' : ''}
            onClick={() => setMode('text')}
          >
            テキスト
          </button>
        </div>

        {mode === 'list' && (
          <div className="items-editor">
            <p className="hint">項目を2つ以上入力してください</p>
            <div className="items-list">
              {items.map((item, index) => (
                <div key={item.id} className="item-row">
                  <span className="item-number">{index + 1}</span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    placeholder={`項目${index + 1}`}
                    autoFocus={index === 0}
                  />
                  <button
                    className="remove-button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 2}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button className="add-button" onClick={addItem}>
              + 追加
            </button>
          </div>
        )}

        {mode === 'range' && (
          <div className="items-editor">
            <p className="hint">数値の範囲を指定してダイスを作成（最大1000項目）</p>
            <div className="range-form">
              <div className="range-row">
                <label>最小値</label>
                <input
                  type="number"
                  value={rangeMin}
                  onChange={(e) => setRangeMin(Number(e.target.value))}
                  className="range-input"
                />
              </div>
              <div className="range-row">
                <label>最大値</label>
                <input
                  type="number"
                  value={rangeMax}
                  onChange={(e) => setRangeMax(Number(e.target.value))}
                  className="range-input"
                />
              </div>
              <p className="range-info">
                {rangeCount} 項目
                {rangeCount > 1000 && (
                  <span className="range-warning"> (上限: 1000)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="items-editor">
            <p className="hint">改行区切りで項目を入力（最低2項目必要）</p>
            <textarea
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'りんご\nみかん\nぶどう\nバナナ'}
              rows={10}
            />
            <p className="text-count">
              {text.split('\n').filter((l) => l.trim()).length} 項目
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
