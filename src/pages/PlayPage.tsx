import { useState, useCallback, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { RouletteWheel } from '../components/RouletteWheel'
import { SlotRoulette } from '../components/SlotRoulette'
import { useDice } from '../hooks/useDice'
import { useAutoSpin } from '../hooks/useAutoSpin'
import { createDiceItem, generateDiceName } from '../lib/dice'
import type { DiceItem } from '../types'
import './PlayPage.css'

type ViewMode = 'wheel' | 'slot'

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const { getDice, editDice, addHistory, clearHistory, isLoaded } = useDice()
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('wheel')
  const [showHistory, setShowHistory] = useState(false)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [autoExclude, setAutoExclude] = useState(false)
  const [textEditMode, setTextEditMode] = useState(false)
  const [showItemList, setShowItemList] = useState(false)
  const [spinTrigger, setSpinTrigger] = useState(0)

  const triggerSpin = useCallback(() => {
    setSpinTrigger((prev) => prev + 1)
  }, [])

  const { isAutoSpin, toggleAutoSpin, remainingSeconds } = useAutoSpin(triggerSpin)

  const currentDice = id ? getDice(id) : undefined

  const activeItems = useMemo(() => {
    if (!currentDice) return []
    return currentDice.items.filter((item) => !excludedIds.has(item.id))
  }, [currentDice, excludedIds])

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

  const handleResult = useCallback(
    (item: DiceItem) => {
      if (currentDice) {
        addHistory(currentDice.id, item)
        if (autoExclude) {
          setExcludedIds((prev) => new Set([...prev, item.id]))
        }
      }
    },
    [currentDice, addHistory, autoExclude]
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
    <div className="play-page">
      <header className="page-header">
        <h1>{currentDice.name}</h1>
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
            className={`auto-spin-toggle ${isAutoSpin ? 'active' : ''}`}
            onClick={toggleAutoSpin}
            title={isAutoSpin ? `自動スピン ON (${remainingSeconds}s)` : '自動スピン'}
          >
            {isAutoSpin ? `⏱${remainingSeconds}s` : '⏱'}
          </button>
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
        <div className="dice-area">
          {viewMode === 'wheel' ? (
            <RouletteWheel items={activeItems} onResult={handleResult} triggerSpin={spinTrigger} />
          ) : (
            <SlotRoulette items={activeItems} onResult={handleResult} triggerSpin={spinTrigger} />
          )}
        </div>
        {showItemList && (
          <aside className="item-list-panel">
            <h3>項目一覧 ({currentDice.items.length})</h3>
            <ul className="item-list">
              {currentDice.items.map((item, index) => (
                <li
                  key={item.id}
                  className={excludedIds.has(item.id) ? 'excluded' : ''}
                  onClick={() => toggleExclude(item.id)}
                >
                  <span className="item-color" style={{ background: `hsl(${(index * 45) % 360}, 70%, 50%)` }} />
                  <span className="item-name">{item.label || `項目${index + 1}`}</span>
                  <span className="item-probability">{getPercentage(item.weight).toFixed(1)}%</span>
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
                onClick={() => clearHistory(currentDice.id)}
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
            <div className="bulk-actions">
              <button className="bulk-button" onClick={shuffleItems} title="シャッフル">
                🔀 シャッフル
              </button>
              <button className="bulk-button" onClick={resetWeights} title="重みをリセット">
                ⚖️ 重みリセット
              </button>
              <button
                className="bulk-button"
                onClick={removeEmptyItems}
                title="空の項目を削除"
                disabled={currentDice.items.filter((i) => !i.label.trim()).length === 0}
              >
                🧹 空を削除
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
                  <div className="weight-group">
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
