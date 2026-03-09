import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useDice } from '../hooks/useDice'
import { createDiceItem, generateDiceName } from '../lib/dice'
import { formatRelativeTime } from '../lib/time'
import { itemHslColor, HISTORY_PAGE_SIZE, RELATIVE_TIME_REFRESH_MS, MAX_WEIGHT } from '../lib/constants'
import type { DiceItem } from '../types'
import './DicePage.css'

export function DicePage() {
  const { id } = useParams<{ id: string }>()
  const { getDice, editDice, clearHistory, isLoaded } = useDice()
  const [isEditing, setIsEditing] = useState(false)
  const [textEditMode, setTextEditMode] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), RELATIVE_TIME_REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const currentDice = id ? getDice(id) : undefined

  const textContent = useMemo(() => {
    if (!currentDice) return ''
    return currentDice.items.map((item) => item.label).join('\n')
  }, [currentDice])

  const totalWeight = useMemo(() => {
    if (!currentDice) return 0
    return currentDice.items.reduce((sum, item) => sum + item.weight, 0)
  }, [currentDice])

  const getPercentage = useCallback(
    (weight: number) => {
      if (totalWeight === 0) return 0
      return (weight / totalWeight) * 100
    },
    [totalWeight]
  )

  const handleTextChange = useCallback(
    (text: string) => {
      if (!currentDice) return
      const lines = text.split('\n')
      const newItems = lines.map((label, index) => {
        const existingItem = currentDice.items[index]
        if (existingItem) {
          return { ...existingItem, label }
        }
        return createDiceItem(label)
      })
      editDice(currentDice.id, {
        items: newItems,
        name: generateDiceName(newItems),
      })
    },
    [currentDice, editDice]
  )

  const updateItems = useCallback(
    (newItems: DiceItem[]) => {
      if (!currentDice) return
      const validItems = newItems.filter((item) => item.label.trim())
      if (validItems.length >= 2) {
        editDice(currentDice.id, {
          items: newItems,
          name: generateDiceName(newItems),
        })
      }
    },
    [currentDice, editDice]
  )

  const updateItem = useCallback(
    (itemId: string, updates: Partial<DiceItem>) => {
      if (!currentDice) return
      const newItems = currentDice.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
      updateItems(newItems)
    },
    [currentDice, updateItems]
  )

  const addItem = useCallback(() => {
    if (!currentDice) return
    const newItems = [...currentDice.items, createDiceItem('')]
    editDice(currentDice.id, { items: newItems })
  }, [currentDice, editDice])

  const removeItem = useCallback(
    (itemId: string) => {
      if (!currentDice || currentDice.items.length <= 2) return
      const newItems = currentDice.items.filter((item) => item.id !== itemId)
      updateItems(newItems)
    },
    [currentDice, updateItems]
  )

  const shuffleItems = useCallback(() => {
    if (!currentDice) return
    const shuffled = [...currentDice.items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    editDice(currentDice.id, { items: shuffled })
  }, [currentDice, editDice])

  const resetWeights = useCallback(() => {
    if (!currentDice) return
    const newItems = currentDice.items.map((item) => ({ ...item, weight: 1 }))
    editDice(currentDice.id, { items: newItems })
  }, [currentDice, editDice])

  const removeEmptyItems = useCallback(() => {
    if (!currentDice) return
    const nonEmpty = currentDice.items.filter((item) => item.label.trim())
    if (nonEmpty.length >= 2) {
      editDice(currentDice.id, {
        items: nonEmpty,
        name: generateDiceName(nonEmpty),
      })
    }
  }, [currentDice, editDice])

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  if (!currentDice) {
    return <Navigate to="/" replace />
  }

  const history = currentDice.history || []

  return (
    <div className="dice-page">
      <header className="page-header">
        <Link to={`/dice/${currentDice.id}/${currentDice.lastMode}`} className="back-link">←</Link>
        {editingName ? (
          <input
            className="name-edit-input"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => {
              const trimmed = nameValue.trim()
              if (trimmed && trimmed !== currentDice.name) {
                editDice(currentDice.id, { name: trimmed })
              }
              setEditingName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingName(false)
            }}
            autoFocus
          />
        ) : (
          <h1
            onClick={() => {
              setNameValue(currentDice.name)
              setEditingName(true)
            }}
            className="editable-name"
            title="クリックで名前を編集"
          >
            {currentDice.name}
          </h1>
        )}
        <button
          className={`edit-toggle ${isEditing ? 'active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '完了' : '編集'}
        </button>
      </header>

      <main>
        {/* Item grid overview */}
        <section className="items-grid-section">
          <h2>項目 ({currentDice.items.length})</h2>
          <div className="items-grid">
            {currentDice.items.map((item, index) => (
              <span
                key={item.id}
                className="grid-cell"
                style={{ background: itemHslColor(index) }}
                title={`${item.label || `項目${index + 1}`} (${getPercentage(item.weight).toFixed(1)}%)`}
              >
                {(item.label || `${index + 1}`).slice(0, 3)}
              </span>
            ))}
          </div>
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="history-section">
            <div className="history-header">
              <h2>履歴 ({history.length})</h2>
              <button
                className="clear-history"
                onClick={() => clearHistory(currentDice.id)}
              >
                クリア
              </button>
            </div>
            <ul className="history-list">
              {[...history].reverse().slice(0, HISTORY_PAGE_SIZE).map((log, i) => (
                <li key={log.id}>
                  <span className="history-number">{history.length - i}</span>
                  <span className="history-label">{log.label}</span>
                  <span className="history-time">
                    {formatRelativeTime(log.timestamp, now)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Inline editor */}
      {isEditing && (
        <div className="inline-editor">
          <div className="editor-header">
            <div className="bulk-actions">
              <button className="bulk-button" onClick={shuffleItems}>
                シャッフル
              </button>
              <button className="bulk-button" onClick={resetWeights}>
                重みリセット
              </button>
              <button
                className="bulk-button"
                onClick={removeEmptyItems}
                disabled={currentDice.items.filter((i) => !i.label.trim()).length === 0}
              >
                空を削除
              </button>
            </div>
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
              {currentDice.items.map((item, index) => (
                <div key={item.id} className="item-row">
                  <span className="item-number">{index + 1}</span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    placeholder={`項目${index + 1}`}
                  />
                  <div className="weight-group">
                    <input
                      type="number"
                      min="1"
                      max={MAX_WEIGHT}
                      value={item.weight}
                      onChange={(e) =>
                        updateItem(item.id, { weight: Number(e.target.value) || 1 })
                      }
                      className="weight-input"
                    />
                    <span className="probability">{getPercentage(item.weight).toFixed(1)}%</span>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeItem(item.id)}
                    disabled={currentDice.items.length <= 2}
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
