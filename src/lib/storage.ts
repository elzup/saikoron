import type { Dice } from '../types'

const STORAGE_KEY = 'saikoron_dice'

export function loadDice(): Dice[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
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
