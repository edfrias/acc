import { ref } from 'vue'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase'
import { CLUB_DOMAIN, isClubAccount } from './club'

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in'
export type SignInError = 'popup-blocked' | 'not-club' | 'failed'

// Estado único de la sesión, como useCarnets.
const status = ref<SessionStatus>('loading')
const email = ref<string | null>(null)
const error = ref<SignInError | null>(null)
/** Cuenta de fuera del club con la que se intentó entrar, para decirlo en el mensaje. */
const rejectedEmail = ref<string | null>(null)

let started = false

function start(): void {
  if (started) return
  started = true
  onAuthStateChanged(auth, (user) => {
    if (user && !isClubAccount(user.email, user.emailVerified)) {
      // Con la pantalla de login "Interna" no debería pasar. Si pasa, fuera: Firestore tampoco le dejaría leer.
      rejectedEmail.value = user.email
      error.value = 'not-club'
      void firebaseSignOut(auth)
      return
    }
    email.value = user?.email ?? null
    status.value = user ? 'signed-in' : 'signed-out'
  })
}

export function useSession() {
  start()
  return {
    status,
    email,
    error,
    rejectedEmail,

    async signIn() {
      error.value = null
      rejectedEmail.value = null
      const provider = new GoogleAuthProvider()
      // `hd` solo sugiere las cuentas del club en el selector de Google; la restricción real está en las reglas
      provider.setCustomParameters({ hd: CLUB_DOMAIN, prompt: 'select_account' })
      try {
        await signInWithPopup(auth, provider)
      } catch (e) {
        const code = e instanceof FirebaseError ? e.code : ''
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
        error.value = code === 'auth/popup-blocked' ? 'popup-blocked' : 'failed'
      }
    },

    async signOut() {
      await firebaseSignOut(auth)
      // Recargar borra de memoria la lista de socios y todo lo demás
      location.reload()
    },
  }
}
