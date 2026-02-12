import { DiceList } from '../components/DiceList'
import { useDice } from '../hooks/useDice'
import './HomePage.css'

export function HomePage() {
  const { dice, isLoaded, removeDice, copyDice } = useDice()

  if (!isLoaded) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>ダイス一覧</h1>
      </header>
      <main>
        <DiceList
          dice={dice}
          onDelete={removeDice}
          onDuplicate={copyDice}
        />
      </main>
    </div>
  )
}
