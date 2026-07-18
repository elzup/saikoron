import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createDice,
  createResultLog,
  duplicateDice,
  updateDice,
} from '../lib/dice'
import {
  deleteDiceFromFirestore,
  saveDiceToFirestore,
  subscribeToDice,
} from '../lib/firebase/firestore'
import { syncLocalToCloud } from '../lib/firebase/sync'
import { clearDice, loadDice, saveDice } from '../lib/storage'
import type { Dice, DiceItem, ModeId, ViewSettings } from '../types'
import { useAuth } from './AuthContext'

interface DiceContextValue {
  dice: Dice[]
  isLoaded: boolean
  addDice: (
    name: string,
    items: Omit<DiceItem, 'id'>[],
    rollCount?: number
  ) => Dice
  editDice: (
    id: string,
    updates: Partial<Pick<Dice, 'name' | 'items' | 'history' | 'viewSettings'>>
  ) => void
  /** View ごとの振り方/UI 設定を (Dice×View) 単位で保存 */
  setViewSetting: <K extends keyof ViewSettings>(
    id: string,
    modeId: K,
    value: ViewSettings[K]
  ) => void
  removeDice: (id: string) => void
  copyDice: (id: string) => void
  getDice: (id: string) => Dice | undefined
  /** 単発の記録（picks 長さ1）。既存 Mode 用 */
  addHistory: (id: string, item: DiceItem, mode?: ModeId) => void
  /** 1ロール分（複数 pick）の記録。どの View で振ったかも残す */
  addRoll: (id: string, picks: DiceItem[], mode?: ModeId) => void
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

      unsubscribeRef.current = subscribeToDice(user.uid, (cloudDice) => {
        setDice(cloudDice)
        setIsLoaded(true)
      })
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
    (name: string, items: Omit<DiceItem, 'id'>[], rollCount = 1) => {
      const storageState = user ? 'cloud' : 'local'
      const newDice = {
        ...createDice(name, items, rollCount),
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

  const addRoll = useCallback(
    (id: string, picks: DiceItem[], mode?: ModeId) => {
      if (picks.length === 0) return
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const log = createResultLog(picks, mode)
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

  const addHistory = useCallback(
    (id: string, item: DiceItem, mode?: ModeId) => addRoll(id, [item], mode),
    [addRoll]
  )

  const setViewSetting = useCallback(
    <K extends keyof ViewSettings>(
      id: string,
      modeId: K,
      value: ViewSettings[K]
    ) => {
      setDice((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const updated = {
            ...r,
            viewSettings: { ...r.viewSettings, [modeId]: value },
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
        addRoll,
        setViewSetting,
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
