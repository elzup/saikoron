import { Link } from 'react-router-dom'
import type { Roulette } from '../types'
import './RouletteList.css'

interface Props {
  roulettes: Roulette[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function RouletteList({ roulettes, onDelete, onDuplicate }: Props) {
  if (roulettes.length === 0) {
    return (
      <div className="empty-state">
        <p>ルーレットがありません</p>
        <Link to="/new" className="create-link">
          最初のルーレットを作成
        </Link>
      </div>
    )
  }

  return (
    <ul className="roulette-list">
      {roulettes.map((roulette) => (
        <li key={roulette.id} className="roulette-item">
          <Link to={`/play/${roulette.id}`} className="roulette-link">
            <span className="roulette-name">{roulette.name}</span>
            <span className="roulette-count">{roulette.items.length}項目</span>
          </Link>
          <div className="roulette-actions">
            <Link to={`/edit/${roulette.id}`} className="action-button edit">
              編集
            </Link>
            <button
              className="action-button duplicate"
              onClick={() => onDuplicate(roulette.id)}
            >
              複製
            </button>
            <button
              className="action-button delete"
              onClick={() => {
                if (confirm(`「${roulette.name}」を削除しますか？`)) {
                  onDelete(roulette.id)
                }
              }}
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
