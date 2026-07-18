import { Link } from 'react-router-dom'
import { itemDisplayColor, MODE_EMOJI } from '../lib/constants'
import { getDice3dSettings } from '../lib/viewSettings'
import type { Dice } from '../types'
import './DiceList.css'

interface Props {
  dice: Dice[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

/** 2D6 のようなダイス表記。rollCount D 面数 */
function diceSpec(dice: Dice): string {
  const rollCount = Math.max(1, getDice3dSettings(dice).rollCount)
  return `${rollCount}D${dice.items.length}`
}

const COVER_SWATCH_MAX = 8

export function DiceList({ dice, onDelete, onDuplicate }: Props) {
  if (dice.length === 0) {
    return (
      <div className='empty-state'>
        <p>ダイスがありません</p>
        <Link to='/new' className='create-link'>
          最初のダイスを作成
        </Link>
      </div>
    )
  }

  return (
    <ul className='dice-grid'>
      {dice.map((d) => {
        const mode = d.lastMode ?? 'slot'
        const swatches = d.items.slice(0, COVER_SWATCH_MAX)
        return (
          <li key={d.id} className='dice-card'>
            <Link to={`/dice/${d.id}/${mode}`} className='dice-card-link'>
              <div className='dice-card-cover'>
                <div className='dice-card-swatches'>
                  {swatches.map((item, index) => (
                    <span
                      key={item.id}
                      className='dice-card-swatch'
                      style={{
                        background: itemDisplayColor(item.color, index),
                      }}
                    />
                  ))}
                </div>
                <span className='dice-card-spec'>{diceSpec(d)}</span>
              </div>
              <div className='dice-card-body'>
                <span className='dice-card-emoji'>{MODE_EMOJI[mode]}</span>
                <span className='dice-card-name'>{d.name}</span>
              </div>
              <span className='dice-card-count'>{d.items.length}項目</span>
            </Link>
            <div className='dice-card-actions'>
              <Link to={`/dice/${d.id}`} className='action-button edit'>
                編集
              </Link>
              <button
                type='button'
                className='action-button duplicate'
                onClick={() => onDuplicate(d.id)}
              >
                複製
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
                削除
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
