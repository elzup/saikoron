import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { RouletteForm } from '../components/RouletteForm'
import { useRoulettes } from '../hooks/useRoulettes'
import './FormPage.css'

export function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRoulette, editRoulette, isLoaded } = useRoulettes()

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  const roulette = id ? getRoulette(id) : undefined

  if (!roulette) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="form-page">
      <header className="form-header">
        <h1>ルーレット編集</h1>
      </header>
      <main>
        <RouletteForm
          roulette={roulette}
          onSave={(name, items) => {
            editRoulette(roulette.id, { name, items })
            navigate('/')
          }}
          onCancel={() => navigate('/')}
        />
      </main>
    </div>
  )
}
