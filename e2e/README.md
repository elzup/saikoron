# E2Eテスト

agent-browserを使用したE2Eテストスクリプトです。

## 必要なもの

- agent-browser (`npm install -g agent-browser`)
- 開発サーバーが起動していること (`npm run dev`)

## テスト実行方法

### 1. 開発サーバーを起動

```bash
npm run dev
```

### 2. E2Eテストを実行

別のターミナルで：

```bash
npm run test:e2e
```

または直接実行：

```bash
./e2e/test-roulette-creation.sh
```

## 出力

テスト実行後、以下のファイルが生成されます：

### ビデオ録画
- `e2e/videos/roulette-creation_YYYYMMDD_HHMMSS.webm`
  - テスト全体の動画記録

### スクリーンショット
- `e2e/screenshots/YYYYMMDD_HHMMSS/`
  - `01_homepage.png` - ホームページ
  - `02_new_page.png` - 新規作成ページ
  - `03_item1_filled.png` - 項目1入力後
  - `04_item2_filled.png` - 項目2入力後
  - `05_item_added.png` - 項目追加後
  - `06_item3_filled.png` - 項目3入力後
  - `07_roulette_created.png` - ルーレット作成完了
  - `08_snapshot.txt` - 要素構造のスナップショット
  - `09_final_full.png` - 最終画面（フルページ）

## テストシナリオ: ルーレット作成フロー

1. ホームページにアクセス
2. 「新規作成」ボタンをクリック
3. 項目1に「りんご」と入力
4. 項目2に「バナナ」と入力
5. 「+ 追加」ボタンで項目を追加
6. 項目3に「オレンジ」と入力
7. 「作成」ボタンでルーレット作成
8. PlayPageに遷移することを確認

## カスタマイズ

テストスクリプトを編集して、独自のシナリオを追加できます：

```bash
# 要素をクリック
agent-browser --session "$SESSION" click "button.my-button"

# テキストを入力
agent-browser --session "$SESSION" fill "input[name='email']" "test@example.com"

# スクリーンショットを撮影
agent-browser --session "$SESSION" screenshot "path/to/screenshot.png"

# 待機
agent-browser --session "$SESSION" wait 1000  # ミリ秒
```

## トラブルシューティング

### エラー: Connection refused
開発サーバーが起動していることを確認してください。

### エラー: Element not found
要素のセレクタが変更されている可能性があります。`agent-browser snapshot -i`で要素構造を確認してください。
