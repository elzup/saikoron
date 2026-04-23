import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

function createGoogleProvider(scopes: string[] = []): GoogleAuthProvider {
  const provider = new GoogleAuthProvider()
  for (const scope of scopes) {
    provider.addScope(scope)
  }
  return provider
}

function accessTokenFromCredential(result: UserCredential): string | null {
  const credential = GoogleAuthProvider.credentialFromResult(result)
  return credential?.accessToken ?? null
}

export async function signInWithGoogleScopes(
  scopes: string[]
): Promise<{ user: User; accessToken: string | null }> {
  const result = await signInWithPopup(auth, createGoogleProvider(scopes))
  return {
    user: result.user,
    accessToken: accessTokenFromCredential(result),
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}
