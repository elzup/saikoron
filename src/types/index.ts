export interface RouletteItem {
  id: string
  label: string
  weight: number
}

export interface Roulette {
  id: string
  name: string
  items: RouletteItem[]
  createdAt: number
  updatedAt: number
}

export interface AppState {
  roulettes: Roulette[]
}
