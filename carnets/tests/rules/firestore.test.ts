// Reglas de firestore.rules contra el emulador. Se ejecutan con `pnpm test:rules`, que lo arranca;
// `pnpm test` no las incluye.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import type { RulesTestEnvironment, TokenOptions } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'

const CLUB = 'junta@arquerscastelldefels.com'
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-carnets',
    firestore: { rules: readFileSync(resolve(import.meta.dirname, '../../../firestore.rules'), 'utf-8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'plantilles/2025-26'), { svg: SVG, uploadedBy: CLUB, uploadedAt: Timestamp.now() })
  })
})

/** Cliente con sesión iniciada con Google; `token` cambia lo que haga falta. */
function as(email: string, token: Partial<TokenOptions> = {}) {
  return env
    .authenticatedContext(`uid-${email}`, {
      email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
      ...token,
    })
    .firestore()
}

function template(email = CLUB) {
  return { svg: SVG, uploadedBy: email, uploadedAt: serverTimestamp() }
}

describe('leer plantillas', () => {
  it('una cuenta del club puede leerlas y listarlas', async () => {
    const db = as(CLUB)
    await assertSucceeds(getDoc(doc(db, 'plantilles/2025-26')))
    await assertSucceeds(getDocs(collection(db, 'plantilles')))
  })

  it('nadie más puede', async () => {
    const outsiders = [
      env.unauthenticatedContext().firestore(),
      as('junta@gmail.com'),
      as('junta@arquerscastelldefels.com.evil.com'),
      as('junta@sub.arquerscastelldefels.com'),
      as(CLUB, { email_verified: false }),
      as(CLUB, { firebase: { sign_in_provider: 'password' } }),
    ]
    for (const db of outsiders) {
      await assertFails(getDoc(doc(db, 'plantilles/2025-26')))
      await assertFails(getDocs(collection(db, 'plantilles')))
    }
  })
})

describe('publicar plantillas', () => {
  it('una cuenta del club puede publicar una temporada nueva y sustituir una existente', async () => {
    const db = as(CLUB)
    await assertSucceeds(setDoc(doc(db, 'plantilles/2026-27'), template()))
    await assertSucceeds(setDoc(doc(db, 'plantilles/2025-26'), template()))
  })

  it('nadie más puede', async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), 'plantilles/2026-27'), template()))
    await assertFails(setDoc(doc(as('junta@gmail.com'), 'plantilles/2026-27'), template('junta@gmail.com')))
    await assertFails(setDoc(doc(as(CLUB, { email_verified: false }), 'plantilles/2026-27'), template()))
  })

  it('la temporada tiene que tener el formato "2026-27"', async () => {
    const db = as(CLUB)
    for (const id of ['2026-28', '2026', '2026-2027', 'actual']) {
      await assertFails(setDoc(doc(db, 'plantilles', id), template()))
    }
  })

  it('el autor y la fecha no se pueden falsear', async () => {
    const db = as(CLUB)
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), template('otra@arquerscastelldefels.com')))
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), uploadedAt: Timestamp.now() }))
  })

  it('solo el SVG, sin campos de más, y de un tamaño razonable', async () => {
    const db = as(CLUB)
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), extra: true }))
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), svg: '' }))
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), svg: 42 }))
    await assertFails(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), svg: 'x'.repeat(500_001) }))
    await assertSucceeds(setDoc(doc(db, 'plantilles/2026-27'), { ...template(), svg: 'x'.repeat(500_000) }))
  })

  it('no se pueden borrar', async () => {
    await assertFails(deleteDoc(doc(as(CLUB), 'plantilles/2025-26')))
  })
})

describe('el resto de la base de datos', () => {
  it('está cerrado, también para el club', async () => {
    const db = as(CLUB)
    await assertFails(getDoc(doc(db, 'socis/1')))
    await assertFails(setDoc(doc(db, 'socis/1'), { nom: 'Prova' }))
  })
})
