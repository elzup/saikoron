export interface RouletteItem {
  id: string
  label: string
  weight: number
}

export interface ResultLog {
  id: string
  itemId: string
  label: string
  timestamp: number
}

export interface Roulette {
  id: string
  name: string
  items: RouletteItem[]
  history: ResultLog[]
  createdAt: number
  updatedAt: number
}

export interface AppState {
  roulettes: Roulette[]
}
