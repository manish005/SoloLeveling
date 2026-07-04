import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')

/** Register with email/password, then send verification email */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  await sendEmailVerification(credential.user)
  return credential.user
}

/** Sign in with email/password */
export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe = true
): Promise<User> => {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Sign in with Google popup */
export const loginWithGoogle = async (): Promise<User> => {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

/** Send password reset email */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email)
}

/** Resend email verification */
export const resendVerificationEmail = async (): Promise<void> => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser)
  }
}

/** Sign out */
export const logout = async (): Promise<void> => {
  await signOut(auth)
}

/** Subscribe to auth state changes */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export { auth }
