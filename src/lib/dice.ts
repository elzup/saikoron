import { nanoid } from 'nanoid'
import type { Dice, DiceItem, ModeId, ResultLog } from '../types'

export function generateDiceName(items: DiceItem[]): string {
  const labels = items
    .filter((item) => item.label.trim())
    .map((item) => item.label.trim())
  if (labels.length === 0) return '新しいダイス'
  if (labels.length <= 3) return labels.join('・')
  return `${labels.slice(0, 3).join('・')}...`
}

export function createDice(name: string, items: Omit<DiceItem, 'id'>[]): Dice {
  const now = Date.now()
  return {
    id: nanoid(),
    name,
    items: items.map((item) => ({
      id: nanoid(),
      label: item.label,
      weight: item.weight ?? 1,
    })),
    history: [],
    lastMode: 'slot',
    createdAt: now,
    updatedAt: now,
    storageState: 'local',
  }
}

export function createDiceItem(label: string, weight = 1): DiceItem {
  return {
    id: nanoid(),
    label,
    weight,
  }
}

export function createResultLog(item: DiceItem): ResultLog {
  return {
    id: nanoid(),
    itemId: item.id,
    label: item.label,
    timestamp: Date.now(),
  }
}

export function updateDice(dice: Dice, updates: Partial<Pick<Dice, 'name' | 'items' | 'history'>>): Dice {
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

export function calculateItemAngle(items: DiceItem[], index: number): { startAngle: number; endAngle: number } {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return { startAngle: 0, endAngle: 0 }

  let startAngle = 0
  for (let i = 0; i < index; i++) {
    startAngle += (items[i].weight / totalWeight) * 360
  }

  const endAngle = startAngle + (items[index].weight / totalWeight) * 360
  return { startAngle, endAngle }
}
