import { useState, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { RouletteWheel } from '../components/RouletteWheel'
import { SlotRoulette } from '../components/SlotRoulette'
import { useRoulettes } from '../hooks/useRoulettes'
import { createRouletteItem, generateRouletteName } from '../lib/roulette'
import type { RouletteItem } from '../types'
import './PlayPage.css'

type ViewMode = 'wheel' | 'slot'

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const { getRoulette, editRoulette, addHistory, clearHistory, isLoaded } = useRoulettes()
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('wheel')
  const [showHistory, setShowHistory] = useState(false)

  const roulette = id ? getRoulette(id) : undefined

  const handleResult = useCallback(
    (item: RouletteItem) => {
      if (roulette) {
        addHistory(roulette.id, item)
      }
    },
    [roulette, addHistory]
  )

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

  const history = roulette.history || []

  return (
    <div className="play-page">
      <header className="page-header">
        <h1>{roulette.name}</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'wheel' ? 'active' : ''}
              onClick={() => setViewMode('wheel')}
              title="ホイール"
            >
              ◎
            </button>
            <button
              className={viewMode === 'slot' ? 'active' : ''}
              onClick={() => setViewMode('slot')}
              title="スロット"
            >
              ≡
            </button>
          </div>
          <button
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="履歴"
          >
            📋 {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>
          <button
            className={`edit-toggle ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '完了' : '編集'}
          </button>
        </div>
      </header>
      <main>
        {viewMode === 'wheel' ? (
          <RouletteWheel items={roulette.items} onResult={handleResult} />
        ) : (
          <SlotRoulette items={roulette.items} onResult={handleResult} />
        )}
      </main>

      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h2>履歴 ({history.length})</h2>
            {history.length > 0 && (
              <button
                className="clear-history"
                onClick={() => clearHistory(roulette.id)}
              >
                クリア
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="empty-history">まだ履歴がありません</p>
          ) : (
            <ul className="history-list">
              {[...history].reverse().map((log, i) => (
                <li key={log.id}>
                  <span className="history-number">{history.length - i}</span>
                  <span className="history-label">{log.label}</span>
                  <span className="history-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
