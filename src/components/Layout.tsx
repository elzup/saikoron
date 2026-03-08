import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDice } from '../hooks/useDice'
import { LoginButton } from './LoginButton'
import './Layout.css'

interface Props {
  children: React.ReactNode
}

export function Layout({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { dice, isLoaded } = useDice()
  const location = useLocation()

  return (
    <div className="layout">
      <button
        className="menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニュー"
      >
        {isOpen ? '×' : '☰'}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
            Saikoron
          </Link>
          <LoginButton />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">ツール</span>
            <Link
              to="/new"
              className="nav-item new-item"
              onClick={() => setIsOpen(false)}
            >
              + 新規ダイス
            </Link>
            <Link
              to="/new?mode=range"
              className={`nav-item tool-item ${location.search.includes('mode=range') && location.pathname === '/new' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              🎲 範囲で作成
            </Link>
            <Link
              to="/new?mode=text"
              className={`nav-item tool-item ${location.search.includes('mode=text') && location.pathname === '/new' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              🎯 テキストで作成
            </Link>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">ダイス一覧</span>
            {isLoaded && dice.length === 0 && (
              <p className="empty-message">まだダイスがありません</p>
            )}
            {dice.map((d) => (
              <Link
                key={d.id}
                to={`/dice/${d.id}/${d.lastMode ?? 'slot'}`}
                className={`nav-item ${location.pathname.startsWith(`/dice/${d.id}`) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {d.name}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)} />
      )}

      <main className="main-content">{children}</main>
    </div>
  )
}
