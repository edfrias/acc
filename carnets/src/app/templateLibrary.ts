import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import { db } from '../firebase'

// Biblioteca de plantillas aprobadas y su asignación a temporadas (CLAUDE.md § Acceso y plantillas oficiales):
//   plantilles/{id}                     una plantilla: nombre, SVG, quién la subió y cuándo. Nunca se sobrescribe
//   temporades/{temporada}              la plantilla oficial de esa temporada ("2026-27")
//   temporades/{temporada}/historial/*  cada aprobación para esa temporada; solo se añade, nunca se cambia
const TEMPLATES = 'plantilles'
const SEASONS = 'temporades'
const HISTORY = 'historial'

/** Largo máximo del nombre de una plantilla. Es lo mismo que comprueba firestore.rules. */
export const NAME_MAX_LENGTH = 80

export interface LibraryTemplate {
  id: string
  name: string
  svg: string
  uploadedBy: string
  uploadedAt: Date | null
}

export interface SeasonAssignment {
  season: string
  /** Id de la plantilla en la biblioteca. */
  template: string
  assignedBy: string
  assignedAt: Date | null
}

export interface HistoryEntry {
  template: string
  /** Nombre que tenía la plantilla al aprobarla: si luego se renombra o se elimina, el historial lo conserva. */
  name: string
  assignedBy: string
  assignedAt: Date | null
}

const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null)
const text = (data: DocumentData, key: string) => String(data[key] ?? '')

/** "  Escut  " → "Escut"; `null` si queda vacío o es demasiado largo. */
export function cleanName(name: string): string | null {
  const clean = name.replace(/\s+/g, ' ').trim()
  return clean.length > 0 && clean.length <= NAME_MAX_LENGTH ? clean : null
}

/** Nombre propuesto para una plantilla subida desde fichero: el del fichero, sin la extensión. */
export function nameFromFile(fileName: string): string {
  return cleanName(fileName.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ')) ?? 'Plantilla'
}

/** Temporadas que tienen asignada la plantilla `id`, de la más reciente a la más antigua. */
export function seasonsOf(id: string, assignments: SeasonAssignment[]): string[] {
  return assignments.filter((a) => a.template === id).map((a) => a.season).sort().reverse()
}

/** La biblioteca, de la plantilla más reciente a la más antigua, y las asignaciones de cada temporada. */
export async function loadLibrary(): Promise<{ templates: LibraryTemplate[]; assignments: SeasonAssignment[] }> {
  const [templates, seasons] = await Promise.all([getDocs(collection(db, TEMPLATES)), getDocs(collection(db, SEASONS))])
  return {
    templates: templates.docs
      .map((d) => {
        const data = d.data()
        return {
          id: d.id,
          // Las plantillas publicadas antes de la biblioteca no tienen nombre: su id era la temporada
          name: text(data, 'name') || d.id,
          svg: text(data, 'svg'),
          uploadedBy: text(data, 'uploadedBy'),
          uploadedAt: date(data['uploadedAt']),
        }
      })
      .sort((a, b) => (b.uploadedAt?.getTime() ?? 0) - (a.uploadedAt?.getTime() ?? 0)),
    assignments: seasons.docs
      .map((d) => {
        const data = d.data()
        return {
          season: d.id,
          template: text(data, 'template'),
          assignedBy: text(data, 'assignedBy'),
          assignedAt: date(data['assignedAt']),
        }
      })
      .sort((a, b) => b.season.localeCompare(a.season)),
  }
}

/** Historial de aprobaciones de una temporada, de la más reciente a la más antigua. */
export async function loadHistory(season: string): Promise<HistoryEntry[]> {
  const snapshot = await getDocs(collection(db, SEASONS, season, HISTORY))
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        template: text(data, 'template'),
        name: text(data, 'name'),
        assignedBy: text(data, 'assignedBy'),
        assignedAt: date(data['assignedAt']),
      }
    })
    .sort((a, b) => (b.assignedAt?.getTime() ?? 0) - (a.assignedAt?.getTime() ?? 0))
}

/** Asignación y su entrada del historial, en la misma escritura: las reglas exigen que vayan juntas. */
function assign(batch: ReturnType<typeof writeBatch>, id: string, name: string, season: string, email: string): void {
  batch.set(doc(db, SEASONS, season), { template: id, assignedBy: email, assignedAt: serverTimestamp() })
  batch.set(doc(collection(db, SEASONS, season, HISTORY)), { template: id, name, assignedBy: email, assignedAt: serverTimestamp() })
}

/** Guarda una plantilla nueva en la biblioteca y la aprueba para `season`. Devuelve su id. */
export async function publishTemplate(name: string, svg: string, season: string, email: string): Promise<string> {
  const batch = writeBatch(db)
  const ref = doc(collection(db, TEMPLATES))
  batch.set(ref, { name, svg, uploadedBy: email, uploadedAt: serverTimestamp() })
  assign(batch, ref.id, name, season, email)
  await batch.commit()
  return ref.id
}

/** Aprueba para `season` una plantilla que ya está en la biblioteca (sustituye la que tuviera). */
export async function assignTemplate(id: string, name: string, season: string, email: string): Promise<void> {
  const batch = writeBatch(db)
  assign(batch, id, name, season, email)
  await batch.commit()
}

/** Deja `season` sin plantilla oficial. El historial de la temporada se conserva. */
export async function unassignSeason(season: string): Promise<void> {
  await deleteDoc(doc(db, SEASONS, season))
}

export async function renameTemplate(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, TEMPLATES, id), { name })
}

/** Elimina una plantilla de la biblioteca. La interfaz solo lo ofrece si no está asignada a ninguna temporada. */
export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES, id))
}
