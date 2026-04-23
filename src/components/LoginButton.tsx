import { useAuth } from '../contexts/AuthContext'
import { signInWithGoogle, signOut } from '../lib/firebase/auth'
import './LoginButton.css'

export function LoginButton() {
  const { user, isAuthLoading } = useAuth()

  if (isAuthLoading) return null

  if (user) {
    return (
      <div className='login-button-area'>
        <span className='user-name'>{user.displayName}</span>
        <button
          type='button'
          className='logout-button'
          onClick={() => signOut()}
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      type='button'
      className='login-button'
      onClick={() => signInWithGoogle()}
    >
      Googleでログイン
    </button>
  )
}
