import { z } from 'zod'

export const diceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  weight: z.number().min(0),
})

export const resultLogSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  label: z.string(),
  timestamp: z.number(),
})

const modeIdSchema = z.enum(['wheel', 'slot', 'sample', 'signage'])

export const diceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  items: z.array(diceItemSchema).max(500),
  history: z.array(resultLogSchema).max(10000),
  lastMode: modeIdSchema.default('slot'),
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
