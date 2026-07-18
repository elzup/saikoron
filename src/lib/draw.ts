import type { DiceItem } from '../types'
import { spinDice, sumOfPicks } from './dice'

/**
 * 振り方 (DrawMethod) レイヤー。
 *
 * すべての振り方は重み付き `spinDice` を土台に `RollResult` を返す。
 * これが View 内部の seam であり、表示 (render) 側はこの結果だけを受け取る。
 * @see docs/model.md
 */

export interface RollResult {
  /** 1ロールで引かれた目（単発なら1つ） */
  picks: DiceItem[]
  /** 全 pick が数値なら合計、そうでなければ null */
  sum: number | null
}

function toResult(picks: DiceItem[]): RollResult {
  return { picks, sum: sumOfPicks(picks.map((p) => p.label)) }
}

/** 復元抽出: 毎回全体から重み付きで引く（重複あり） */
export function drawWithReplacement(
  items: DiceItem[],
  count: number
): DiceItem[] {
  const picks: DiceItem[] = []
  for (let i = 0; i < count; i++) {
    const picked = spinDice(items)
    if (picked) picks.push(picked)
  }
  return picks
}

/** 非復元抽出: 引いた目をプールから除いて重み付きで引く（重複なし） */
export function drawWithoutReplacement(
  items: DiceItem[],
  count: number
): DiceItem[] {
  const pool = [...items]
  const picks: DiceItem[] = []
  const n = Math.min(count, pool.length)
  for (let i = 0; i < n; i++) {
    const picked = spinDice(pool)
    if (!picked) break
    picks.push(picked)
    pool.splice(pool.indexOf(picked), 1)
  }
  return picks
}

/** 単発: 重み付きで1個 */
export function drawSingle(items: DiceItem[]): RollResult {
  return toResult(drawWithReplacement(items, 1))
}

/** 合計 (NdX): count 個を復元抽出して合計 */
export function drawSum(items: DiceItem[], count: number): RollResult {
  return toResult(drawWithReplacement(items, Math.max(1, count)))
}

/** サンプル (おみくじ): count 個抽出。重複可否を選べる */
export function drawSample(
  items: DiceItem[],
  count: number,
  opts: { allowDuplicates?: boolean } = {}
): RollResult {
  const picks = opts.allowDuplicates
    ? drawWithReplacement(items, count)
    : drawWithoutReplacement(items, count)
  return toResult(picks)
}

/** 逐次除外 (サイネージ): 既出を除いたプールから count 個を非復元抽出 */
export function drawSequential(
  items: DiceItem[],
  count: number,
  excludedIds: ReadonlySet<string>
): RollResult {
  const pool = items.filter((item) => !excludedIds.has(item.id))
  return toResult(drawWithoutReplacement(pool, count))
}
