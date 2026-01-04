import { useState, useEffect, useCallback } from 'react'
import type { Roulette, RouletteItem } from '../types'
import { loadRoulettes, saveRoulettes } from '../lib/storage'
import { createRoulette, updateRoulette, duplicateRoulette } from '../lib/roulette'

export function useRoulettes() {
  const [roulettes, setRoulettes] = useState<Roulette[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setRoulettes(loadRoulettes())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      saveRoulettes(roulettes)
    }
  }, [roulettes, isLoaded])

  const addRoulette = useCallback((name: string, items: Omit<RouletteItem, 'id'>[]) => {
    const newRoulette = createRoulette(name, items)
    setRoulettes((prev) => [...prev, newRoulette])
    return newRoulette
  }, [])

  const editRoulette = useCallback((id: string, updates: Partial<Pick<Roulette, 'name' | 'items'>>) => {
    setRoulettes((prev) =>
      prev.map((r) => (r.id === id ? updateRoulette(r, updates) : r))
    )
  }, [])

  const removeRoulette = useCallback((id: string) => {
    setRoulettes((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const copyRoulette = useCallback((id: string) => {
    setRoulettes((prev) => {
      const target = prev.find((r) => r.id === id)
      if (!target) return prev
      return [...prev, duplicateRoulette(target)]
    })
  }, [])

  const getRoulette = useCallback(
    (id: string) => roulettes.find((r) => r.id === id),
    [roulettes]
  )

  return {
    roulettes,
    isLoaded,
    addRoulette,
    editRoulette,
    removeRoulette,
    copyRoulette,
    getRoulette,
  }
}
