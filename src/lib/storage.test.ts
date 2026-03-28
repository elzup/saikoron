import { describe, it, expect, beforeEach } from 'vitest'
import { loadDice, saveDice } from './storage'
import type { Dice } from '../types'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mockDice: Dice = {
    id: 'test-id',
    name: 'テスト',
    items: [
      { id: 'item-1', label: '項目1', weight: 1 },
      { id: 'item-2', label: '項目2', weight: 2 },
    ],
    history: [],
    createdAt: 1000,
    updatedAt: 2000,
    storageState: 'local',
    lastMode: 'slot',
  }

  describe('loadDice', () => {
    it('returns empty array when no data', () => {
      expect(loadDice()).toEqual([])
    })

    it('returns saved dice', () => {
      localStorage.setItem('saikoron_dice', JSON.stringify([mockDice]))

      const result = loadDice()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('テスト')
    })

    it('returns empty array on invalid JSON', () => {
      localStorage.setItem('saikoron_dice', 'invalid json')

      expect(loadDice()).toEqual([])
    })
  })

  describe('saveDice', () => {
    it('saves dice to localStorage', () => {
      saveDice([mockDice])

      const stored = localStorage.getItem('saikoron_dice')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].name).toBe('テスト')
    })

    it('overwrites existing data', () => {
      saveDice([mockDice])
      saveDice([])

      const result = loadDice()
      expect(result).toEqual([])
    })
  })
})
