import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useDice } from '../../hooks/useDice'
import {
  GRID_MAX_ITEMS,
  HISTORY_PAGE_SIZE,
  itemDisplayColor,
  MODE_EMOJI,
  MODES,
  RELATIVE_TIME_REFRESH_MS,
} from '../../lib/constants'
import { formatRollLog, rollLogItemIds } from '../../lib/dice'
import { formatRelativeTime } from '../../lib/time'
import type { Dice, ModeId } from '../../types'
import './ModeLayout.css'

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
  // 履歴を現在の View で振ったものだけに絞る（デフォルト ON）
  const [filterCurrentView, setFilterCurrentView] = useState(true)
  const [now, setNow] = useState(Date.now())

  // Refresh relative times every 10 seconds
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Date.now()),
      RELATIVE_TIME_REFRESH_MS
    )
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (dice) {
      setLastMode(dice.id, modeId)
    }
  }, [dice?.id, modeId])

  // Reset to first page when history or filter changes
  const historyLen = dice?.history?.length ?? 0
  useEffect(() => {
    setHistoryPage(0)
  }, [historyLen, filterCurrentView])

  // Compute drawn item IDs from history
  const drawnItemIds = useMemo(() => {
    if (!dice) return new Set<string>()
    const history = dice.history || []
    return new Set(history.flatMap(rollLogItemIds))
  }, [dice?.history])

  if (!isLoaded) {
    return <div className='mode-loading'>読み込み中...</div>
  }

  if (!dice) {
    return <Navigate to='/' replace />
  }

  if (!isModeEnabled(modeId, dice)) {
    const fallback = MODES.find((m) => isModeEnabled(m.id, dice))
    return (
      <Navigate to={`/dice/${dice.id}/${fallback?.id ?? 'slot'}`} replace />
    )
  }

  const history = dice.history || []
  const reversed = [...history]
    .reverse()
    .filter((log) => !filterCurrentView || log.mode === modeId)
  const totalPages = Math.max(1, Math.ceil(reversed.length / HISTORY_PAGE_SIZE))
  const pagedHistory = reversed.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  )

  const drawnItems = dice.items.filter((item) => drawnItemIds.has(item.id))
  const undrawnItems = dice.items.filter((item) => !drawnItemIds.has(item.id))

  const renderResetButton = () => (
    <button
      className='panel-clear-button'
      onClick={() => clearHistory(dice.id)}
      disabled={history.length === 0}
    >
      既出リセット
    </button>
  )

  return (
    <div className='mode-page'>
      <header className='mode-header'>
        <h1 className='mode-dice-name'>{dice.name}</h1>
        <nav className='mode-switcher'>
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
              <span key={mode.id} className='mode-tab disabled'>
                {mode.name}
              </span>
            )
          })}
        </nav>
        <Link to={`/dice/${dice.id}`} className='mode-edit-link'>
          編集
        </Link>
      </header>

      <main className='mode-main'>{children(dice)}</main>

      {/* Collapsible panels */}
      <div className='mode-panels'>
        {/* Items grid - 既出/未出 */}
        <div className='mode-panel'>
          <button
            className='panel-toggle'
            onClick={() => setShowItems(!showItems)}
          >
            <span>項目 ({dice.items.length})</span>
            <span className='panel-arrow'>{showItems ? '▲' : '▼'}</span>
          </button>
          {showItems && (
            <div className='panel-content'>
              <div className='panel-items-header'>{renderResetButton()}</div>

              {/* 未出 */}
              <div className='panel-items-section'>
                <span className='panel-items-label'>
                  未出 ({undrawnItems.length})
                </span>
                <div className='panel-items-grid'>
                  {undrawnItems.slice(0, GRID_MAX_ITEMS).map((item) => (
                    <span
                      key={item.id}
                      className='panel-grid-cell'
                      style={{
                        background: itemDisplayColor(
                          item.color,
                          dice.items.indexOf(item)
                        ),
                      }}
                      title={
                        item.label || `項目${dice.items.indexOf(item) + 1}`
                      }
                    >
                      {(item.label || `${dice.items.indexOf(item) + 1}`).slice(
                        0,
                        3
                      )}
                    </span>
                  ))}
                  {undrawnItems.length > GRID_MAX_ITEMS && (
                    <span className='panel-grid-more'>
                      +{undrawnItems.length - GRID_MAX_ITEMS}
                    </span>
                  )}
                </div>
              </div>

              {/* 既出 */}
              {drawnItems.length > 0 && (
                <div className='panel-items-section'>
                  <span className='panel-items-label'>
                    既出 ({drawnItems.length})
                  </span>
                  <div className='panel-items-grid'>
                    {drawnItems.slice(0, GRID_MAX_ITEMS).map((item) => (
                      <span
                        key={item.id}
                        className='panel-grid-cell drawn'
                        style={{
                          background: itemDisplayColor(
                            item.color,
                            dice.items.indexOf(item),
                            30,
                            30
                          ),
                        }}
                        title={
                          item.label || `項目${dice.items.indexOf(item) + 1}`
                        }
                      >
                        {(
                          item.label || `${dice.items.indexOf(item) + 1}`
                        ).slice(0, 3)}
                      </span>
                    ))}
                    {drawnItems.length > GRID_MAX_ITEMS && (
                      <span className='panel-grid-more'>
                        +{drawnItems.length - GRID_MAX_ITEMS}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        {settings && (
          <div className='mode-panel'>
            <button
              className='panel-toggle'
              onClick={() => setShowSettings(!showSettings)}
            >
              <span>設定</span>
              <span className='panel-arrow'>{showSettings ? '▲' : '▼'}</span>
            </button>
            {showSettings && (
              <div className='panel-content'>
                {settings(dice)}
                <div className='panel-settings-footer'>
                  {renderResetButton()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className='mode-panel'>
          <button
            className='panel-toggle'
            onClick={() => setShowHistory(!showHistory)}
          >
            <span>履歴 ({reversed.length})</span>
            <span className='panel-arrow'>{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className='panel-content'>
              <div className='panel-history-header'>
                <div className='panel-history-filter'>
                  <button
                    type='button'
                    className={filterCurrentView ? 'active' : ''}
                    onClick={() => setFilterCurrentView(true)}
                  >
                    このView
                  </button>
                  <button
                    type='button'
                    className={!filterCurrentView ? 'active' : ''}
                    onClick={() => setFilterCurrentView(false)}
                  >
                    すべて ({history.length})
                  </button>
                </div>
                <button
                  className='panel-clear-button'
                  onClick={() => clearHistory(dice.id)}
                  disabled={history.length === 0}
                >
                  クリア
                </button>
              </div>
              {reversed.length === 0 ? (
                <p className='panel-empty'>
                  {history.length === 0
                    ? 'まだ履歴がありません'
                    : 'この View の履歴はありません（すべてで確認できます）'}
                </p>
              ) : (
                <>
                  <ul className='panel-history-list'>
                    {pagedHistory.map((log, i) => (
                      <li key={log.id}>
                        <span className='panel-history-number'>
                          {reversed.length -
                            (historyPage * HISTORY_PAGE_SIZE + i)}
                        </span>
                        {!filterCurrentView && log.mode && (
                          <span className='panel-history-mode' title={log.mode}>
                            {MODE_EMOJI[log.mode]}
                          </span>
                        )}
                        <span className='panel-history-label'>
                          {formatRollLog(log)}
                        </span>
                        <span className='panel-history-time'>
                          {formatRelativeTime(log.timestamp, now)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {totalPages > 1 && (
                    <div className='panel-pager'>
                      <button
                        disabled={historyPage === 0}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        ← 新しい
                      </button>
                      <span className='panel-pager-info'>
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
