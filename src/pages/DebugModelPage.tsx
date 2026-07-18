import { Link } from 'react-router-dom'
import { MODES } from '../lib/constants'
import './DebugModelPage.css'

interface Invariant {
  title: string
  rule: string
  ok: boolean
  detail: string
}

const INVARIANTS: Invariant[] = [
  {
    title: 'Dice はデータのみ',
    rule: '振り方・UI 設定を Dice 本体に持たない',
    ok: true,
    detail:
      'rollCount を viewSettings へ移設済み。lastMode は最後に開いた View のポインタとして許容',
  },
  {
    title: '振り方設定は永続',
    rule: 'View が (Dice×View) 単位で保持し揮発しない',
    ok: true,
    detail: 'dice3d / sample / signage を Dice.viewSettings[modeId] に永続化',
  },
  {
    title: '抽選は spinDice 統一',
    rule: '重み付き spinDice → RollResult に統一',
    ok: true,
    detail: '全 View が lib/draw.ts の重み付き抽選に統一済み',
  },
  {
    title: '履歴は 1 表現',
    rule: '履歴の型を一本化',
    ok: false,
    detail: 'Dice.history と RandomTool.history が二重',
  },
]

interface ViewRow {
  view: string
  method: string
  paramLoc: 'なし' | 'state（揮発）' | 'viewSettings' | 'Dice（漏れ）'
  bad: boolean
}

const VIEW_ROWS: ViewRow[] = [
  { view: 'slot', method: '単発 (spinDice)', paramLoc: 'なし', bad: false },
  { view: 'wheel', method: '単発 (spinDice)', paramLoc: 'なし', bad: false },
  {
    view: 'sample',
    method: 'サンプル N（drawSample）',
    paramLoc: 'viewSettings',
    bad: false,
  },
  {
    view: 'signage',
    method: '逐次除外＋ループ',
    paramLoc: 'viewSettings',
    bad: false,
  },
  {
    view: 'dice3d',
    method: '合計 (drawSum)',
    paramLoc: 'viewSettings',
    bad: false,
  },
]

function paramClass(loc: ViewRow['paramLoc']): string {
  if (loc === 'なし') return 'param-none'
  if (loc.startsWith('state')) return 'param-state'
  if (loc === 'viewSettings') return 'param-ok'
  return 'param-data'
}

export function DebugModelPage() {
  return (
    <div className='debug-model'>
      <header className='debug-header'>
        <div>
          <p className='debug-eyebrow'>debug · コアモデル</p>
          <h1>Dice → View（振り方 + 表示）</h1>
        </div>
        <Link to='/' className='debug-back'>
          ← 一覧
        </Link>
      </header>

      <p className='debug-lead'>
        最上位は <strong>Dice → View</strong> の 2 軸。振り方は View
        の一部で、View 内部を <code>RollResult</code> という seam で
        「振り方(draw) → 表示(render)」に分ける。
      </p>

      <section>
        <div className='axis-flow'>
          <div className='axis-card'>
            <span className='axis-name'>Dice（データ）</span>
            <p className='axis-role'>何を引くか</p>
            <p className='axis-produces'>items / weight / range</p>
          </div>
          <span className='axis-arrow'>→</span>
          <div className='axis-card axis-view'>
            <span className='axis-name'>View（体験）</span>
            <div className='view-inner'>
              <span className='inner-box'>振り方 (draw)</span>
              <span className='seam'>─ RollResult ▶</span>
              <span className='inner-box'>表示 (render)</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>不変条件 — 分離できているかの判定</h2>
        <div className='inv-list'>
          {INVARIANTS.map((inv) => (
            <div key={inv.title} className={`inv-card ${inv.ok ? 'ok' : 'ng'}`}>
              <div className='inv-top'>
                <span className='inv-mark'>{inv.ok ? '✓' : '✗'}</span>
                <span className='inv-title'>{inv.title}</span>
              </div>
              <p className='inv-rule'>{inv.rule}</p>
              <p className='inv-detail'>{inv.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>各 View の振り方（現状）</h2>
        <div className='debug-table-wrap'>
          <table className='debug-table'>
            <thead>
              <tr>
                <th>View</th>
                <th>振り方</th>
                <th>パラメータ</th>
              </tr>
            </thead>
            <tbody>
              {VIEW_ROWS.map((row) => (
                <tr key={row.view} className={row.bad ? 'row-bad' : ''}>
                  <td>
                    <code>{row.view}</code>
                  </td>
                  <td>{row.method}</td>
                  <td>
                    <span className={`param-pill ${paramClass(row.paramLoc)}`}>
                      {row.paramLoc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>登録 View（Mode）</h2>
        <div className='mode-chips'>
          {MODES.map((m) => (
            <span key={m.id} className='mode-chip'>
              {m.emoji} {m.name}
              <code>{m.id}</code>
            </span>
          ))}
        </div>
      </section>

      <div className='debug-doc-link'>
        正典ドキュメント <code>docs/model.md</code> ／ 旧 2 層版{' '}
        <code>docs/random-tool-spec.md</code>
      </div>
    </div>
  )
}
