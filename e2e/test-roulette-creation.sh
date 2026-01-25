#!/bin/bash
# E2Eテスト: ルーレット作成フロー
# スクリーンショットとビデオで各ステップを記録

set -e

SESSION="roulette-creation-test"
BASE_URL="http://localhost:5173"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VIDEO_PATH="e2e/videos/roulette-creation_${TIMESTAMP}.webm"
SCREENSHOT_DIR="e2e/screenshots/${TIMESTAMP}"

mkdir -p "$SCREENSHOT_DIR"

echo "🎬 E2Eテスト開始: ルーレット作成フロー"
echo "セッション: $SESSION"
echo "ビデオ: $VIDEO_PATH"
echo "スクリーンショット: $SCREENSHOT_DIR/"
echo ""

# ビデオ録画を開始
echo "📹 ビデオ録画開始..."
agent-browser --session "$SESSION" record start "$VIDEO_PATH" "$BASE_URL"

echo ""
echo "=== ステップ1: ホームページにアクセス ==="
agent-browser --session "$SESSION" open "$BASE_URL"
agent-browser --session "$SESSION" wait 1000
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/01_homepage.png"
echo "✅ スクリーンショット保存: 01_homepage.png"

echo ""
echo "=== ステップ2: 新規作成ページへ移動 ==="
agent-browser --session "$SESSION" click "a[href='/new']"
agent-browser --session "$SESSION" wait 1000
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/02_new_page.png"
echo "✅ スクリーンショット保存: 02_new_page.png"

echo ""
echo "=== ステップ3: 項目1を入力 ==="
agent-browser --session "$SESSION" fill "input[placeholder='項目1']" "りんご"
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/03_item1_filled.png"
echo "✅ スクリーンショット保存: 03_item1_filled.png"

echo ""
echo "=== ステップ4: 項目2を入力 ==="
agent-browser --session "$SESSION" fill "input[placeholder='項目2']" "バナナ"
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/04_item2_filled.png"
echo "✅ スクリーンショット保存: 04_item2_filled.png"

echo ""
echo "=== ステップ5: 項目を追加 ==="
agent-browser --session "$SESSION" click "button.add-button"
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/05_item_added.png"
echo "✅ スクリーンショット保存: 05_item_added.png"

echo ""
echo "=== ステップ6: 項目3を入力 ==="
agent-browser --session "$SESSION" fill "input[placeholder='項目3']" "オレンジ"
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/06_item3_filled.png"
echo "✅ スクリーンショット保存: 06_item3_filled.png"

echo ""
echo "=== ステップ7: ルーレットを作成 ==="
agent-browser --session "$SESSION" click "button.create-button"
agent-browser --session "$SESSION" wait 2000
agent-browser --session "$SESSION" screenshot "$SCREENSHOT_DIR/07_roulette_created.png"
echo "✅ スクリーンショット保存: 07_roulette_created.png"

echo ""
echo "=== ステップ8: ルーレットの構造を確認 ==="
agent-browser --session "$SESSION" snapshot -i > "$SCREENSHOT_DIR/08_snapshot.txt"
echo "✅ スナップショット保存: 08_snapshot.txt"

echo ""
echo "=== ステップ9: 最終画面 ==="
agent-browser --session "$SESSION" screenshot --full "$SCREENSHOT_DIR/09_final_full.png"
echo "✅ フルページスクリーンショット保存: 09_final_full.png"

# ビデオ録画を停止
echo ""
echo "⏹️  ビデオ録画停止..."
agent-browser --session "$SESSION" record stop

echo ""
echo "✨ E2Eテスト完了!"
echo "📁 結果:"
echo "   ビデオ: $VIDEO_PATH"
echo "   スクリーンショット: $SCREENSHOT_DIR/"
echo ""

# ブラウザを閉じる
agent-browser --session "$SESSION" close

echo "🎉 テスト正常終了"
