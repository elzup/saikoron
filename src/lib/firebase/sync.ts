import type { Dice } from '../../types'
import { fetchCloudDice, saveMultipleDice } from './firestore'

/**
 * ログイン時にローカルのダイスを Firestore にマージする。
 * 同じ id のダイスは updatedAt が新しい方を採用 (last-write-wins)。
 */
export async function syncLocalToCloud(
  uid: string,
  localDice: Dice[]
): Promise<void> {
  if (localDice.length === 0) return

  const cloudDice = await fetchCloudDice(uid)
  const cloudMap = new Map(cloudDice.map((r) => [r.id, r]))

  const toUpload: Dice[] = []
  for (const local of localDice) {
    const cloud = cloudMap.get(local.id)
    if (!cloud || local.updatedAt > cloud.updatedAt) {
      toUpload.push(local)
    }
  }

  if (toUpload.length > 0) {
    await saveMultipleDice(uid, toUpload)
  }
}
