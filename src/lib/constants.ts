import type { ModeId } from '../types'

// ========================================
// Mode 定義
// ========================================

export interface ModeConfig {
  id: ModeId
  name: string
  emoji: string
  maxItems?: number
}

export const MODES: ModeConfig[] = [
  { id: 'wheel', name: 'ルーレット', emoji: '🎡', maxItems: 100 },
  { id: 'slot', name: 'スロット', emoji: '🎰' },
  { id: 'sample', name: 'おみくじ', emoji: '🎋' },
  { id: 'signage', name: 'サイネージ', emoji: '📺' },
  { id: 'dice3d', name: '3D ダイス', emoji: '🎲' },
]

export const MODE_EMOJI: Record<ModeId, string> = Object.fromEntries(
  MODES.map((m) => [m.id, m.emoji])
) as Record<ModeId, string>

// ========================================
// アイテムカラー
// ========================================

/** 共通カラーパレット (ルーレット, スロット用) */
export const ITEM_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

/** グリッドセルの色を生成 */
export function itemHslColor(
  index: number,
  saturation = 70,
  lightness = 50
): string {
  return `hsl(${(index * 45) % 360}, ${saturation}%, ${lightness}%)`
}

export function itemDisplayColor(
  color: string | undefined,
  index: number,
  saturation = 70,
  lightness = 50
): string {
  return color?.trim() || itemHslColor(index, saturation, lightness)
}

// ========================================
// アニメーション
// ========================================

/** スロットアニメーション */
export const SLOT_ANIMATION = {
  /** 固定ステップ数 (項目数に依存しない) */
  TOTAL_STEPS: 25,
  /** 最小遅延 (ms) */
  MIN_DELAY: 40,
  /** 最大遅延 (ms) */
  MAX_DELAY: 300,
} as const

/** ルーレットアニメーション */
export const WHEEL_ANIMATION = {
  /** 最小回転数 */
  MIN_SPINS: 5,
  /** ランダム追加回転数 */
  RANDOM_SPINS: 3,
  /** アニメーション時間 (ms) */
  DURATION_MS: 4000,
  /** CSS easing */
  EASING: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
} as const

/** おみくじアニメーション遅延 (ms) */
export const SAMPLE_DELAY_MS = 500

/** 3D ダイスアニメーション */
export const DICE3D_ANIMATION = {
  /** 転がり時間 (ms) */
  DURATION_MS: 1200,
  /** 最小回転数 */
  MIN_SPINS: 2,
  /** ランダム追加回転数 */
  RANDOM_SPINS: 2,
  /** CSS easing */
  EASING: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
} as const

// ========================================
// 表示制限
// ========================================

/** 履歴ページサイズ */
export const HISTORY_PAGE_SIZE = 20

/** グリッド最大表示数 */
export const GRID_MAX_ITEMS = 100

/** ダイス名の自動生成で使うラベル数 */
export const DICE_NAME_MAX_LABELS = 3

// ========================================
// データ制限
// ========================================

/** ダイスのアイテム数上限 */
export const MAX_DICE_ITEMS = 1000

/** 1ロールで振れるダイス個数の上限 (rollCount) */
export const MAX_ROLL_COUNT = 10

/** 履歴エントリ数上限 */
export const MAX_HISTORY_ENTRIES = 10000

/** 重みの最大値 */
export const MAX_WEIGHT = 100

/** 重複時の倍率 (おみくじ) */
export const SAMPLE_DUPLICATE_MULTIPLIER = 3

// ========================================
// タイマー
// ========================================

/** 相対時間の更新間隔 (ms) */
export const RELATIVE_TIME_REFRESH_MS = 10_000

/** サイネージのデフォルト間隔 (秒) */
export const SIGNAGE_DEFAULT_INTERVAL = 5

/** サイネージの最大間隔 (秒) */
export const SIGNAGE_MAX_INTERVAL = 60

/** 範囲作成のデフォルト最大値 */
export const RANGE_DEFAULT_MAX = 100
