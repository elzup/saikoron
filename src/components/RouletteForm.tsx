import { useState, useCallback } from 'react'
import type { Roulette, RouletteItem } from '../types'
import { createRouletteItem } from '../lib/roulette'
import './RouletteForm.css'

interface Props {
  roulette?: Roulette
  onSave: (name: string, items: RouletteItem[]) => void
  onCancel: () => void
}

export function RouletteForm({ roulette, onSave, onCancel }: Props) {
  const [name, setName] = useState(roulette?.name ?? '')
  const [items, setItems] = useState<RouletteItem[]>(
    roulette?.items ?? [createRouletteItem('')]
  )

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createRouletteItem('')])
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<RouletteItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((item) => item.label.trim() !== '')
    if (name.trim() && validItems.length >= 2) {
      onSave(name.trim(), validItems)
    }
  }

  const isValid = name.trim() !== '' && items.filter((item) => item.label.trim()).length >= 2

  return (
    <form className="roulette-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="roulette-name">ルーレット名</label>
        <input
          id="roulette-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: ランチ決め"
        />
      </div>

      <div className="form-group">
        <label>項目（2つ以上必要）</label>
        <div className="items-list">
          {items.map((item, index) => (
            <div key={item.id} className="item-row">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                placeholder={`項目${index + 1}`}
              />
              <input
                type="number"
                min="1"
                max="100"
                value={item.weight}
                onChange={(e) => updateItem(item.id, { weight: Number(e.target.value) || 1 })}
                className="weight-input"
                title="重み"
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-button" onClick={addItem}>
          + 項目を追加
        </button>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          キャンセル
        </button>
        <button type="submit" className="save-button" disabled={!isValid}>
          保存
        </button>
      </div>
    </form>
  )
}
