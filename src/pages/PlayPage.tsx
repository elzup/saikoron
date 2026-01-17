import { useState, useCallback, useMemo } from 'react'
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
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [autoExclude, setAutoExclude] = useState(false)
  const [textEditMode, setTextEditMode] = useState(false)
  const [showItemList, setShowItemList] = useState(false)

  const roulette = id ? getRoulette(id) : undefined

  const activeItems = useMemo(() => {
    if (!roulette) return []
    return roulette.items.filter((item) => !excludedIds.has(item.id))
  }, [roulette, excludedIds])

  const textContent = useMemo(() => {
    if (!roulette) return ''
    return roulette.items.map((item) => item.label).join('\n')
  }, [roulette])

  const handleTextChange = useCallback(
    (text: string) => {
      if (!roulette) return
      const lines = text.split('\n')
      const newItems = lines.map((label, index) => {
        const existingItem = roulette.items[index]
        if (existingItem) {
          return { ...existingItem, label }
        }
        return createRouletteItem(label)
      })
      // Preserve weights for existing items, but allow any number of items (validation happens on updateItems)
      editRoulette(roulette.id, {
        items: newItems,
        name: generateRouletteName(newItems),
      })
    },
    [roulette, editRoulette]
  )

  const handleResult = useCallback(
    (item: RouletteItem) => {
      if (roulette) {
        addHistory(roulette.id, item)
        if (autoExclude) {
          setExcludedIds((prev) => new Set([...prev, item.id]))
        }
      }
    },
    [roulette, addHistory, autoExclude]
  )

  const toggleExclude = useCallback((itemId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const resetExclusions = useCallback(() => {
    setExcludedIds(new Set())
  }, [])

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
            className={`exclude-toggle ${autoExclude ? 'active' : ''}`}
            onClick={() => setAutoExclude(!autoExclude)}
            title="自動除外"
          >
            🚫
          </button>
          {excludedIds.size > 0 && (
            <button
              className="reset-exclude"
              onClick={resetExclusions}
              title="除外をリセット"
            >
              ↺ {excludedIds.size}
            </button>
          )}
          <button
            className={`list-toggle ${showItemList ? 'active' : ''}`}
            onClick={() => setShowItemList(!showItemList)}
            title="項目一覧"
          >
            📝
          </button>
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
      <main className={showItemList ? 'with-sidebar' : ''}>
        <div className="roulette-area">
          {viewMode === 'wheel' ? (
            <RouletteWheel items={activeItems} onResult={handleResult} />
          ) : (
            <SlotRoulette items={activeItems} onResult={handleResult} />
          )}
        </div>
        {showItemList && (
          <aside className="item-list-panel">
            <h3>項目一覧 ({roulette.items.length})</h3>
            <ul className="item-list">
              {roulette.items.map((item, index) => (
                <li
                  key={item.id}
                  className={excludedIds.has(item.id) ? 'excluded' : ''}
                  onClick={() => toggleExclude(item.id)}
                >
                  <span className="item-color" style={{ background: `hsl(${(index * 45) % 360}, 70%, 50%)` }} />
                  <span className="item-name">{item.label || `項目${index + 1}`}</span>
                  {item.weight !== 1 && <span className="item-weight">×{item.weight}</span>}
                </li>
              ))}
            </ul>
          </aside>
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
          <div className="editor-header">
            <div className="edit-mode-toggle">
              <button
                className={!textEditMode ? 'active' : ''}
                onClick={() => setTextEditMode(false)}
              >
                リスト
              </button>
              <button
                className={textEditMode ? 'active' : ''}
                onClick={() => setTextEditMode(true)}
              >
                テキスト
              </button>
            </div>
          </div>
          <div className="editor-content">
            <div className={`items-list ${textEditMode ? 'hidden' : ''}`}>
              {roulette.items.map((item, index) => (
                <div key={item.id} className={`item-row ${excludedIds.has(item.id) ? 'excluded' : ''}`}>
                  <button
                    className={`exclude-item-button ${excludedIds.has(item.id) ? 'excluded' : ''}`}
                    onClick={() => toggleExclude(item.id)}
                    title={excludedIds.has(item.id) ? '含める' : '除外'}
                  >
                    {excludedIds.has(item.id) ? '○' : '●'}
                  </button>
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
              <button className="add-button" onClick={addItem}>
                + 追加
              </button>
            </div>
            <div className={`text-editor ${!textEditMode ? 'hidden' : ''}`}>
              <textarea
                value={textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="項目を改行区切りで入力&#10;例:&#10;項目1&#10;項目2&#10;項目3"
                rows={10}
              />
              <p className="text-hint">改行区切りで項目を入力（最低2項目必要）</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
