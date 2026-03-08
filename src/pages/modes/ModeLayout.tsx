import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useDice } from '../../hooks/useDice'
import { formatRelativeTime } from '../../lib/time'
import type { Dice, ModeId } from '../../types'
import './ModeLayout.css'

const MODES: { id: ModeId; name: string; maxItems?: number }[] = [
  { id: 'wheel', name: 'ルーレット', maxItems: 100 },
  { id: 'slot', name: 'スロット' },
  { id: 'sample', name: 'おみくじ' },
  { id: 'signage', name: 'サイネージ' },
]

const HISTORY_PAGE_SIZE = 20

export function isModeEnabled(modeId: ModeId, dice: Dice): boolean {
  const mode = MODES.find((m) => m.id === modeId)
  if (!mode) return false
  if (mode.maxItems && dice.items.length > mode.maxItems) return false
  return true
}

interface Props {
  children: (dice: Dice) => React.ReactNode
  modeId: ModeId
  settings?: (dice: Dice) => React.ReactNode
}

export function ModeLayout({ children, modeId, settings }: Props) {
  const { id } = useParams<{ id: string }>()
  const { getDice, setLastMode, clearHistory, isLoaded } = useDice()
  const dice = id ? getDice(id) : undefined

  const [showItems, setShowItems] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [now, setNow] = useState(Date.now())

  // Refresh relative times every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (dice) {
      setLastMode(dice.id, modeId)
    }
  }, [dice?.id, modeId])

  // Reset to first page when history changes
  const historyLen = dice?.history?.length ?? 0
  useEffect(() => {
    setHistoryPage(0)
  }, [historyLen])

  if (!isLoaded) {
    return <div className="mode-loading">読み込み中...</div>
  }

  if (!dice) {
    return <Navigate to="/" replace />
  }

  if (!isModeEnabled(modeId, dice)) {
    const fallback = MODES.find((m) => isModeEnabled(m.id, dice))
    return <Navigate to={`/dice/${dice.id}/${fallback?.id ?? 'slot'}`} replace />
  }

  const history = dice.history || []
  const reversed = [...history].reverse()
  const totalPages = Math.max(1, Math.ceil(reversed.length / HISTORY_PAGE_SIZE))
  const pagedHistory = reversed.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  )

  const totalWeight = dice.items.reduce((sum, item) => sum + item.weight, 0)
  const getPercentage = (weight: number) =>
    totalWeight === 0 ? 0 : (weight / totalWeight) * 100

  return (
    <div className="mode-page">
      <header className="mode-header">
        <h1 className="mode-dice-name">{dice.name}</h1>
        <nav className="mode-switcher">
          {MODES.map((mode) => {
            const enabled = isModeEnabled(mode.id, dice)
            return enabled ? (
              <Link
                key={mode.id}
                to={`/dice/${dice.id}/${mode.id}`}
                className={`mode-tab ${mode.id === modeId ? 'active' : ''}`}
              >
                {mode.name}
              </Link>
            ) : (
              <span key={mode.id} className="mode-tab disabled">
                {mode.name}
              </span>
            )
          })}
        </nav>
        <Link to={`/dice/${dice.id}`} className="mode-edit-link">
          編集
        </Link>
      </header>

      <main className="mode-main">
        {children(dice)}
      </main>

      {/* Collapsible panels */}
      <div className="mode-panels">
        {/* Items grid */}
        <div className="mode-panel">
          <button
            className="panel-toggle"
            onClick={() => setShowItems(!showItems)}
          >
            <span>項目 ({dice.items.length})</span>
            <span className="panel-arrow">{showItems ? '▲' : '▼'}</span>
          </button>
          {showItems && (
            <div className="panel-content">
              <div className="panel-items-grid">
                {dice.items.map((item, index) => (
                  <span
                    key={item.id}
                    className="panel-grid-cell"
                    style={{ background: `hsl(${(index * 45) % 360}, 70%, 50%)` }}
                    title={`${item.label || `項目${index + 1}`} (${getPercentage(item.weight).toFixed(1)}%)`}
                  >
                    {(item.label || `${index + 1}`).charAt(0)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        {settings && (
          <div className="mode-panel">
            <button
              className="panel-toggle"
              onClick={() => setShowSettings(!showSettings)}
            >
              <span>設定</span>
              <span className="panel-arrow">{showSettings ? '▲' : '▼'}</span>
            </button>
            {showSettings && (
              <div className="panel-content">
                {settings(dice)}
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="mode-panel">
          <button
            className="panel-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            <span>履歴 ({history.length})</span>
            <span className="panel-arrow">{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="panel-content">
              {history.length === 0 ? (
                <p className="panel-empty">まだ履歴がありません</p>
              ) : (
                <>
                  <div className="panel-history-header">
                    <button
                      className="panel-clear-button"
                      onClick={() => clearHistory(dice.id)}
                    >
                      クリア
                    </button>
                  </div>
                  <ul className="panel-history-list">
                    {pagedHistory.map((log, i) => (
                      <li key={log.id}>
                        <span className="panel-history-number">
                          {history.length - (historyPage * HISTORY_PAGE_SIZE + i)}
                        </span>
                        <span className="panel-history-label">{log.label}</span>
                        <span className="panel-history-time">
                          {formatRelativeTime(log.timestamp, now)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {totalPages > 1 && (
                    <div className="panel-pager">
                      <button
                        disabled={historyPage === 0}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        ← 新しい
                      </button>
                      <span className="panel-pager-info">
                        {historyPage + 1} / {totalPages}
                      </span>
                      <button
                        disabled={historyPage >= totalPages - 1}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        古い →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
