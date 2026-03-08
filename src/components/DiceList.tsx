import { Link } from 'react-router-dom'
import type { Dice } from '../types'
import './DiceList.css'

interface Props {
  dice: Dice[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function DiceList({ dice, onDelete, onDuplicate }: Props) {
  if (dice.length === 0) {
    return (
      <div className="empty-state">
        <p>ダイスがありません</p>
        <Link to="/new" className="create-link">
          最初のダイスを作成
        </Link>
      </div>
    )
  }

  return (
    <ul className="dice-list">
      {dice.map((d) => (
        <li key={d.id} className="dice-item">
          <Link to={`/dice/${d.id}/${d.lastMode ?? 'slot'}`} className="dice-link">
            <span className="dice-name">{d.name}</span>
            <span className="dice-count">{d.items.length}項目</span>
          </Link>
          <div className="dice-actions">
            <Link to={`/dice/${d.id}`} className="action-button edit">
              編集
            </Link>
            <button
              className="action-button duplicate"
              onClick={() => onDuplicate(d.id)}
            >
              複製
            </button>
            <button
              className="action-button delete"
              onClick={() => {
                if (confirm(`「${d.name}」を削除しますか？`)) {
                  onDelete(d.id)
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
