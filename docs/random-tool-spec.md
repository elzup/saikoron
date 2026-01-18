# ランダムツール抽象化仕様書

## 概要

サイコロ/ルーレット/抽選などのランダム選択ツールを統一的に扱うための型システム。

## コア概念

### 1. ソースタイプ (Source Type)
候補の生成方法を定義する。

| タイプ | 説明 | 例 |
|--------|------|-----|
| `list` | 明示的なリスト | ["寿司", "ラーメン", "カレー"] |
| `range` | 数値範囲 | 1〜100, 0.0〜1.0 |

#### リストソース (ListSource)
```typescript
interface ListSource {
  type: 'list'
  items: {
    id: string
    label: string
    weight: number  // 重み（確率調整）
  }[]
}
```

#### 範囲ソース (RangeSource)
```typescript
interface RangeSource {
  type: 'range'
  min: number
  max: number
  step: number      // 刻み (1=整数, 0.1=小数1桁)
  isInteger: boolean
}
```

### 2. 描画タイプ (Drawing Type)
結果の視覚化方法を定義する。

| タイプ | 説明 | 適用条件 |
|--------|------|----------|
| `wheel` | ルーレットホイール | 候補数 ≤ 20 |
| `slot` | スロットマシン風 | 候補数 ≤ 50 |
| `simple` | シンプル表示 | 制限なし |
| `cards` | カード風 | 候補数 ≤ 100 |

### 3. 引き方 (Draw Mode)
選択方法を定義する。

```typescript
interface DrawMode {
  count: number           // 一度に引く数
  excludeAfterDraw: boolean  // 引いた後に除外
  allowDuplicates: boolean   // 重複を許可（count > 1の場合）
}
```

## 互換性マトリクス

### ソースタイプ × 描画タイプ

| ソース | wheel | slot | simple | cards |
|--------|-------|------|--------|-------|
| list (≤20) | ✅ | ✅ | ✅ | ✅ |
| list (≤50) | ⚠️ | ✅ | ✅ | ✅ |
| list (>50) | ❌ | ⚠️ | ✅ | ✅ |
| range (小) | ⚠️ | ✅ | ✅ | ❌ |
| range (大) | ❌ | ❌ | ✅ | ❌ |

- ✅ 推奨
- ⚠️ 可能だが非推奨
- ❌ 非対応

### 候補数の閾値

```typescript
const THRESHOLDS = {
  WHEEL_MAX: 20,      // ホイール表示の最大候補数
  SLOT_MAX: 50,       // スロット表示の最大候補数
  CARDS_MAX: 100,     // カード表示の最大候補数
  LARGE_RANGE: 1000,  // 「大きい範囲」の閾値
}
```

## 統合型定義

```typescript
interface RandomTool {
  id: string
  name: string
  source: ListSource | RangeSource

  // 描画設定
  compatibleDrawings: DrawingType[]  // 利用可能な描画タイプ
  currentDrawing: DrawingType        // 現在の描画タイプ

  // 引き方設定
  drawMode: DrawMode

  // 除外中の項目（リストソースの場合のみ）
  excludedIds?: string[]

  // 履歴
  history: ResultLog[]

  // メタデータ
  createdAt: number
  updatedAt: number
}
```

## ユースケース

### 1. 食事ルーレット（従来のルーレット）
```typescript
{
  source: { type: 'list', items: [...] },
  compatibleDrawings: ['wheel', 'slot', 'simple'],
  currentDrawing: 'wheel',
  drawMode: { count: 1, excludeAfterDraw: false, allowDuplicates: false }
}
```

### 2. サイコロ（1〜6）
```typescript
{
  source: { type: 'range', min: 1, max: 6, step: 1, isInteger: true },
  compatibleDrawings: ['wheel', 'slot', 'simple'],
  currentDrawing: 'slot',
  drawMode: { count: 1, excludeAfterDraw: false, allowDuplicates: true }
}
```

### 3. 宝くじ番号（1〜45から6つ）
```typescript
{
  source: { type: 'range', min: 1, max: 45, step: 1, isInteger: true },
  compatibleDrawings: ['slot', 'simple'],
  currentDrawing: 'simple',
  drawMode: { count: 6, excludeAfterDraw: true, allowDuplicates: false }
}
```

### 4. 乱数生成（0.0〜1.0）
```typescript
{
  source: { type: 'range', min: 0, max: 1, step: 0.01, isInteger: false },
  compatibleDrawings: ['simple'],
  currentDrawing: 'simple',
  drawMode: { count: 1, excludeAfterDraw: false, allowDuplicates: true }
}
```

### 5. 席替え（クラス30人）
```typescript
{
  source: { type: 'list', items: [生徒30人] },
  compatibleDrawings: ['slot', 'simple', 'cards'],
  currentDrawing: 'cards',
  drawMode: { count: 30, excludeAfterDraw: true, allowDuplicates: false }
}
```

## 実装計画

### Phase 1: 型定義 ✅
- [x] 基本型の定義 (`src/types/randomTool.ts`)
- [x] ユーティリティ型関数

### Phase 2: ロジック ✅
- [x] 互換性判定関数 (`getCompatibleDrawings`)
- [x] 抽選実行関数 (`executeRandomTool`)
- [x] ソースから候補生成 (`drawFromList`, `drawFromRange`)
- [x] 複数抽選 (`drawMultipleFromList`, `drawMultipleFromRange`)
- [x] 既存Rouletteとの変換 (`rouletteToRandomTool`, `randomToolToRoulette`)

### Phase 3: UI
- [ ] 描画コンポーネント抽象化
- [ ] ソース設定UI
- [ ] DrawMode設定UI

### Phase 4: 移行
- [ ] 既存Rouletteの移行
- [ ] RandomNumberPageの統合

## ファイル構成

```
src/
├── types/
│   ├── index.ts          # 既存の型（Roulette等）
│   └── randomTool.ts     # 新しい抽象型
├── lib/
│   ├── roulette.ts       # 既存のルーレット操作
│   ├── randomTool.ts     # 新しい抽象操作
│   └── randomTool.test.ts
└── docs/
    └── random-tool-spec.md  # この文書
```

## 変更履歴

- 2025-01-18: Phase 1, 2 完了 - 型定義とロジック実装
