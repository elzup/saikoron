import { describe, it, expect } from 'vitest'
import {
  drawFromList,
  drawFromRange,
  drawMultipleFromList,
  drawMultipleFromRange,
  createListRandomTool,
  createRangeRandomTool,
  executeRandomTool,
} from './randomTool'
import {
  getCompatibleDrawings,
  getSourceCandidateCount,
  isListSource,
  isRangeSource,
} from '../types/randomTool'
import type { ListItem, RangeSource, ListSource } from '../types/randomTool'

describe('randomTool', () => {
  describe('drawFromList', () => {
    const items: ListItem[] = [
      { id: '1', label: 'A', weight: 1 },
      { id: '2', label: 'B', weight: 1 },
      { id: '3', label: 'C', weight: 1 },
    ]

    it('returns an item from the list', () => {
      const result = drawFromList(items)
      expect(result).not.toBeNull()
      expect(items.map((i) => i.id)).toContain(result?.id)
    })

    it('respects excluded ids', () => {
      const result = drawFromList(items, ['1', '2'])
      expect(result?.id).toBe('3')
    })

    it('returns null when all items are excluded', () => {
      const result = drawFromList(items, ['1', '2', '3'])
      expect(result).toBeNull()
    })

    it('returns null for empty list', () => {
      const result = drawFromList([])
      expect(result).toBeNull()
    })
  })

  describe('drawFromRange', () => {
    it('returns integer within range', () => {
      const source: RangeSource = {
        type: 'range',
        min: 1,
        max: 6,
        step: 1,
        isInteger: true,
      }

      for (let i = 0; i < 100; i++) {
        const result = drawFromRange(source)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('returns values with correct step', () => {
      const source: RangeSource = {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
        isInteger: false,
      }

      for (let i = 0; i < 100; i++) {
        const result = drawFromRange(source)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
        // Check that it's a multiple of 0.1
        const rounded = Math.round(result * 10) / 10
        expect(Math.abs(result - rounded)).toBeLessThan(0.0001)
      }
    })
  })

  describe('drawMultipleFromList', () => {
    const items: ListItem[] = [
      { id: '1', label: 'A', weight: 1 },
      { id: '2', label: 'B', weight: 1 },
      { id: '3', label: 'C', weight: 1 },
    ]

    it('draws multiple items without duplicates', () => {
      const { results } = drawMultipleFromList(items, 3, [], false, false)
      expect(results).toHaveLength(3)
      const ids = results.map((r) => r.id)
      expect(new Set(ids).size).toBe(3) // All unique
    })

    it('updates excluded ids when excludeAfterDraw is true', () => {
      const { results, newExcludedIds } = drawMultipleFromList(
        items,
        2,
        [],
        false,
        true
      )
      expect(results).toHaveLength(2)
      expect(newExcludedIds).toHaveLength(2)
    })

    it('respects existing excluded ids', () => {
      const { results } = drawMultipleFromList(items, 3, ['1'], false, false)
      expect(results).toHaveLength(2)
      expect(results.map((r) => r.id)).not.toContain('1')
    })
  })

  describe('drawMultipleFromRange', () => {
    const source: RangeSource = {
      type: 'range',
      min: 1,
      max: 10,
      step: 1,
      isInteger: true,
    }

    it('draws multiple values with duplicates allowed', () => {
      const results = drawMultipleFromRange(source, 5, true)
      expect(results).toHaveLength(5)
      results.forEach((r) => {
        expect(r).toBeGreaterThanOrEqual(1)
        expect(r).toBeLessThanOrEqual(10)
      })
    })

    it('draws unique values when duplicates not allowed', () => {
      const results = drawMultipleFromRange(source, 5, false)
      expect(results).toHaveLength(5)
      expect(new Set(results).size).toBe(5)
    })
  })

  describe('getCompatibleDrawings', () => {
    it('includes wheel for small lists', () => {
      const source: ListSource = {
        type: 'list',
        items: Array(10)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, label: `Item ${i}`, weight: 1 })),
      }
      const drawings = getCompatibleDrawings(source)
      expect(drawings).toContain('wheel')
      expect(drawings).toContain('slot')
      expect(drawings).toContain('simple')
    })

    it('excludes wheel for large lists', () => {
      const source: ListSource = {
        type: 'list',
        items: Array(30)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, label: `Item ${i}`, weight: 1 })),
      }
      const drawings = getCompatibleDrawings(source)
      expect(drawings).not.toContain('wheel')
      expect(drawings).toContain('slot')
      expect(drawings).toContain('simple')
    })

    it('only includes simple for large ranges', () => {
      const source: RangeSource = {
        type: 'range',
        min: 1,
        max: 1000000,
        step: 1,
        isInteger: true,
      }
      const drawings = getCompatibleDrawings(source)
      expect(drawings).toEqual(['simple'])
    })
  })

  describe('getSourceCandidateCount', () => {
    it('counts list items correctly', () => {
      const source: ListSource = {
        type: 'list',
        items: [
          { id: '1', label: 'A', weight: 1 },
          { id: '2', label: 'B', weight: 1 },
        ],
      }
      expect(getSourceCandidateCount(source)).toBe(2)
    })

    it('calculates range count correctly', () => {
      const source: RangeSource = {
        type: 'range',
        min: 1,
        max: 6,
        step: 1,
        isInteger: true,
      }
      expect(getSourceCandidateCount(source)).toBe(6)
    })

    it('handles step correctly', () => {
      const source: RangeSource = {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
        isInteger: false,
      }
      expect(getSourceCandidateCount(source)).toBe(11) // 0, 0.1, 0.2, ... 1.0
    })
  })

  describe('createListRandomTool', () => {
    it('creates a tool with correct defaults', () => {
      const tool = createListRandomTool('Test', [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
      ])

      expect(tool.name).toBe('Test')
      expect(isListSource(tool.source)).toBe(true)
      expect(tool.source.type).toBe('list')
      if (isListSource(tool.source)) {
        expect(tool.source.items).toHaveLength(2)
      }
      expect(tool.compatibleDrawings).toContain('wheel')
      expect(tool.currentDrawing).toBe('wheel')
      expect(tool.drawMode.count).toBe(1)
      expect(tool.excludedIds).toEqual([])
      expect(tool.history).toEqual([])
    })
  })

  describe('createRangeRandomTool', () => {
    it('creates a range tool with correct defaults', () => {
      const tool = createRangeRandomTool('Dice', 1, 6)

      expect(tool.name).toBe('Dice')
      expect(isRangeSource(tool.source)).toBe(true)
      if (isRangeSource(tool.source)) {
        expect(tool.source.min).toBe(1)
        expect(tool.source.max).toBe(6)
        expect(tool.source.step).toBe(1)
        expect(tool.source.isInteger).toBe(true)
      }
    })
  })

  describe('executeRandomTool', () => {
    it('executes list tool and updates history', () => {
      const tool = createListRandomTool('Test', [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
      ])

      const { result, updatedTool } = executeRandomTool(tool)

      expect(result.type).toBe('list')
      expect(updatedTool.history).toHaveLength(1)
      expect(updatedTool.history[0]).toBe(result)
    })

    it('executes range tool and updates history', () => {
      const tool = createRangeRandomTool('Dice', 1, 6)

      const { result, updatedTool } = executeRandomTool(tool)

      expect(result.type).toBe('range')
      if (result.type === 'range') {
        expect(result.values).toHaveLength(1)
        expect(result.values[0]).toBeGreaterThanOrEqual(1)
        expect(result.values[0]).toBeLessThanOrEqual(6)
      }
      expect(updatedTool.history).toHaveLength(1)
    })
  })
})
