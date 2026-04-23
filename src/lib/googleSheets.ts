import { createDiceItem } from './dice'
import { MAX_DICE_ITEMS } from './constants'
import type { DiceItem } from '../types'

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export interface SpreadsheetImportResult {
  title: string
  sheetTitle: string
  items: DiceItem[]
}

interface SpreadsheetReference {
  spreadsheetId: string
  gid?: string
}

interface SpreadsheetMetadata {
  properties?: {
    title?: string
  }
  sheets?: Array<{
    properties?: {
      sheetId?: number
      title?: string
    }
  }>
}

type SheetValuesResponse = {
  values?: string[][]
}

export function parseSpreadsheetReference(input: string): SpreadsheetReference {
  const value = input.trim()
  if (!value) {
    throw new Error('スプレッドシートURLを入力してください')
  }

  const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (urlMatch) {
    const url = new URL(value)
    const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? undefined
    return { spreadsheetId: urlMatch[1], gid }
  }

  if (/^[a-zA-Z0-9-_]+$/.test(value)) {
    return { spreadsheetId: value }
  }

  throw new Error('スプレッドシートURLまたはIDの形式が不正です')
}

function escapeSheetTitle(title: string): string {
  return `'${title.replaceAll("'", "''")}'`
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Google Sheets の読込に失敗しました')
  }

  return response.json() as Promise<T>
}

function resolveSheetTitle(metadata: SpreadsheetMetadata, gid?: string): string {
  const sheets = metadata.sheets ?? []
  if (sheets.length === 0) {
    throw new Error('シートが見つかりません')
  }

  if (!gid) {
    return sheets[0].properties?.title ?? 'Sheet1'
  }

  const target = sheets.find(
    (sheet) => String(sheet.properties?.sheetId) === gid
  )
  if (!target?.properties?.title) {
    throw new Error('指定されたシートタブが見つかりません')
  }
  return target.properties.title
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase()
}

function parseWeight(rawValue: string | undefined, rowNumber: number): number {
  if (!rawValue || !rawValue.trim()) return 1
  const weight = Number(rawValue)
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new Error(`${rowNumber}行目の rate は 0 より大きい数値で指定してください`)
  }
  return weight
}

function parseColor(rawValue: string | undefined, rowNumber: number): string | undefined {
  const color = rawValue?.trim()
  if (!color) return undefined
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) {
    return color
  }
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(color)) {
    return color
  }
  throw new Error(`${rowNumber}行目の color は CSS color 形式で指定してください`)
}

function rowsToDiceItems(rows: string[][]): DiceItem[] {
  if (rows.length === 0) {
    throw new Error('シートにデータがありません')
  }

  const [header, ...body] = rows
  const headerMap = new Map(header.map((cell, index) => [normalizeHeader(cell), index]))
  const nameIndex = headerMap.get('name')
  const rateIndex = headerMap.get('rate')
  const colorIndex = headerMap.get('color')

  if (nameIndex === undefined) {
    throw new Error('ヘッダーに name 列が必要です')
  }

  const items = body
    .map((row, bodyIndex) => {
      const rowNumber = bodyIndex + 2
      const label = row[nameIndex]?.trim() ?? ''
      if (!label) return null

      return createDiceItem(
        label,
        parseWeight(rateIndex !== undefined ? row[rateIndex] : undefined, rowNumber),
        parseColor(colorIndex !== undefined ? row[colorIndex] : undefined, rowNumber)
      )
    })
    .filter((item): item is DiceItem => item !== null)

  if (items.length < 2) {
    throw new Error('有効な項目が2件以上必要です')
  }
  if (items.length > MAX_DICE_ITEMS) {
    throw new Error(`項目数が上限を超えています (${MAX_DICE_ITEMS})`)
  }

  return items
}

export async function importDiceItemsFromSpreadsheet(
  input: string,
  accessToken: string
): Promise<SpreadsheetImportResult> {
  const { spreadsheetId, gid } = parseSpreadsheetReference(input)
  const metadata = await fetchJson<SpreadsheetMetadata>(
    `${SHEETS_API_BASE}/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`,
    accessToken
  )
  const sheetTitle = resolveSheetTitle(metadata, gid)
  const values = await fetchJson<SheetValuesResponse>(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(`${escapeSheetTitle(sheetTitle)}!A:Z`)}`,
    accessToken
  )

  return {
    title: metadata.properties?.title?.trim() || 'Google Sheets',
    sheetTitle,
    items: rowsToDiceItems(values.values ?? []),
  }
}
