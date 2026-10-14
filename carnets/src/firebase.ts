import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Configuración de la app web del proyecto (`firebase apps:sdkconfig`). No es secreta: identifica el proyecto,
// y quién puede leer o escribir lo deciden las reglas de firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyAREKwPBP5uaHij7yhVFBd9ga7IcYXGSAM',
  authDomain: 'arquers-club-castelldefels.firebaseapp.com',
  projectId: 'arquers-club-castelldefels',
  appId: '1:389388616126:web:2b2c13e5a3c7b4bc4cb9ef',
  messagingSenderId: '389388616126',
})

export const auth = getAuth(app)
export const db = getFirestore(app)

// En desarrollo, siempre los emuladores (`pnpm emulators` desde la raíz): `pnpm dev` nunca toca producción.
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
