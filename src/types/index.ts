export type ModeId = 'wheel' | 'slot' | 'sample' | 'signage' | 'dice3d'

export interface DiceItem {
  id: string
  label: string
  weight: number
  color?: string
}

/** 1回のロールで引かれた1つの目 */
export interface RollPick {
  itemId: string
  label: string
}

/** 1ロール = 1エントリ。単発は picks 長さ1、2D6 などは複数。 */
export interface ResultLog {
  id: string
  picks: RollPick[]
  /** 全 pick が数値のとき合計。そうでなければ null */
  sum: number | null
  timestamp: number
}

export type StorageState = 'local' | 'cloud'

// ========================================
// View ごとの振り方 / UI 設定
// Dice のデータ本体を汚さないよう viewSettings に隔離する。
// @see docs/model.md
// ========================================

export interface Dice3DViewSettings {
  /** 1回のロールで振る個数（2D6 なら 2） */
  rollCount: number
}

export interface SampleViewSettings {
  count: number
  allowDuplicates: boolean
}

export interface SignageViewSettings {
  interval: number
  displayCount: number
  loop: boolean
}

export interface ViewSettings {
  dice3d?: Dice3DViewSettings
  sample?: SampleViewSettings
  signage?: SignageViewSettings
}

export interface Dice {
  id: string
  name: string
  items: DiceItem[]
  history: ResultLog[]
  lastMode: ModeId
  /** View ごとの振り方/UI 設定（データ本体とは分離） */
  viewSettings?: ViewSettings
  createdAt: number
  updatedAt: number
  storageState: StorageState
}

export interface AppState {
  dice: Dice[]
}
