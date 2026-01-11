import { useState, useCallback } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { RouletteWheel } from '../components/RouletteWheel'
import { useRoulettes } from '../hooks/useRoulettes'
import { createRouletteItem, generateRouletteName } from '../lib/roulette'
import type { RouletteItem } from '../types'
import './PlayPage.css'

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const { getRoulette, editRoulette, isLoaded } = useRoulettes()
  const [isEditing, setIsEditing] = useState(false)

  const roulette = id ? getRoulette(id) : undefined

  const updateItems = useCallback(
    (newItems: RouletteItem[]) => {
      if (!roulette) return
      const validItems = newItems.filter((item) => item.label.trim())
      if (validItems.length >= 2) {
        editRoulette(roulette.id, {
          items: newItems,
          name: generateRouletteName(newItems),
        })
      }
    },
    [roulette, editRoulette]
  )

  const updateItem = useCallback(
    (itemId: string, updates: Partial<RouletteItem>) => {
      if (!roulette) return
      const newItems = roulette.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
      updateItems(newItems)
    },
    [roulette, updateItems]
  )

  const addItem = useCallback(() => {
    if (!roulette) return
    const newItems = [...roulette.items, createRouletteItem('')]
    editRoulette(roulette.id, { items: newItems })
  }, [roulette, editRoulette])

  const removeItem = useCallback(
    (itemId: string) => {
      if (!roulette || roulette.items.length <= 2) return
      const newItems = roulette.items.filter((item) => item.id !== itemId)
      updateItems(newItems)
    },
    [roulette, updateItems]
  )

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  if (!roulette) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="play-page">
      <header className="play-header">
        <Link to="/" className="back-link">← 戻る</Link>
        <h1>{roulette.name}</h1>
        <button
          className={`edit-toggle ${isEditing ? 'active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '完了' : '編集'}
        </button>
      </header>
      <main>
        <RouletteWheel items={roulette.items} />
      </main>
      {isEditing && (
        <div className="inline-editor">
          <div className="items-list">
            {roulette.items.map((item, index) => (
              <div key={item.id} className="item-row">
                <span className="item-number">{index + 1}</span>
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
                  onChange={(e) =>
                    updateItem(item.id, { weight: Number(e.target.value) || 1 })
                  }
                  className="weight-input"
                />
                <button
                  className="remove-button"
                  onClick={() => removeItem(item.id)}
                  disabled={roulette.items.length <= 2}
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
    </div>
  )
}
