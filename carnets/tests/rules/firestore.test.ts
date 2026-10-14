// Reglas de firestore.rules contra el emulador. Se ejecutan con `pnpm test:rules`, que lo arranca;
// `pnpm test` no las incluye.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import type { RulesTestEnvironment, TokenOptions } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

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

// Punto de partida: una plantilla en la biblioteca asignada a 2025-26, con su historial, y otra de antes
// de la biblioteca (sin nombre, con la temporada como id)
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const now = Timestamp.now()
    await setDoc(doc(db, 'plantilles/escut'), { name: 'Escut', svg: SVG, uploadedBy: CLUB, uploadedAt: now })
    await setDoc(doc(db, 'plantilles/2024-25'), { svg: SVG, uploadedBy: CLUB, uploadedAt: now })
    await setDoc(doc(db, 'temporades/2025-26'), { template: 'escut', assignedBy: CLUB, assignedAt: now })
    await setDoc(doc(db, 'temporades/2025-26/historial/1'), { template: 'escut', name: 'Escut', assignedBy: CLUB, assignedAt: now })
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

const outsiders = () => [
  env.unauthenticatedContext().firestore(),
  as('junta@gmail.com'),
  as('junta@arquerscastelldefels.com.evil.com'),
  as('junta@sub.arquerscastelldefels.com'),
  as(CLUB, { email_verified: false }),
  as(CLUB, { firebase: { sign_in_provider: 'password' } }),
]

function template(email = CLUB) {
  return { name: 'Escut v2', svg: SVG, uploadedBy: email, uploadedAt: serverTimestamp() }
}

/** Aprobación como la hace la app: asignación e historial en la misma escritura. */
function approve(db: ReturnType<typeof as>, season: string, id: string, email = CLUB) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'temporades', season), { template: id, assignedBy: email, assignedAt: serverTimestamp() })
  batch.set(doc(collection(db, 'temporades', season, 'historial')), {
    template: id,
    name: 'Escut',
    assignedBy: email,
    assignedAt: serverTimestamp(),
  })
  return batch.commit()
}

describe('leer', () => {
  it('una cuenta del club puede leer la biblioteca, las temporadas y el historial', async () => {
    const db = as(CLUB)
    await assertSucceeds(getDocs(collection(db, 'plantilles')))
    await assertSucceeds(getDoc(doc(db, 'temporades/2025-26')))
    await assertSucceeds(getDocs(collection(db, 'temporades')))
    await assertSucceeds(getDocs(collection(db, 'temporades/2025-26/historial')))
  })

  it('nadie más puede', async () => {
    for (const db of outsiders()) {
      await assertFails(getDocs(collection(db, 'plantilles')))
      await assertFails(getDoc(doc(db, 'temporades/2025-26')))
      await assertFails(getDocs(collection(db, 'temporades/2025-26/historial')))
    }
  })
})

describe('biblioteca', () => {
  it('una cuenta del club puede subir una plantilla', async () => {
    await assertSucceeds(setDoc(doc(as(CLUB), 'plantilles/nova'), template()))
  })

  it('nadie más puede', async () => {
    for (const db of outsiders()) await assertFails(setDoc(doc(db, 'plantilles/nova'), template()))
  })

  it('el autor y la fecha no se pueden falsear', async () => {
    const db = as(CLUB)
    await assertFails(setDoc(doc(db, 'plantilles/nova'), template('otra@arquerscastelldefels.com')))
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), uploadedAt: Timestamp.now() }))
  })

  it('nombre de 1 a 80 caracteres, SVG de un tamaño razonable y sin campos de más', async () => {
    const db = as(CLUB)
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), name: '' }))
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), name: 'x'.repeat(81) }))
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), extra: true }))
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), svg: '' }))
    await assertFails(setDoc(doc(db, 'plantilles/nova'), { ...template(), svg: 'x'.repeat(500_001) }))
    await assertSucceeds(setDoc(doc(db, 'plantilles/nova'), { ...template(), svg: 'x'.repeat(500_000) }))
  })

  it('una plantilla publicada no se sobrescribe: solo se le cambia el nombre', async () => {
    const db = as(CLUB)
    await assertSucceeds(updateDoc(doc(db, 'plantilles/escut'), { name: 'Escut 2026-27' }))
    await assertFails(updateDoc(doc(db, 'plantilles/escut'), { svg: '<svg/>' }))
    await assertFails(updateDoc(doc(db, 'plantilles/escut'), { name: '' }))
    await assertFails(setDoc(doc(db, 'plantilles/escut'), template()))
  })

  it('a una plantilla de antes de la biblioteca se le puede poner nombre', async () => {
    await assertSucceeds(updateDoc(doc(as(CLUB), 'plantilles/2024-25'), { name: 'Primera' }))
  })

  it('una cuenta del club puede eliminar una plantilla; nadie más', async () => {
    for (const db of outsiders()) await assertFails(deleteDoc(doc(db, 'plantilles/2024-25')))
    await assertSucceeds(deleteDoc(doc(as(CLUB), 'plantilles/2024-25')))
  })
})

