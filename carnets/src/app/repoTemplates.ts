import type { LibraryTemplate, SeasonAssignment } from './templateLibrary'

// Plantillas del repositorio (carnets/templates/) que viajan con cada despliegue. Al entrar, la app guarda en la
// biblioteca las versiones que aún no tiene y aprueba la oficial de su temporada, así un cambio de diseño llega con
// el deploy sin tener que publicarlo a mano. Lo hace con la sesión de quien entra: pasa por las reglas de Firestore.

/** Una plantilla del repositorio. */
export interface RepoTemplate {
  /** Ruta en el repositorio, desde `templates/` (p. ej. `plantilla-carnet-2026-27.svg`, `propuestas/diana.svg`). */
  path: string
  /** Diseño ("Escut", "Diana"…), del comentario que deja scripts/make-template.mjs; `null` si no lo lleva. */
  design: string | null
  /** Temporada de la que es oficial (`plantilla-carnet-2026-27.svg` → "2026-27"); `null` en las propuestas. */
  season: string | null
  svg: string
}

/** Lo que hay que hacer con una versión del repositorio que la biblioteca no tiene. */
export interface SyncAction {
  template: RepoTemplate
  name: string
  /** Temporada para la que se aprueba; `null` si solo se guarda en la biblioteca. */
  approveFor: string | null
}

const OFFICIAL = /^plantilla-carnet-(\d{4}-\d{2})\.svg$/

/** Diseño de una plantilla generada por scripts/make-template.mjs: `(diseño "Escut")` en el comentario inicial. */
export function designOf(svg: string): string | null {
  return /\(diseño "([^"]+)"\)/.exec(svg.slice(0, 2000))?.[1] ?? null
}

/** Para comparar SVG sin que importen los saltos de línea (git en Windows los deja en CRLF). */
export function normalizeSvg(svg: string): string {
  return svg.replaceAll('\r\n', '\n').trim()
}

export function repoTemplate(path: string, svg: string): RepoTemplate {
  return { path, design: designOf(svg), season: OFFICIAL.exec(path)?.[1] ?? null, svg }
}

/**
 * Versiones del repositorio que hay que guardar en la biblioteca, y cuáles aprobar.
 * - Cada versión se guarda una sola vez: si la biblioteca ya tiene un SVG idéntico (subido desde la app o por una
 *   sincronización anterior), no se hace nada. Así, si la junta aprueba otra a mano, no se le vuelve a cambiar.
 * - La oficial de una temporada se aprueba si la temporada no tiene plantilla o si la que tiene es del mismo diseño
 *   (una versión anterior). Si tiene otro diseño, la junta eligió otra cosa: la nueva versión solo se guarda.
 * - Las propuestas solo se guardan.
 */
export function planSync(
  repo: RepoTemplate[],
  library: LibraryTemplate[],
  assignments: SeasonAssignment[],
  today: Date,
): SyncAction[] {
  const known = new Set(library.map((t) => normalizeSvg(t.svg)))
  const date = today.toISOString().slice(0, 10)
  return repo
    .filter((template) => !known.has(normalizeSvg(template.svg)))
    .map((template) => {
      let approveFor: string | null = null
      if (template.season) {
        const assigned = library.find((t) => t.id === assignments.find((a) => a.season === template.season)?.template)
        if (!assigned || (template.design !== null && designOf(assigned.svg) === template.design)) {
          approveFor = template.season
        }
      }
      const label = template.design ?? template.path.replace(/^.*\//, '').replace(/\.svg$/i, '')
      return { template, name: `${label} · repo ${date}`, approveFor }
    })
}

/** Id fijo para cada versión (un resumen del SVG): si dos personas entran a la vez, la segunda no la duplica. */
export async function repoTemplateId(svg: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeSvg(svg)))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `repo-${hex.slice(0, 24)}`
}

// Los SVG van en el bundle, pero en un trozo aparte que solo se descarga tras iniciar sesión.
const files = import.meta.glob<string>('../../templates/**/*.svg', { query: '?raw', import: 'default' })

/** Las plantillas del repositorio incluidas en este despliegue. */
export async function loadRepoTemplates(): Promise<RepoTemplate[]> {
  return Promise.all(
    Object.entries(files).map(async ([path, load]) => repoTemplate(path.replace(/^.*\/templates\//, ''), await load())),
  )
}
