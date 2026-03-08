import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { Dice, DiceItem, ModeId } from '../types'
import { loadDice, saveDice, clearDice } from '../lib/storage'
import {
  createDice,
  updateDice,
  duplicateDice,
  createResultLog,
} from '../lib/dice'
import { useAuth } from './AuthContext'
import {
  subscribeToDice,
  saveDiceToFirestore,
  deleteDiceFromFirestore,
} from '../lib/firebase/firestore'
import { syncLocalToCloud } from '../lib/firebase/sync'

interface DiceContextValue {
  dice: Dice[]
  isLoaded: boolean
  addDice: (name: string, items: Omit<DiceItem, 'id'>[]) => Dice
  editDice: (
    id: string,
    updates: Partial<Pick<Dice, 'name' | 'items' | 'history'>>
  ) => void
  removeDice: (id: string) => void
  copyDice: (id: string) => void
  getDice: (id: string) => Dice | undefined
  addHistory: (id: string, item: DiceItem) => void
  clearHistory: (id: string) => void
  setLastMode: (id: string, mode: ModeId) => void
}

const DiceContext = createContext<DiceContextValue | null>(null)

export function DiceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [dice, setDice] = useState<Dice[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const prevUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    if (user) {
      const localDice = loadDice()

      syncLocalToCloud(user.uid, localDice).then(() => {
        clearDice()
      })

      unsubscribeRef.current = subscribeToDice(
        user.uid,
        (cloudDice) => {
          setDice(cloudDice)
          setIsLoaded(true)
        }
      )
    } else {
      if (prevUserRef.current !== null) {
        setDice([])
        clearDice()
      } else {
        const localDice = loadDice().map((r) => ({
          ...r,
          storageState: 'local' as const,
        }))
        setDice(localDice)
      }
      setIsLoaded(true)
    }

    prevUserRef.current = user?.uid ?? null

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [user])

  useEffect(() => {
    if (isLoaded && !user) {
      saveDice(dice)
    }
  }, [dice, isLoaded, user])

  const addDice = useCallback(
    (name: string, items: Omit<DiceItem, 'id'>[]) => {
      const storageState = user ? 'cloud' : 'local'
      const newDice = {
        ...createDice(name, items),
        storageState,
      } as Dice

      setDice((prev) => [...prev, newDice])

      if (user) {
        saveDiceToFirestore(user.uid, newDice)
      }

      return newDice
    },
    [user]
  )

  const editDice = useCallback(
    (
      id: string,
      updates: Partial<Pick<Dice, 'name' | 'items' | 'history'>>
    ) => {
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const updated = updateDice(r, updates)
          if (user) {
            saveDiceToFirestore(user.uid, updated)
          }
          return updated
        })
      )
    },
    [user]
  )

  const removeDice = useCallback(
    (id: string) => {
      setDice((prev) => prev.filter((r) => r.id !== id))
      if (user) {
        deleteDiceFromFirestore(user.uid, id)
      }
    },
    [user]
  )

  const copyDice = useCallback(
    (id: string) => {
      setDice((prev) => {
        const target = prev.find((r) => r.id === id)
        if (!target) return prev
        const copied = duplicateDice(target)
        if (user) {
          saveDiceToFirestore(user.uid, copied)
        }
        return [...prev, copied]
      })
    },
    [user]
  )

  const getDice = useCallback(
    (id: string) => dice.find((r) => r.id === id),
    [dice]
  )

  const addHistory = useCallback(
    (id: string, item: DiceItem) => {
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const log = createResultLog(item)
          const updated = {
            ...r,
            history: [...(r.history || []), log],
            updatedAt: Date.now(),
          }
          if (user) {
            saveDiceToFirestore(user.uid, updated)
          }
          return updated
        })
      )
    },
    [user]
  )

  const clearHistory = useCallback(
    (id: string) => {
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const updated = { ...r, history: [] }
          if (user) {
            saveDiceToFirestore(user.uid, updated)
          }
          return updated
        })
      )
    },
    [user]
  )

  const setLastMode = useCallback(
    (id: string, mode: ModeId) => {
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          if (r.lastMode === mode) return r
          const updated = { ...r, lastMode: mode, updatedAt: Date.now() }
          if (user) {
            saveDiceToFirestore(user.uid, updated)
          }
          return updated
        })
      )
    },
    [user]
  )

  return (
    <DiceContext.Provider
      value={{
        dice,
        isLoaded,
        addDice,
        editDice,
        removeDice,
        copyDice,
        getDice,
        addHistory,
        clearHistory,
        setLastMode,
      }}
    >
      {children}
    </DiceContext.Provider>
  )
}

export function useDice(): DiceContextValue {
  const context = useContext(DiceContext)
  if (context === null) {
    throw new Error('useDice must be used within a DiceProvider')
  }
  return context
}
