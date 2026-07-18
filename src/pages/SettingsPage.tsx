import { Link } from 'react-router-dom'
import { LoginButton } from '../components/LoginButton'
import './SettingsPage.css'

export function SettingsPage() {
  return (
    <div className='settings-page'>
      <header className='settings-header'>
        <h1>設定</h1>
        <Link to='/' className='settings-back'>
          ← 一覧
        </Link>
      </header>

      <section className='settings-section'>
        <h2>アカウント</h2>
        <p className='settings-desc'>
          Google
          ログインでダイスをクラウド（Firestore）に同期します。未ログイン時は端末内に保存されます。
        </p>
        <div className='settings-account'>
          <LoginButton />
        </div>
      </section>

      <section className='settings-section'>
        <h2>デバッグ</h2>
        <ul className='settings-links'>
          <li>
            <Link to='/debug/model' className='settings-link'>
              🔧 コアモデル（Dice → View）の点検
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
