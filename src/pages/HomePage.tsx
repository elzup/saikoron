import { Link } from 'react-router-dom'
import { RouletteList } from '../components/RouletteList'
import { useRoulettes } from '../hooks/useRoulettes'
import './HomePage.css'

export function HomePage() {
  const { roulettes, isLoaded, removeRoulette, copyRoulette } = useRoulettes()

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <div className="home-page">
      <header className="header">
        <h1>Saikoron</h1>
        <Link to="/new" className="new-button">
          + 新規作成
        </Link>
      </header>
      <main>
        <RouletteList
          roulettes={roulettes}
          onDelete={removeRoulette}
          onDuplicate={copyRoulette}
        />
      </main>
    </div>
  )
}
