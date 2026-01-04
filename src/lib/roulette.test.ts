import { describe, it, expect, vi } from 'vitest'
import {
  createRoulette,
  createRouletteItem,
  updateRoulette,
  duplicateRoulette,
  spinRoulette,
  calculateItemAngle,
} from './roulette'

describe('createRouletteItem', () => {
  it('creates an item with label and default weight', () => {
    const item = createRouletteItem('テスト')
    expect(item.label).toBe('テスト')
    expect(item.weight).toBe(1)
    expect(item.id).toBeDefined()
  })

  it('creates an item with custom weight', () => {
    const item = createRouletteItem('テスト', 5)
    expect(item.weight).toBe(5)
  })
})

describe('createRoulette', () => {
  it('creates a roulette with name and items', () => {
    const roulette = createRoulette('テストルーレット', [
      { label: '項目1', weight: 1 },
      { label: '項目2', weight: 2 },
    ])

    expect(roulette.name).toBe('テストルーレット')
    expect(roulette.items).toHaveLength(2)
    expect(roulette.items[0].label).toBe('項目1')
    expect(roulette.items[1].weight).toBe(2)
    expect(roulette.id).toBeDefined()
    expect(roulette.createdAt).toBeDefined()
    expect(roulette.updatedAt).toBeDefined()
  })
})

describe('updateRoulette', () => {
  it('updates name and items', () => {
    const original = createRoulette('元の名前', [{ label: '項目', weight: 1 }])
    const originalUpdatedAt = original.updatedAt

    // 少し待ってから更新
    vi.useFakeTimers()
    vi.advanceTimersByTime(100)

    const updated = updateRoulette(original, {
      name: '新しい名前',
      items: [createRouletteItem('新項目')],
    })

    expect(updated.name).toBe('新しい名前')
    expect(updated.items[0].label).toBe('新項目')
    expect(updated.id).toBe(original.id)
    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt)

    vi.useRealTimers()
  })
})

describe('duplicateRoulette', () => {
  it('creates a copy with new id', () => {
    const original = createRoulette('オリジナル', [
      { label: '項目1', weight: 1 },
      { label: '項目2', weight: 2 },
    ])

    const copy = duplicateRoulette(original)

    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe('オリジナル (コピー)')
    expect(copy.items).toHaveLength(2)
    expect(copy.items[0].id).not.toBe(original.items[0].id)
    expect(copy.items[0].label).toBe('項目1')
  })
})

describe('spinRoulette', () => {
  it('returns null for empty items', () => {
    expect(spinRoulette([])).toBeNull()
  })

  it('returns an item from the list', () => {
    const items = [
      createRouletteItem('A'),
      createRouletteItem('B'),
      createRouletteItem('C'),
    ]

    const result = spinRoulette(items)
    expect(result).not.toBeNull()
    expect(items.some((item) => item.id === result!.id)).toBe(true)
  })

  it('respects weight distribution', () => {
    // 重みが大きい項目が選ばれやすいことを確認（統計的テスト）
    const items = [
      { id: '1', label: 'Heavy', weight: 100 },
      { id: '2', label: 'Light', weight: 1 },
    ]

    let heavyCount = 0
    for (let i = 0; i < 1000; i++) {
      const result = spinRoulette(items)
      if (result?.id === '1') heavyCount++
    }

    // Heavy が90%以上選ばれるはず
    expect(heavyCount).toBeGreaterThan(900)
  })
})

describe('calculateItemAngle', () => {
  it('calculates angles for equal weight items', () => {
    const items = [
      createRouletteItem('A'),
      createRouletteItem('B'),
      createRouletteItem('C'),
      createRouletteItem('D'),
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
    expect(first.endAngle).toBe(90) // 1/4 = 90度

    const second = calculateItemAngle(items, 1)
    expect(second.startAngle).toBe(90)
    expect(second.endAngle).toBe(360) // 3/4 = 270度
  })
})
