/**
 * ランダムツール操作のユーティリティ
 * @see docs/random-tool-spec.md
 */

import { nanoid } from 'nanoid'
import type {
  ListSource,
  RangeSource,
  ListItem,
  DrawMode,
  DrawResult,
  ListDrawResult,
  RangeDrawResult,
  RandomTool,
  DrawingType,
} from '../types/randomTool'
import {
  isListSource,
  getCompatibleDrawings,
  getDefaultDrawing,
  getDefaultDrawMode,
} from '../types/randomTool'

// ========================================
// 抽選ロジック
// ========================================

/**
 * リストソースから重み付き抽選
 */
export function drawFromList(
  items: ListItem[],
  excludedIds: string[] = []
): ListItem | null {
  const available = items.filter((item) => !excludedIds.includes(item.id))
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return null

  const random = Math.random() * totalWeight
  let cumulative = 0

  for (const item of available) {
    cumulative += item.weight
    if (random < cumulative) {
      return item
    }
  }

  return available[available.length - 1]
}

/**
 * 範囲ソースから抽選
 */
export function drawFromRange(source: RangeSource): number {
  const { min, max, step, isInteger } = source

  if (isInteger && step === 1) {
    // 整数の場合
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // 小数または刻みがある場合
  const steps = Math.floor((max - min) / step)
  const randomStep = Math.floor(Math.random() * (steps + 1))
  const value = min + randomStep * step

  return isInteger ? Math.round(value) : Number(value.toFixed(10))
}

/**
 * 複数回抽選（リストソース用）
 */
export function drawMultipleFromList(
  items: ListItem[],
  count: number,
  excludedIds: string[] = [],
  allowDuplicates: boolean = false,
  excludeAfterDraw: boolean = false
): { results: ListItem[]; newExcludedIds: string[] } {
  const results: ListItem[] = []
  const tempExcluded = [...excludedIds]

  for (let i = 0; i < count; i++) {
    const result = drawFromList(items, tempExcluded)
    if (!result) break

    results.push(result)

    if (!allowDuplicates || excludeAfterDraw) {
      tempExcluded.push(result.id)
    }
  }

  return {
    results,
    newExcludedIds: excludeAfterDraw ? tempExcluded : excludedIds,
  }
}

/**
 * 複数回抽選（範囲ソース用）
 */
export function drawMultipleFromRange(
  source: RangeSource,
  count: number,
  allowDuplicates: boolean = true
): number[] {
  const results: number[] = []

  if (allowDuplicates) {
    for (let i = 0; i < count; i++) {
      results.push(drawFromRange(source))
    }
  } else {
    // 重複なしの場合、候補数が十分か確認
    const totalCandidates =
      Math.floor((source.max - source.min) / source.step) + 1
    const targetCount = Math.min(count, totalCandidates)
    const drawn = new Set<number>()

    while (results.length < targetCount) {
      const value = drawFromRange(source)
      if (!drawn.has(value)) {
        drawn.add(value)
        results.push(value)
      }
    }
  }

  return results
}

// ========================================
// ランダムツールの操作
// ========================================

/**
 * ランダムツールを実行
 */
export function executeRandomTool(
  tool: RandomTool
): { result: DrawResult; updatedTool: RandomTool } {
  const { source, drawMode, excludedIds } = tool
  const timestamp = Date.now()

  if (isListSource(source)) {
    const { results, newExcludedIds } = drawMultipleFromList(
      source.items,
      drawMode.count,
      excludedIds,
      drawMode.allowDuplicates,
      drawMode.excludeAfterDraw
    )

    const result: ListDrawResult = {
      type: 'list',
      items: results,
      timestamp,
    }

    return {
      result,
      updatedTool: {
        ...tool,
        excludedIds: newExcludedIds,
        history: [...tool.history, result],
        updatedAt: timestamp,
      },
    }
  } else {
    const values = drawMultipleFromRange(
      source,
      drawMode.count,
      drawMode.allowDuplicates
    )

    const result: RangeDrawResult = {
      type: 'range',
      values,
      timestamp,
    }

    return {
      result,
      updatedTool: {
        ...tool,
        history: [...tool.history, result],
        updatedAt: timestamp,
      },
    }
  }
}

// ========================================
// ファクトリ関数
// ========================================

/**
 * リストソースのランダムツールを作成
 */
export function createListRandomTool(
  name: string,
  items: Omit<ListItem, 'id'>[]
): RandomTool {
  const now = Date.now()
  const source: ListSource = {
    type: 'list',
    items: items.map((item) => ({
      id: nanoid(),
      label: item.label,
      weight: item.weight ?? 1,
    })),
  }

  return {
    id: nanoid(),
    name,
    source,
    compatibleDrawings: getCompatibleDrawings(source),
    currentDrawing: getDefaultDrawing(source),
    drawMode: getDefaultDrawMode(),
    excludedIds: [],
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 範囲ソースのランダムツールを作成
 */
export function createRangeRandomTool(
  name: string,
  min: number,
  max: number,
  options: { step?: number; isInteger?: boolean } = {}
): RandomTool {
  const now = Date.now()
  const source: RangeSource = {
    type: 'range',
    min,
    max,
    step: options.step ?? 1,
    isInteger: options.isInteger ?? true,
  }

  return {
    id: nanoid(),
    name,
    source,
    compatibleDrawings: getCompatibleDrawings(source),
    currentDrawing: getDefaultDrawing(source),
    drawMode: getDefaultDrawMode(),
    excludedIds: [],
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * ランダムツールの描画タイプを変更
 */
export function changeDrawingType(
  tool: RandomTool,
  drawing: DrawingType
): RandomTool {
  if (!tool.compatibleDrawings.includes(drawing)) {
    console.warn(`Drawing type "${drawing}" is not compatible with this tool`)
    return tool
  }

  return {
    ...tool,
    currentDrawing: drawing,
    updatedAt: Date.now(),
  }
}

/**
 * ランダムツールのDrawModeを変更
 */
export function changeDrawMode(
  tool: RandomTool,
  updates: Partial<DrawMode>
): RandomTool {
  return {
    ...tool,
    drawMode: { ...tool.drawMode, ...updates },
    updatedAt: Date.now(),
  }
}

/**
 * 除外をリセット
 */
export function resetExclusions(tool: RandomTool): RandomTool {
  return {
    ...tool,
    excludedIds: [],
    updatedAt: Date.now(),
  }
}

/**
 * 履歴をクリア
 */
export function clearHistory(tool: RandomTool): RandomTool {
  return {
    ...tool,
    history: [],
    updatedAt: Date.now(),
  }
}

// ========================================
// 既存Rouletteとの変換
// ========================================

import type { Roulette, RouletteItem, ResultLog } from '../types'

/**
 * 既存のRouletteをRandomToolに変換
 */
export function rouletteToRandomTool(roulette: Roulette): RandomTool {
  const source: ListSource = {
    type: 'list',
    items: roulette.items.map((item) => ({
      id: item.id,
      label: item.label,
      weight: item.weight,
    })),
  }

  const history: DrawResult[] = roulette.history.map((log) => ({
    type: 'list' as const,
    items: [
      {
        id: log.itemId,
        label: log.label,
        weight: 1,
      },
    ],
    timestamp: log.timestamp,
  }))

  return {
    id: roulette.id,
    name: roulette.name,
    source,
    compatibleDrawings: getCompatibleDrawings(source),
    currentDrawing: getDefaultDrawing(source),
    drawMode: getDefaultDrawMode(),
    excludedIds: [],
    history,
    createdAt: roulette.createdAt,
    updatedAt: roulette.updatedAt,
  }
}

/**
 * RandomToolを既存のRoulette形式に変換（後方互換性）
 */
export function randomToolToRoulette(tool: RandomTool): Roulette | null {
  if (!isListSource(tool.source)) {
    return null // 範囲ソースはRoulette形式に変換不可
  }

  const items: RouletteItem[] = tool.source.items.map((item) => ({
    id: item.id,
    label: item.label,
    weight: item.weight,
  }))

  const history: ResultLog[] = tool.history
    .filter((h): h is ListDrawResult => h.type === 'list')
    .flatMap((h) =>
      h.items.map((item) => ({
        id: nanoid(),
        itemId: item.id,
        label: item.label,
        timestamp: h.timestamp,
      }))
    )

  return {
    id: tool.id,
    name: tool.name,
    items,
    history,
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
  }
}
