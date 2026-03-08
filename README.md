# Saikoron

カスタムダイス（抽選リスト）を作成し、複数の View で表示・抽選できる PWA アプリ。

## 機能

### Dice（データ）
- Dice の作成・編集・削除・複製
- 重み付き項目
- 抽選履歴の記録
- LocalStorage / Firestore 永続化
- Google 認証によるクラウド同期

### Mode（表示モード）
1つの Dice に対して、複数の Mode を独立したページで利用可能。
Dice の属性（項目数など）によって利用可能な Mode が自動で決まる。

| Mode | パス | 説明 | 項目数制限 |
|------|------|------|------------|
| Wheel | `/dice/:id/wheel` | ルーレットホイール | 100 以下 |
| Slot | `/dice/:id/slot` | スロットマシン | なし |
| Sample | `/dice/:id/sample` | おみくじ（N個抽出） | なし |
| Signage | `/dice/:id/signage` | サイネージ自動表示 | なし |

### ツール
- ランダム数字 (`/random-number`)
- リスト抽選機 (`/list-draw`)

## 設計

```
Dice（データ管理）         Mode（表示モード）
┌──────────────────┐      ┌──────────────────┐
│ /dice/:id        │─────→│ /dice/:id/wheel  │
│  - 項目編集      │      │ /dice/:id/slot   │
│  - 履歴確認      │      │ /dice/:id/sample │
│  - Mode 選択     │      │ /dice/:id/signage│
└──────────────────┘      └──────────────────┘
```

### ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/random-tool-spec.md](docs/random-tool-spec.md) | データモデル・View 仕様・ルーティング・ファイル構成 |
| [e2e/README.md](e2e/README.md) | E2E テストの実行方法 |

### テーマ
CSS custom properties で一元管理（`src/index.css` の `:root`）。
カジノ / VIP 風ダークテーマ（黒 + ゴールド）。

## 開発

```bash
npm install
npm run dev       # 開発サーバー (Vite)
npm run test      # テスト (Vitest)
npm run build     # ビルド
npm run deploy    # Firebase へデプロイ
```

### 環境変数

`.env.example` をコピーして `.env` を作成し、Firebase の値を設定。

```bash
cp .env.example .env
```

`VITE_FIRESTORE_DATABASE_ID` で dev / prod の Firestore DB を切り替え可能。

## 技術スタック

- React + TypeScript
- Vite
- React Router
- Firebase (Auth, Firestore, Hosting)
- vite-plugin-pwa
- Vitest
