import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoulettes } from '../hooks/useRoulettes'
import { createRouletteItem, generateRouletteName } from '../lib/roulette'
import type { RouletteItem } from '../types'
import './NewPage.css'

export function NewPage() {
  const navigate = useNavigate()
  const { addRoulette } = useRoulettes()
  const [items, setItems] = useState<RouletteItem[]>([
    createRouletteItem(''),
    createRouletteItem(''),
  ])

  const updateItem = useCallback((id: string, updates: Partial<RouletteItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createRouletteItem('')])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleCreate = () => {
    const validItems = items.filter((item) => item.label.trim())
    if (validItems.length >= 2) {
      const name = generateRouletteName(validItems)
      const newRoulette = addRoulette(name, validItems)
      navigate(`/play/${newRoulette.id}`)
    }
  }

  const validCount = items.filter((item) => item.label.trim()).length
  const canCreate = validCount >= 2

  return (
    <div className="new-page">
      <header className="page-header">
        <h1>新規作成</h1>
        <button
          className="create-button"
          onClick={handleCreate}
          disabled={!canCreate}
        >
          作成
        </button>
      </header>
      <main>
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
      </main>
    </div>
  )
}
