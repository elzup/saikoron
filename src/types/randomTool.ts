/**
 * ランダムツール抽象化型定義
 * @see docs/random-tool-spec.md
 */

// ========================================
// ソースタイプ (Source Types)
// ========================================

/** リストアイテム */
export interface ListItem {
  id: string
  label: string
  weight: number
}

/** リストソース - 明示的な候補リスト */
export interface ListSource {
  type: 'list'
  items: ListItem[]
}

/** 範囲ソース - 数値範囲 */
export interface RangeSource {
  type: 'range'
  min: number
  max: number
  step: number // 刻み幅 (1=整数, 0.1=小数1桁)
  isInteger: boolean
}

/** ソースの共用型 */
export type RandomSource = ListSource | RangeSource

// ========================================
// 描画タイプ (Drawing Types)
// ========================================

/** 描画タイプ */
export type DrawingType = 'wheel' | 'slot' | 'simple' | 'cards'

/** 描画タイプの閾値設定 */
export const DRAWING_THRESHOLDS = {
  WHEEL_MAX: 20, // ホイール表示の最大候補数
  SLOT_MAX: 50, // スロット表示の最大候補数
  CARDS_MAX: 100, // カード表示の最大候補数
  LARGE_RANGE: 1000, // 「大きい範囲」の閾値
} as const

// ========================================
// 引き方 (Draw Mode)
// ========================================

/** 引き方の設定 */
export interface DrawMode {
  /** 一度に引く数 */
  count: number
  /** 引いた後に候補から除外するか */
  excludeAfterDraw: boolean
  /** 重複を許可するか（count > 1の場合に有効） */
  allowDuplicates: boolean
}

// ========================================
// 結果
// ========================================

/** 抽選結果（リストソース用） */
export interface ListDrawResult {
  type: 'list'
  items: ListItem[]
  timestamp: number
}

/** 抽選結果（範囲ソース用） */
export interface RangeDrawResult {
  type: 'range'
  values: number[]
  timestamp: number
}

/** 抽選結果の共用型 */
export type DrawResult = ListDrawResult | RangeDrawResult

// ========================================
// ランダムツール本体
// ========================================

/** ランダムツール */
export interface RandomTool {
  id: string
  name: string

  /** ソース設定 */
  source: RandomSource

  /** 利用可能な描画タイプ（自動計算） */
  compatibleDrawings: DrawingType[]

  /** 現在の描画タイプ */
  currentDrawing: DrawingType

  /** 引き方設定 */
  drawMode: DrawMode

  /** 除外中のアイテムID（リストソースの場合のみ） */
  excludedIds: string[]

  /** 抽選履歴 */
  history: DrawResult[]

  /** メタデータ */
  createdAt: number
  updatedAt: number
}

// ========================================
// ユーティリティ型
// ========================================

/** ソースタイプの判定 */
export function isListSource(source: RandomSource): source is ListSource {
  return source.type === 'list'
}

export function isRangeSource(source: RandomSource): source is RangeSource {
  return source.type === 'range'
}

/** ソースの候補数を取得 */
export function getSourceCandidateCount(source: RandomSource): number {
  if (isListSource(source)) {
    return source.items.length
  }
  // 範囲ソースの場合
  return Math.floor((source.max - source.min) / source.step) + 1
}

/** ソースに対して利用可能な描画タイプを取得 */
export function getCompatibleDrawings(source: RandomSource): DrawingType[] {
  const count = getSourceCandidateCount(source)
  const drawings: DrawingType[] = ['simple'] // simpleは常に利用可能

  if (isListSource(source)) {
    if (count <= DRAWING_THRESHOLDS.CARDS_MAX) {
      drawings.push('cards')
    }
    if (count <= DRAWING_THRESHOLDS.SLOT_MAX) {
      drawings.push('slot')
    }
    if (count <= DRAWING_THRESHOLDS.WHEEL_MAX) {
      drawings.push('wheel')
    }
  } else {
    // 範囲ソースはホイール非推奨、候補が少なければslot可
    if (count <= DRAWING_THRESHOLDS.SLOT_MAX) {
      drawings.push('slot')
    }
    if (count <= DRAWING_THRESHOLDS.WHEEL_MAX) {
      drawings.push('wheel')
    }
  }

  return drawings
}

/** デフォルトの描画タイプを取得 */
export function getDefaultDrawing(source: RandomSource): DrawingType {
  const compatible = getCompatibleDrawings(source)
  // 優先順位: wheel > slot > cards > simple
  if (compatible.includes('wheel')) return 'wheel'
  if (compatible.includes('slot')) return 'slot'
  if (compatible.includes('cards')) return 'cards'
  return 'simple'
}

/** デフォルトのDrawModeを取得 */
export function getDefaultDrawMode(): DrawMode {
  return {
    count: 1,
    excludeAfterDraw: false,
    allowDuplicates: false,
  }
}
