import { describe, expect, it } from 'vitest'
import { createDiceItem } from './dice'
import {
  drawSample,
  drawSequential,
  drawSingle,
  drawSum,
  drawWithoutReplacement,
} from './draw'

const numItems = (n: number) =>
  Array.from({ length: n }, (_, i) => createDiceItem(String(i + 1)))

describe('drawSingle', () => {
  it('draws exactly one pick', () => {
    const result = drawSingle(numItems(6))
    expect(result.picks).toHaveLength(1)
  })
})

describe('drawSum', () => {
  it('draws count picks and sums numeric labels', () => {
    const result = drawSum(numItems(6), 2)
    expect(result.picks).toHaveLength(2)
    expect(result.sum).toBe(
      Number(result.picks[0].label) + Number(result.picks[1].label)
    )
    expect(result.sum).toBeGreaterThanOrEqual(2)
    expect(result.sum).toBeLessThanOrEqual(12)
  })

  it('sum is null for non-numeric labels', () => {
    const items = [createDiceItem('A'), createDiceItem('B')]
    expect(drawSum(items, 2).sum).toBeNull()
  })
})

describe('drawSample', () => {
  it('draws distinct picks without replacement by default', () => {
    const result = drawSample(numItems(5), 3)
    const ids = result.picks.map((p) => p.id)
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
  })

  it('caps at pool size without replacement', () => {
    expect(drawSample(numItems(3), 10).picks).toHaveLength(3)
  })

  it('allows duplicates and exceeds pool size when allowed', () => {
    const result = drawSample(numItems(2), 5, { allowDuplicates: true })
    expect(result.picks).toHaveLength(5)
  })

  it('respects weight (heavy item dominates)', () => {
    const items = [
      { id: 'h', label: 'Heavy', weight: 100 },
      { id: 'l', label: 'Light', weight: 1 },
    ]
    let heavyFirst = 0
    for (let i = 0; i < 500; i++) {
      if (drawSample(items, 1).picks[0].id === 'h') heavyFirst++
    }
    expect(heavyFirst).toBeGreaterThan(450)
  })
})

describe('drawWithoutReplacement', () => {
  it('never repeats an item', () => {
    const picks = drawWithoutReplacement(numItems(4), 4)
    expect(new Set(picks.map((p) => p.id)).size).toBe(4)
  })
})

describe('drawSequential', () => {
  it('excludes already-seen ids', () => {
    const items = numItems(4)
    const excluded = new Set([items[0].id, items[1].id])
    const result = drawSequential(items, 5, excluded)
    const ids = result.picks.map((p) => p.id)
    expect(ids).not.toContain(items[0].id)
    expect(ids).not.toContain(items[1].id)
    expect(result.picks).toHaveLength(2)
  })
})
