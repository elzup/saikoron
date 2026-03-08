# ランダムツール仕様書

## 概要

ランダム選択ツールを「データ (Dice)」と「表示モード (Mode)」に分離して管理する。

- **Dice** — 抽選対象の項目リスト。作成・編集・削除・複製ができる
- **Mode** — Dice の表示・抽選方法。Dice の属性（項目数など）によって利用可能な Mode が決まる

## データモデル

### Dice

1組の抽選リスト。項目・重み・履歴を持つ。

```typescript
type ModeId = 'wheel' | 'slot' | 'sample' | 'signage'

interface Dice {
  id: string
  name: string
  items: DiceItem[]
  history: ResultLog[]
  lastMode: ModeId          // 最後に使った Mode（デフォルト: 'slot'）
  createdAt: number
  updatedAt: number
  storageState: 'local' | 'cloud'
}

interface DiceItem {
  id: string
  label: string
  weight: number
}

interface ResultLog {
  id: string
  itemId: string
  label: string
  timestamp: number
}
```

### ストレージ

| 状態 | 保存先 | 切り替え |
|------|--------|----------|
| 未ログイン | localStorage | 自動 |
| ログイン済 | Firestore `users/{uid}/dice/{diceId}` | 自動 |

Firestore の named database (`VITE_FIRESTORE_DATABASE_ID`) で dev / prod を分離。

## Mode

1つの Dice データに対して複数の Mode を独立ページとして提供する。
Dice の属性によって利用可能な Mode が自動的に決まる。

### Mode 一覧

| Mode | パス | 説明 | 項目数制限 |
|------|------|------|------------|
| Wheel | `/dice/:id/wheel` | ルーレットホイール。円形ホイールを回転させて抽選 | **100 以下** |
| Slot | `/dice/:id/slot` | スロットマシン。スロット演出で1つ抽選 | なし |
| Sample | `/dice/:id/sample` | おみくじ。N個を一度に抽出（重複あり/なし選択可） | なし |
| Signage | `/dice/:id/signage` | サイネージ。一定間隔で自動的に項目を切り替え表示 | なし |

### Mode の有効条件

DicePage の Mode 選択画面では、条件を満たさない Mode はグレーアウトして無効にする。

```typescript
function getAvailableModes(dice: Dice): ModeConfig[] {
  return [
    { id: 'wheel',   enabled: dice.items.length <= 100 },
    { id: 'slot',    enabled: true },
    { id: 'sample',  enabled: true },
    { id: 'signage', enabled: true },
  ]
}
```

### 各 Mode の仕様

#### Wheel（ルーレット）
- 円形ホイールに項目を扇形で配置
- クリックまたはボタンで回転、減速して停止
- 重みに応じて扇形のサイズが変わる
- 結果は履歴に記録

#### Slot（スロット）
- スロットマシン風の3行表示（前・現在・次）
- ボタンで開始、高速回転 → 減速 → 停止
- 結果は履歴に記録

#### Sample（おみくじ）
- 設定: 抽出数（N）、重複あり/なし
- ボタンで N 個を一度に抽選
- 結果をリスト表示
- 履歴には記録しない（一括抽出のため）

#### Signage（サイネージ）
- 一定間隔（デフォルト 5 秒）でランダムに項目を切り替え表示
- フェードインアニメーション
- クリックで一時停止/再開
- 全画面表示に適したレイアウト
- 履歴には記録しない

### lastMode（最後に使った Mode）

- Dice ごとに `lastMode` を記録する
- サイドバーで Dice をクリックすると `/dice/:id/:lastMode` に直接遷移する
- Mode ページ遷移時に `lastMode` を自動更新する
- デフォルト値: `'slot'`
- `lastMode` が有効条件を満たさない場合（例: 項目数 > 100 で wheel）、最初の有効な Mode にフォールバック

### 共通構造

全 Mode は `ModeLayout` を共有する:
- ヘッダー: Dice 名 + Mode 切り替え（他の Mode へのリンク）
- メイン: Mode 固有のコンテンツ
- Mode 切り替え時に `lastMode` を更新

## ページ構成

### ルーティング

```
/                      → HomePage      Dice 一覧
/new                   → NewPage       Dice 新規作成
/dice/:id              → DicePage      Dice 編集・管理
/dice/:id/wheel        → WheelMode
/dice/:id/slot         → SlotMode
/dice/:id/sample       → SampleMode
/dice/:id/signage      → SignageMode
/random-number         → RandomNumberPage  ランダム数字ツール
/list-draw             → ListDrawPage      リスト抽選ツール
```

### ナビゲーションの流れ

```
サイドバー Dice クリック → /dice/:id/:lastMode（最後に使った Mode）
Mode ヘッダーで切り替え → /dice/:id/:newMode（lastMode 更新）
Mode ヘッダーで編集     → /dice/:id（DicePage）
新規作成               → /new（NewPage）
```

### DicePage (`/dice/:id`)

Dice の管理・編集ページ。以下のセクションで構成される:

1. **項目一覧** — 項目名・重み・確率のプレビュー
2. **履歴** — 直近 20 件の抽選結果
3. **編集** — リスト編集 / テキスト一括編集の切り替え可能

※ Mode 選択はここではなく、各 Mode ページのヘッダーで切り替える。
サイドバーから Dice をクリックすると `lastMode` の Mode ページに直接遷移する。

## ファイル構成

```
src/
├── types/
│   └── index.ts              # Dice, DiceItem, ResultLog
├── lib/
│   ├── dice.ts               # 抽選ロジック、ユーティリティ
│   └── firebase/
│       ├── config.ts          # Firebase 初期化
│       ├── auth.ts            # Google 認証
│       ├── firestore.ts       # Firestore CRUD
│       └── sync.ts            # ローカル ↔ クラウド同期
├── contexts/
│   ├── AuthContext.tsx         # 認証状態管理
│   └── DiceContext.tsx         # Dice 状態管理
├── hooks/
│   ├── useDice.ts             # Dice 操作フック
│   └── useAutoSpin.ts         # 自動スピンフック
├── components/
│   ├── Layout.tsx             # サイドバー + メインレイアウト
│   ├── RouletteWheel.tsx      # ホイールコンポーネント
│   ├── SlotRoulette.tsx       # スロットコンポーネント
│   ├── DiceList.tsx           # Dice 一覧コンポーネント
│   └── LoginButton.tsx        # ログインボタン
├── pages/
│   ├── HomePage.tsx           # Dice 一覧ページ
│   ├── NewPage.tsx            # Dice 新規作成
│   ├── DicePage.tsx           # Dice 管理 + Mode 選択
│   ├── RandomNumberPage.tsx   # ランダム数字ツール
│   ├── ListDrawPage.tsx       # リスト抽選ツール
│   └── modes/
│       ├── ModeLayout.tsx     # Mode 共通レイアウト
│       ├── WheelMode.tsx
│       ├── SlotMode.tsx
│       ├── SampleMode.tsx
│       └── SignageMode.tsx
└── index.css                  # テーマ変数定義
```
