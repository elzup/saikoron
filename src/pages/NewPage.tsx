import { useNavigate } from 'react-router-dom'
import { RouletteForm } from '../components/RouletteForm'
import { useRoulettes } from '../hooks/useRoulettes'
import './FormPage.css'

export function NewPage() {
  const navigate = useNavigate()
  const { addRoulette } = useRoulettes()

  return (
    <div className="form-page">
      <header className="form-header">
        <h1>新規ルーレット</h1>
      </header>
      <main>
        <RouletteForm
          onSave={(name, items) => {
            addRoulette(name, items)
            navigate('/')
          }}
          onCancel={() => navigate('/')}
        />
      </main>
    </div>
  )
}
