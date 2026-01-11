import { nanoid } from 'nanoid'
import type { Roulette, RouletteItem } from '../types'

export function generateRouletteName(items: RouletteItem[]): string {
  const labels = items
    .filter((item) => item.label.trim())
    .map((item) => item.label.trim())
  if (labels.length === 0) return '新しいルーレット'
  if (labels.length <= 3) return labels.join('・')
  return `${labels.slice(0, 3).join('・')}...`
}

export function createRoulette(name: string, items: Omit<RouletteItem, 'id'>[]): Roulette {
  const now = Date.now()
  return {
    id: nanoid(),
    name,
    items: items.map((item) => ({
      id: nanoid(),
      label: item.label,
      weight: item.weight ?? 1,
    })),
    createdAt: now,
    updatedAt: now,
  }
}

export function createRouletteItem(label: string, weight = 1): RouletteItem {
  return {
    id: nanoid(),
    label,
    weight,
  }
}

export function updateRoulette(roulette: Roulette, updates: Partial<Pick<Roulette, 'name' | 'items'>>): Roulette {
  return {
    ...roulette,
    ...updates,
    updatedAt: Date.now(),
  }
}

export function duplicateRoulette(roulette: Roulette): Roulette {
  const now = Date.now()
  return {
    ...roulette,
    id: nanoid(),
    name: `${roulette.name} (コピー)`,
    items: roulette.items.map((item) => ({
      ...item,
      id: nanoid(),
    })),
    createdAt: now,
    updatedAt: now,
  }
}

export function spinRoulette(items: RouletteItem[]): RouletteItem | null {
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

export function calculateItemAngle(items: RouletteItem[], index: number): { startAngle: number; endAngle: number } {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return { startAngle: 0, endAngle: 0 }

  let startAngle = 0
  for (let i = 0; i < index; i++) {
    startAngle += (items[i].weight / totalWeight) * 360
  }

  const endAngle = startAngle + (items[index].weight / totalWeight) * 360
  return { startAngle, endAngle }
}
