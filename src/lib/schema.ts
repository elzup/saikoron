import { z } from 'zod'
import {
  MAX_DICE_ITEMS,
  MAX_HISTORY_ENTRIES,
  MAX_ROLL_COUNT,
} from './constants'

export const diceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  weight: z.number().min(0),
  color: z.string().optional(),
})

const modeIdSchema = z.enum(['wheel', 'slot', 'sample', 'signage', 'dice3d'])

const rollPickSchema = z.object({
  itemId: z.string().min(1),
  label: z.string(),
})

/** 現行形式: 1ロール = 複数 pick + 合計 + どの View で振ったか */
const rollResultLogSchema = z.object({
  id: z.string().min(1),
  picks: z.array(rollPickSchema).min(1),
  sum: z.number().nullable(),
  timestamp: z.number(),
  mode: modeIdSchema.optional(),
})

/** 旧形式 { itemId, label } を現行へ変換 */
const legacyResultLogSchema = z
  .object({
    id: z.string().min(1),
    itemId: z.string().min(1),
    label: z.string(),
    timestamp: z.number(),
  })
  .transform((log) => ({
    id: log.id,
    picks: [{ itemId: log.itemId, label: log.label }],
    sum: null,
    timestamp: log.timestamp,
  }))

export const resultLogSchema = z.union([
  rollResultLogSchema,
  legacyResultLogSchema,
])

const viewSettingsSchema = z
  .object({
    dice3d: z
      .object({
        rollCount: z.number().int().min(1).max(MAX_ROLL_COUNT),
      })
      .optional(),
    sample: z
      .object({
        count: z.number().int().min(1),
        allowDuplicates: z.boolean(),
      })
      .optional(),
    signage: z
      .object({
        interval: z.number().min(1),
        displayCount: z.number().int().min(1),
        loop: z.boolean(),
      })
      .optional(),
  })
  .optional()

export const diceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  items: z.array(diceItemSchema).max(MAX_DICE_ITEMS),
  history: z.array(resultLogSchema).max(MAX_HISTORY_ENTRIES),
  lastMode: modeIdSchema.default('slot'),
  viewSettings: viewSettingsSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type DiceData = z.infer<typeof diceSchema>

export function validateDice(
  data: unknown
): { success: true; data: DiceData } | { success: false; error: string } {
  const result = diceSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
