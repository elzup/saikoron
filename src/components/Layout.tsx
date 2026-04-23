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
    <div className='layout'>
      <button
        type='button'
        className='menu-button'
        onClick={() => setIsOpen(!isOpen)}
        aria-label='繝｡繝九Η繝ｼ'
      >
        {isOpen ? 'ﾃ・' : '笘ｰ'}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className='sidebar-header'>
          <Link to='/' className='logo' onClick={() => setIsOpen(false)}>
            Saikoron
          </Link>
          <LoginButton />
        </div>

        <nav className='sidebar-nav'>
          <div className='nav-section'>
            <span className='nav-section-title'>繝・・繝ｫ</span>
            <Link
              to='/new'
              className='nav-item new-item'
              onClick={() => setIsOpen(false)}
            >
              + 譁ｰ隕上ム繧､繧ｹ
            </Link>
            <Link
              to='/new?mode=range'
              className={`nav-item tool-item ${location.search.includes('mode=range') && location.pathname === '/new' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              軸 遽・峇縺ｧ菴懈・
            </Link>
            <Link
              to='/new?mode=text'
              className={`nav-item tool-item ${location.search.includes('mode=text') && location.pathname === '/new' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              識 繝・く繧ｹ繝医〒菴懈・
            </Link>
          </div>

          <div className='nav-section'>
            <span className='nav-section-title'>繝繧､繧ｹ荳隕ｧ</span>
            {isLoaded && dice.length === 0 && (
              <p className='empty-message'>縺ｾ縺繝繧､繧ｹ縺後≠繧翫∪縺帙ｓ</p>
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
        <button
          type='button'
          className='overlay'
          aria-label='繝｡繝九Η繝ｼ繧定閉縺倥ｋ'
          onClick={() => setIsOpen(false)}
        />
      )}

      <main className='main-content'>{children}</main>
    </div>
  )
}
