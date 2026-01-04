import type { Roulette } from '../types'

const STORAGE_KEY = 'saikoron_roulettes'

export function loadRoulettes(): Roulette[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveRoulettes(roulettes: Roulette[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roulettes))
}
