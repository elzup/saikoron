import type { Dice } from '../types'
import { migrateDice } from './dice'

const STORAGE_KEY = 'saikoron_dice'

export function loadDice(): Dice[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data).map(migrateDice)
  } catch {
    return []
  }
}

export function saveDice(dice: Dice[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dice))
}

export function clearDice(): void {
  localStorage.removeItem(STORAGE_KEY)
}
