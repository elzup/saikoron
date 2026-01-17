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
      <header className="page-header">
        <h1>ルーレット一覧</h1>
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