describe('temporadas', () => {
  it('una cuenta del club puede aprobar una plantilla para una temporada, nueva o ya asignada', async () => {
    const db = as(CLUB)
    await assertSucceeds(approve(db, '2026-27', 'escut'))
    await assertSucceeds(approve(db, '2025-26', '2024-25'))
  })

  it('subir una plantilla y aprobarla en la misma escritura', async () => {
    const db = as(CLUB)
    const batch = writeBatch(db)
    batch.set(doc(db, 'plantilles/nova'), template())
    batch.set(doc(db, 'temporades/2026-27'), { template: 'nova', assignedBy: CLUB, assignedAt: serverTimestamp() })
    batch.set(doc(collection(db, 'temporades/2026-27/historial')), {
      template: 'nova',
      name: 'Escut v2',
      assignedBy: CLUB,
      assignedAt: serverTimestamp(),
    })
    await assertSucceeds(batch.commit())
  })

  it('nadie más puede aprobar', async () => {
    for (const db of outsiders()) await assertFails(approve(db, '2026-27', 'escut', 'junta@gmail.com'))
  })

  it('la temporada tiene que tener el formato "2026-27" y la plantilla tiene que existir', async () => {
    const db = as(CLUB)
    for (const id of ['2026-28', '2026', 'actual']) await assertFails(approve(db, id, 'escut'))
    await assertFails(approve(db, '2026-27', 'no-existe'))
  })

  it('la asignación no se puede falsear ni llevar campos de más', async () => {
    const db = as(CLUB)
    const ref = doc(db, 'temporades/2026-27')
    await assertFails(setDoc(ref, { template: 'escut', assignedBy: 'otra@arquerscastelldefels.com', assignedAt: serverTimestamp() }))
    await assertFails(setDoc(ref, { template: 'escut', assignedBy: CLUB, assignedAt: Timestamp.now() }))
    await assertFails(setDoc(ref, { template: 'escut', assignedBy: CLUB, assignedAt: serverTimestamp(), extra: 1 }))
  })

  it('una cuenta del club puede quitar una asignación; nadie más', async () => {
    for (const db of outsiders()) await assertFails(deleteDoc(doc(db, 'temporades/2025-26')))
    await assertSucceeds(deleteDoc(doc(as(CLUB), 'temporades/2025-26')))
  })
})

describe('historial', () => {
  it('no se puede añadir una entrada sin la asignación en la misma escritura', async () => {
    const entry = { template: 'escut', name: 'Escut', assignedBy: CLUB, assignedAt: serverTimestamp() }
    await assertFails(setDoc(doc(as(CLUB), 'temporades/2025-26/historial/2'), entry))
  })

  it('la entrada tiene que ser de la plantilla que se asigna', async () => {
    const db = as(CLUB)
    const batch = writeBatch(db)
    batch.set(doc(db, 'temporades/2026-27'), { template: 'escut', assignedBy: CLUB, assignedAt: serverTimestamp() })
    batch.set(doc(db, 'temporades/2026-27/historial/x'), {
      template: '2024-25',
      name: 'Otra',
      assignedBy: CLUB,
      assignedAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })

  it('no se puede cambiar ni borrar, tampoco desde el club', async () => {
    const db = as(CLUB)
    await assertFails(updateDoc(doc(db, 'temporades/2025-26/historial/1'), { name: 'Otra' }))
    await assertFails(deleteDoc(doc(db, 'temporades/2025-26/historial/1')))
  })
})

describe('el resto de la base de datos', () => {
  it('está cerrado, también para el club', async () => {
    const db = as(CLUB)
    await assertFails(getDoc(doc(db, 'socis/1')))
    await assertFails(setDoc(doc(db, 'socis/1'), { nom: 'Prova' }))
  })
})
