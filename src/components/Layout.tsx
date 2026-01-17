import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRoulettes } from '../hooks/useRoulettes'
import './Layout.css'

interface Props {
  children: React.ReactNode
}

export function Layout({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { roulettes, isLoaded } = useRoulettes()
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
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">ツール</span>
            <Link
              to="/new"
              className="nav-item new-item"
              onClick={() => setIsOpen(false)}
            >
              + 新規ルーレット
            </Link>
            <Link
              to="/random-number"
              className={`nav-item tool-item ${location.pathname === '/random-number' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              🎲 ランダム数字
            </Link>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">ルーレット一覧</span>
            {isLoaded && roulettes.length === 0 && (
              <p className="empty-message">まだルーレットがありません</p>
            )}
            {roulettes.map((roulette) => (
              <Link
                key={roulette.id}
                to={`/play/${roulette.id}`}
                className={`nav-item ${location.pathname === `/play/${roulette.id}` ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {roulette.name}
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
