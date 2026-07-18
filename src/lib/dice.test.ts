import { describe, expect, it, vi } from 'vitest'
import type { ResultLog } from '../types'
import {
  calculateItemAngle,
  createDice,
  createDiceItem,
  createResultLog,
  duplicateDice,
  formatRollLog,
  migrateDice,
  migrateResultLog,
  numericOrNull,
  rollLogItemIds,
  spinDice,
  updateDice,
} from './dice'
import { getDice3dSettings } from './viewSettings'

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

describe('createDice rollCount (viewSettings)', () => {
  it('defaults to 1 and stores nothing when rollCount is 1', () => {
    const dice = createDice('d', [{ label: '1', weight: 1 }])
    expect(dice.viewSettings?.dice3d).toBeUndefined()
    expect(getDice3dSettings(dice).rollCount).toBe(1)
  })

  it('stores rollCount > 1 in viewSettings.dice3d', () => {
    const dice = createDice('d', [{ label: '1', weight: 1 }], 2)
    expect(dice.viewSettings?.dice3d?.rollCount).toBe(2)
    expect(getDice3dSettings(dice).rollCount).toBe(2)
  })

  it('clamps invalid rollCount to default', () => {
    expect(
      getDice3dSettings(createDice('d', [{ label: '1', weight: 1 }], 0))
        .rollCount
    ).toBe(1)
  })
})

describe('numericOrNull', () => {
  it('parses numeric labels', () => {
    expect(numericOrNull('6')).toBe(6)
    expect(numericOrNull(' 12 ')).toBe(12)
    expect(numericOrNull('-3')).toBe(-3)
  })

  it('returns null for non-numeric or empty', () => {
    expect(numericOrNull('りんご')).toBeNull()
    expect(numericOrNull('')).toBeNull()
    expect(numericOrNull('  ')).toBeNull()
  })
})

describe('createResultLog', () => {
  it('records picks and computes sum for numeric picks', () => {
    const log = createResultLog([createDiceItem('2'), createDiceItem('5')])
    expect(log.picks).toHaveLength(2)
    expect(log.picks[0].label).toBe('2')
    expect(log.sum).toBe(7)
  })

  it('sum is null for non-numeric picks', () => {
    const log = createResultLog([createDiceItem('A'), createDiceItem('B')])
    expect(log.sum).toBeNull()
  })

  it('records which View it was rolled in', () => {
    expect(createResultLog([createDiceItem('1')], 'dice3d').mode).toBe('dice3d')
    expect(createResultLog([createDiceItem('1')]).mode).toBeUndefined()
  })
})

describe('formatRollLog', () => {
  it('shows a single label as-is', () => {
    expect(formatRollLog(createResultLog([createDiceItem('りんご')]))).toBe(
      'りんご'
    )
  })

  it('shows sum expression for numeric multi-pick', () => {
    expect(
      formatRollLog(createResultLog([createDiceItem('2'), createDiceItem('5')]))
    ).toBe('2 + 5 = 7')
  })

  it('joins labels when non-numeric multi-pick', () => {
    expect(
      formatRollLog(createResultLog([createDiceItem('A'), createDiceItem('B')]))
    ).toBe('A, B')
  })
})

describe('rollLogItemIds', () => {
  it('collects all pick item ids', () => {
    const a = createDiceItem('A')
    const b = createDiceItem('B')
    expect(rollLogItemIds(createResultLog([a, b]))).toEqual([a.id, b.id])
  })
})

describe('migrateResultLog', () => {
  it('converts legacy { itemId, label } to picks/sum', () => {
    const legacy = { id: 'l1', itemId: 'i1', label: '3', timestamp: 100 }
    const migrated = migrateResultLog(legacy)
    expect(migrated.picks).toEqual([{ itemId: 'i1', label: '3' }])
    expect(migrated.sum).toBe(3)
    expect(migrated.timestamp).toBe(100)
  })

  it('keeps current shape (with mode) untouched', () => {
    const current: ResultLog = {
      id: 'l2',
      picks: [{ itemId: 'i1', label: '2' }],
      sum: 2,
      timestamp: 200,
      mode: 'dice3d',
    }
    expect(migrateResultLog(current)).toEqual(current)
  })
})

describe('migrateDice', () => {
  it('defaults lastMode and migrates legacy history', () => {
    const raw = {
      id: 'd1',
      name: 'legacy',
      items: [{ id: 'i1', label: '1', weight: 1 }],
      history: [{ id: 'l1', itemId: 'i1', label: '1', timestamp: 1 }],
      createdAt: 1,
      updatedAt: 1,
      storageState: 'local',
    }
    const migrated = migrateDice(raw)
    expect(migrated.lastMode).toBe('slot')
    expect(migrated.viewSettings).toBeUndefined()
    expect(migrated.history[0].picks).toEqual([{ itemId: 'i1', label: '1' }])
  })

  it('moves legacy top-level rollCount into viewSettings.dice3d', () => {
    const migrated = migrateDice({
      id: 'd2',
      name: 'legacy2d6',
      items: [{ id: 'i1', label: '1', weight: 1 }],
      history: [],
      rollCount: 2,
      createdAt: 1,
      updatedAt: 1,
      storageState: 'local',
    })
    expect(migrated.viewSettings?.dice3d?.rollCount).toBe(2)
    expect(
      (migrated as unknown as { rollCount?: number }).rollCount
    ).toBeUndefined()
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
    expect(items.some((item) => item.id === result?.id)).toBe(true)
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
