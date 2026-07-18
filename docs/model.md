# コアモデル: Dice → View（振り方 + 表示）

このアプリのコアは、ランダム機能を軸に分離して管理すること。
最上位は **2 軸**、View の内部にもう 1 段の分離がある。

```
┌── Dice (データ) ──┐        ┌────────── View (体験) ──────────┐
│  何を引くか        │  ───→  │  振り方 (draw) ──RollResult──▶ 表示 (render) │
│  items / weight    │        │  count/合計/重複/除外           wheel/slot/3D… │
│  range             │        └───────────────────────────────────────────────┘
└────────────────────┘
      ↑ 安定 identity              ↑ 振り方は View の一部。ただし内部に seam を持つ
```

- **Dice（データ）** … 何を引くか。項目・重み・range。**View を変えても不変**であるべき。
- **View（体験）** … 1 つの Dice の「遊び方」。**振り方（どう引くか）と 表示（どう見せるか）
  を束ねた単位**。振り方は View に属する（3D ダイス View は本質的に「合計」、おみくじ View
  は「サンプル」を含む）。
- **接合面 `RollResult`** … View の内部で、振り方（draw）と表示（render）を分ける seam。
  振り方は `RollResult` を出し、表示はそれを受け取って描画する。

```ts
// lib/dice.ts — View 内部の seam
interface RollResult {
  picks: DiceItem[]   // 1回のロールで引かれた目（単発なら1つ）
  sum: number | null  // 全 pick が数値なら合計
}
```

## なぜ 3 軸ではなく「View の一部」なのか

「振り方」を Dice / View と完全に独立した第 3 軸にすると、
「2D6 の合計を wheel で」「サンプル 3 を slot で」など全組み合わせを扱う必要が出て過剰。
実際には **View ごとに相性の良い振り方はほぼ決まっている**（3D＝合計、おみくじ＝サンプル、
サイネージ＝逐次除外）。よって振り方は View の内部レイヤーとして持ち、
**View 内で draw / render を `RollResult` で分離**すれば十分に柔軟。

## 守るべき不変条件（ここが「正しく分離できているか」の判定基準）

| # | 不変条件 | 現状 | 対応 |
|---|----------|------|------|
| 1 | **Dice はデータのみ**を持つ（振り方・UI 設定を持たない） | ✓ `rollCount` を `viewSettings` へ移設。`lastMode` は「最後に開いた View」ポインタとして許容 | 完了 |
| 2 | 振り方の設定は **View が (Dice×View) 単位で保持・永続**（揮発しない） | ✓ `Dice.viewSettings[modeId]` に永続化（dice3d/sample/signage） | 完了 |
| 3 | 抽選は必ず **重み付き `spinDice` → `RollResult`** で統一 | ✓ 全 View が `lib/draw.ts` に統一済み | 完了 |
| 4 | 履歴の表現は **1 つ** | ✗ `Dice.history: ResultLog[]` と `RandomTool.history: DrawResult[]` の二重 | 一本化（未） |

## 各 View の振り方（現状）

| View | 振り方 | draw 実装 | 振り方パラメータの置き場所 |
|------|--------|-----------|-----------------------------|
| slot | 単発 | `spinDice`（重み付きプリミティブ） | なし（固定） |
| wheel | 単発 | `spinDice`（重み付きプリミティブ） | なし（固定） |
| sample | サンプル N（非復元） | `drawSample` | `viewSettings.sample` |
| signage | 逐次除外＋ループ | `drawSample`（既出は View 管理） | `viewSettings.signage` |
| dice3d | 合計 (NdX) | `drawSum` | `viewSettings.dice3d` |

## 目標（段階移行・後方互換）

1. ~~**draw を純関数化** `lib/draw.ts`~~ **✓ 完了**（不変条件 3 を解消）。
2. ~~**振り方設定を View-state として (Dice×View) で永続化**（`Dice.viewSettings[modeId]`）。
   `rollCount` も Dice 本体から剥がす。~~ **✓ 完了**（不変条件 1・2 を解消）。
3. **View を「draw → render」構成に統一**。各 View は
   `RollResult = 振り方(dice, params)` を呼び、結果を描画するだけにする。（一部のみ）
4. 履歴表現を一本化（`ResultLog` に寄せる）。→ 不変条件 4。（未）

> 参考: 旧 2 層仕様 `docs/random-tool-spec.md`（Dice + Mode のみ）。
> `types/randomTool.ts` に `DrawMode {count, excludeAfterDraw, allowDuplicates}` の
> 振り方型が既にあるが未使用 — 上記 2 で再利用できる。
> アプリ内のライブ点検は `/debug/model`。
