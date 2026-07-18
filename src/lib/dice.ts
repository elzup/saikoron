import { nanoid } from 'nanoid'
import type { Dice, DiceItem, ResultLog, RollPick } from '../types'
import { DICE_NAME_MAX_LABELS } from './constants'

/** ラベルが数値ならその値、そうでなければ null */
export function numericOrNull(label: string): number | null {
  const trimmed = label.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/** 全 pick が数値なら合計、そうでなければ null */
export function sumOfPicks(labels: string[]): number | null {
  if (labels.length === 0) return null
  const nums = labels.map(numericOrNull)
  if (nums.some((n) => n === null)) return null
  return (nums as number[]).reduce((acc, n) => acc + n, 0)
}

export function generateDiceName(items: DiceItem[]): string {
  const labels = items
    .filter((item) => item.label.trim())
    .map((item) => item.label.trim())
  if (labels.length === 0) return '新しいダイス'
  if (labels.length <= DICE_NAME_MAX_LABELS) return labels.join('・')
  return `${labels.slice(0, DICE_NAME_MAX_LABELS).join('・')}...`
}

export function createDice(
  name: string,
  items: Omit<DiceItem, 'id'>[],
  rollCount = 1
): Dice {
  const now = Date.now()
  const count = Math.max(1, rollCount)
  return {
    id: nanoid(),
    name,
    items: items.map((item) => ({
      id: nanoid(),
      label: item.label,
      weight: item.weight ?? 1,
      color: item.color,
    })),
    history: [],
    lastMode: 'slot',
    viewSettings: count > 1 ? { dice3d: { rollCount: count } } : undefined,
    createdAt: now,
    updatedAt: now,
    storageState: 'local',
  }
}

export function createDiceItem(
  label: string,
  weight = 1,
  color?: string
): DiceItem {
  return {
    id: nanoid(),
    label,
    weight,
    color,
  }
}

export function createResultLog(picks: DiceItem[]): ResultLog {
  return {
    id: nanoid(),
    picks: picks.map((item) => ({ itemId: item.id, label: item.label })),
    sum: sumOfPicks(picks.map((item) => item.label)),
    timestamp: Date.now(),
  }
}

/** 履歴1エントリの表示文字列。単発はラベル、複数は「a + b = 合計」 */
export function formatRollLog(log: ResultLog): string {
  const labels = log.picks.map((p) => p.label)
  if (labels.length <= 1) return labels[0] ?? ''
  if (log.sum !== null) return `${labels.join(' + ')} = ${log.sum}`
  return labels.join(', ')
}

/** 履歴1エントリに含まれる全 itemId */
export function rollLogItemIds(log: ResultLog): string[] {
  return log.picks.map((p) => p.itemId)
}

export function updateDice(
  dice: Dice,
  updates: Partial<Pick<Dice, 'name' | 'items' | 'history' | 'viewSettings'>>
): Dice {
  return {
    ...dice,
    ...updates,
    updatedAt: Date.now(),
  }
}

export function duplicateDice(dice: Dice): Dice {
  const now = Date.now()
  return {
    ...dice,
    id: nanoid(),
    name: `${dice.name} (コピー)`,
    items: dice.items.map((item) => ({
      ...item,
      id: nanoid(),
    })),
    history: [],
    lastMode: dice.lastMode,
    viewSettings: dice.viewSettings,
    createdAt: now,
    updatedAt: now,
    storageState: dice.storageState,
  }
}

export function spinDice(items: DiceItem[]): DiceItem | null {
  if (items.length === 0) return null

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return null

  const random = Math.random() * totalWeight
  let cumulative = 0

  for (const item of items) {
    cumulative += item.weight
    if (random < cumulative) {
      return item
    }
  }

  return items[items.length - 1]
}

/** 旧形式の ResultLog / 未定義フィールドを現行スキーマへ正規化 */
// biome-ignore lint/suspicious/noExplicitAny: migrating untyped stored data
export function migrateResultLog(raw: any): ResultLog {
  if (Array.isArray(raw?.picks)) {
    const picks: RollPick[] = raw.picks.map((p: RollPick) => ({
      itemId: p.itemId,
      label: p.label,
    }))
    return {
      id: raw.id,
      picks,
      sum:
        typeof raw.sum === 'number'
          ? raw.sum
          : sumOfPicks(picks.map((p) => p.label)),
      timestamp: raw.timestamp,
    }
  }
  // legacy: { id, itemId, label, timestamp }
  return {
    id: raw.id,
    picks: [{ itemId: raw.itemId, label: raw.label }],
    sum: numericOrNull(raw.label),
    timestamp: raw.timestamp,
  }
}

/** ストレージ / クラウドから読んだ生データを現行 Dice へ正規化 */
// biome-ignore lint/suspicious/noExplicitAny: migrating untyped stored data
export function migrateDice(raw: any): Dice {
  const { rollCount, ...rest } = raw
  const viewSettings = { ...(raw.viewSettings ?? {}) }
  // legacy: トップレベル rollCount を viewSettings.dice3d へ移設
  if (typeof rollCount === 'number' && rollCount > 1 && !viewSettings.dice3d) {
    viewSettings.dice3d = { rollCount }
  }
  return {
    ...rest,
    lastMode: raw.lastMode ?? 'slot',
    viewSettings:
      Object.keys(viewSettings).length > 0 ? viewSettings : undefined,
    history: Array.isArray(raw.history)
      ? raw.history.map(migrateResultLog)
      : [],
  }
}

export function calculateItemAngle(
  items: DiceItem[],
  index: number
): { startAngle: number; endAngle: number } {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return { startAngle: 0, endAngle: 0 }

  let startAngle = 0
  for (let i = 0; i < index; i++) {
    startAngle += (items[i].weight / totalWeight) * 360
  }

  const endAngle = startAngle + (items[index].weight / totalWeight) * 360
  return { startAngle, endAngle }
}
