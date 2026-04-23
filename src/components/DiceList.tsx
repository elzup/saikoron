import { Link } from 'react-router-dom'
import { MODE_EMOJI } from '../lib/constants'
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
      <div className='empty-state'>
        <p>繝繧､繧ｹ縺後≠繧翫∪縺帙ｓ</p>
        <Link to='/new' className='create-link'>
          譛蛻昴・繝繧､繧ｹ繧剃ｽ懈・
        </Link>
      </div>
    )
  }

  return (
    <ul className='dice-list'>
      {dice.map((d) => (
        <li key={d.id} className='dice-item'>
          <Link
            to={`/dice/${d.id}/${d.lastMode ?? 'slot'}`}
            className='dice-link'
          >
            <span className='dice-mode-emoji'>
              {MODE_EMOJI[d.lastMode ?? 'slot']}
            </span>
            <span className='dice-name'>{d.name}</span>
            <span className='dice-count'>{d.items.length}鬆・岼</span>
          </Link>
          <div className='dice-actions'>
            <Link to={`/dice/${d.id}`} className='action-button edit'>
              邱ｨ髮・
            </Link>
            <button
              type='button'
              className='action-button duplicate'
              onClick={() => onDuplicate(d.id)}
            >
              隍・｣ｽ
            </button>
            <button
              type='button'
              className='action-button delete'
              onClick={() => {
                if (confirm('このダイスを削除しますか？')) {
                  onDelete(d.id)
                }
              }}
            >
              蜑企勁
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
