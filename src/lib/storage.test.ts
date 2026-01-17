import { describe, it, expect, beforeEach } from 'vitest'
import { loadRoulettes, saveRoulettes } from './storage'
import type { Roulette } from '../types'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mockRoulette: Roulette = {
    id: 'test-id',
    name: 'テスト',
    items: [
      { id: 'item-1', label: '項目1', weight: 1 },
      { id: 'item-2', label: '項目2', weight: 2 },
    ],
    history: [],
    createdAt: 1000,
    updatedAt: 2000,
  }

  describe('loadRoulettes', () => {
    it('returns empty array when no data', () => {
      expect(loadRoulettes()).toEqual([])
    })

    it('returns saved roulettes', () => {
      localStorage.setItem('saikoron_roulettes', JSON.stringify([mockRoulette]))

      const result = loadRoulettes()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('テスト')
    })

    it('returns empty array on invalid JSON', () => {
      localStorage.setItem('saikoron_roulettes', 'invalid json')

      expect(loadRoulettes()).toEqual([])
    })
  })

  describe('saveRoulettes', () => {
    it('saves roulettes to localStorage', () => {
      saveRoulettes([mockRoulette])

      const stored = localStorage.getItem('saikoron_roulettes')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].name).toBe('テスト')
    })

    it('overwrites existing data', () => {
      saveRoulettes([mockRoulette])
      saveRoulettes([])

      const result = loadRoulettes()
      expect(result).toEqual([])
    })
  })
})
