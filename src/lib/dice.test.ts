import { describe, it, expect, vi } from 'vitest'
import {
  createDice,
  createDiceItem,
  updateDice,
  duplicateDice,
  spinDice,
  calculateItemAngle,
} from './dice'

describe('createDiceItem', () => {
  it('creates an item with label and default weight', () => {
    const item = createDiceItem('テスト')
    expect(item.label).toBe('テスト')
    expect(item.weight).toBe(1)
    expect(item.id).toBeDefined()
  })

  it('creates an item with custom weight', () => {
    const item = createDiceItem('テスト', 5)
    expect(item.weight).toBe(5)
  })
})

describe('createDice', () => {
  it('creates a dice with name and items', () => {
    const dice = createDice('テストダイス', [
      { label: '項目1', weight: 1 },
      { label: '項目2', weight: 2 },
    ])

    expect(dice.name).toBe('テストダイス')
    expect(dice.items).toHaveLength(2)
    expect(dice.items[0].label).toBe('項目1')
    expect(dice.items[1].weight).toBe(2)
    expect(dice.id).toBeDefined()
    expect(dice.createdAt).toBeDefined()
    expect(dice.updatedAt).toBeDefined()
  })
})

describe('updateDice', () => {
  it('updates name and items', () => {
    const original = createDice('元の名前', [{ label: '項目', weight: 1 }])
    const originalUpdatedAt = original.updatedAt

    vi.useFakeTimers()
    vi.advanceTimersByTime(100)

    const updated = updateDice(original, {
      name: '新しい名前',
      items: [createDiceItem('新項目')],
    })

    expect(updated.name).toBe('新しい名前')
    expect(updated.items[0].label).toBe('新項目')
    expect(updated.id).toBe(original.id)
    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt)

    vi.useRealTimers()
  })
})

describe('duplicateDice', () => {
  it('creates a copy with new id', () => {
    const original = createDice('オリジナル', [
      { label: '項目1', weight: 1 },
      { label: '項目2', weight: 2 },
    ])

    const copy = duplicateDice(original)

    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe('オリジナル (コピー)')
    expect(copy.items).toHaveLength(2)
    expect(copy.items[0].id).not.toBe(original.items[0].id)
    expect(copy.items[0].label).toBe('項目1')
  })
})

describe('spinDice', () => {
  it('returns null for empty items', () => {
    expect(spinDice([])).toBeNull()
  })

  it('returns an item from the list', () => {
    const items = [
      createDiceItem('A'),
      createDiceItem('B'),
      createDiceItem('C'),
    ]

    const result = spinDice(items)
    expect(result).not.toBeNull()
    expect(items.some((item) => item.id === result!.id)).toBe(true)
  })

  it('respects weight distribution', () => {
    const items = [
      { id: '1', label: 'Heavy', weight: 100 },
      { id: '2', label: 'Light', weight: 1 },
    ]

    let heavyCount = 0
    for (let i = 0; i < 1000; i++) {
      const result = spinDice(items)
      if (result?.id === '1') heavyCount++
    }

    expect(heavyCount).toBeGreaterThan(900)
  })
})

describe('calculateItemAngle', () => {
  it('calculates angles for equal weight items', () => {
    const items = [
      createDiceItem('A'),
      createDiceItem('B'),
      createDiceItem('C'),
      createDiceItem('D'),
    ]

    const first = calculateItemAngle(items, 0)
    expect(first.startAngle).toBe(0)
    expect(first.endAngle).toBe(90)

    const second = calculateItemAngle(items, 1)
    expect(second.startAngle).toBe(90)
    expect(second.endAngle).toBe(180)
  })

  it('calculates angles for weighted items', () => {
    const items = [
      { id: '1', label: 'A', weight: 1 },
      { id: '2', label: 'B', weight: 3 },
    ]

    const first = calculateItemAngle(items, 0)
    expect(first.startAngle).toBe(0)
    expect(first.endAngle).toBe(90)

    const second = calculateItemAngle(items, 1)
    expect(second.startAngle).toBe(90)
    expect(second.endAngle).toBe(360)
  })
})
