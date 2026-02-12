import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Dice } from '../../types'
import { validateDice } from '../schema'

function diceCollection(uid: string) {
  return collection(db, 'users', uid, 'dice')
}

function diceDoc(uid: string, diceId: string) {
  return doc(db, 'users', uid, 'dice', diceId)
}

function toFirestoreData(
  dice: Dice
): Omit<Dice, 'storageState'> {
  const { storageState: _, ...data } = dice
  return data
}

export async function saveDiceToFirestore(
  uid: string,
  dice: Dice
): Promise<void> {
  const data = toFirestoreData(dice)
  const result = validateDice(data)
  if (!result.success) {
    console.error('Dice validation failed:', result.error)
    return
  }
  await setDoc(diceDoc(uid, dice.id), data)
}

export async function deleteDiceFromFirestore(
  uid: string,
  diceId: string
): Promise<void> {
  await deleteDoc(diceDoc(uid, diceId))
}

export function subscribeToDice(
  uid: string,
  onUpdate: (dice: Dice[]) => void
): Unsubscribe {
  const q = query(diceCollection(uid))
  return onSnapshot(q, (snapshot) => {
    const diceList = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          storageState: 'cloud' as const,
        }) as Dice
    )
    onUpdate(diceList)
  })
}

export async function fetchCloudDice(uid: string): Promise<Dice[]> {
  const q = query(diceCollection(uid))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        storageState: 'cloud' as const,
      }) as Dice
  )
}

export async function saveMultipleDice(
  uid: string,
  diceList: Dice[]
): Promise<void> {
  const batch = writeBatch(db)
  for (const dice of diceList) {
    batch.set(diceDoc(uid, dice.id), toFirestoreData(dice))
  }
  await batch.commit()
}
