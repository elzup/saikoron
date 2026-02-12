export interface DiceItem {
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

export type StorageState = 'local' | 'cloud'

export interface Dice {
  id: string
  name: string
  items: DiceItem[]
  history: ResultLog[]
  createdAt: number
  updatedAt: number
  storageState: StorageState
}

export interface AppState {
  dice: Dice[]
}
