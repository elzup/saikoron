import { useParams, Navigate, Link } from 'react-router-dom'
import { RouletteWheel } from '../components/RouletteWheel'
import { useRoulettes } from '../hooks/useRoulettes'
import './PlayPage.css'

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const { getRoulette, isLoaded } = useRoulettes()

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  const roulette = id ? getRoulette(id) : undefined

  if (!roulette) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="play-page">
      <header className="play-header">
        <Link to="/" className="back-link">← 戻る</Link>
        <h1>{roulette.name}</h1>
        <Link to={`/edit/${roulette.id}`} className="edit-link">編集</Link>
      </header>
      <main>
        <RouletteWheel items={roulette.items} />
      </main>
    </div>
  )
}
