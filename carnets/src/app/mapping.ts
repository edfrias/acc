import { NAME_FIELD } from '../pipeline'
import type { ColumnMapping, TemplateField } from '../pipeline'

export { NAME_FIELD }

/**
 * Cabeceras habituales de cada campo, normalizadas (sin acentos, espacios ni signos).
 * `exact` se prueba antes que `partial` para no confundir "Nom" con "Nom del club", y en el orden de la lista.
 */
const KNOWN_HEADERS: Record<string, { exact: string[]; partial: string[] }> = {
  nombre: {
    exact: ['nomcomplet', 'nombrecompleto', 'fullname', 'nomicognoms', 'nomcognoms', 'nombreyapellidos', 'nombreapellidos', 'nom', 'nombre', 'name', 'soci', 'socio'],
    partial: ['nom', 'name'],
  },
  num_federado: {
    exact: ['llicencia', 'licencia', 'license', 'licence', 'numfederat', 'numfederado', 'numerofederat', 'numerofederado', 'federat', 'federado'],
    partial: ['llicenc', 'licenc', 'licens', 'federa', 'num'],
  },
}

/** Columna con el nombre completo: si la hay, se usa aunque también haya nombre y apellidos por separado. */
const FULL_NAME = ['nomcomplet', 'nombrecompleto', 'fullname', 'nomicognoms', 'nomcognoms', 'nombreyapellidos', 'nombreapellidos']
/** Columna con solo el nombre de pila, cuando los apellidos van aparte. */
const FIRST_NAME = ['nom', 'nombre', 'name', 'firstname', 'nompila', 'nombrepila', 'nomdepila', 'nombredepila']
/** Apellidos: "Cognoms", "Apellidos", "Primer apellido", "Apellido 2", "Last name"… */
const SURNAME = ['cognom', 'apellido', 'surname', 'lastname', 'familyname']
const isSurname = (key: string) => SURNAME.some((part) => key.includes(part))

export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Propone qué columna del CSV corresponde a cada campo de la plantilla. Cada columna se usa una sola vez. */
export function guessMapping(fields: TemplateField[], headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()
  const normalized = headers.map((header) => ({ header, key: normalizeHeader(header) }))

  for (const field of fields) {
    if (field.isStatic) continue
    const free = normalized.filter(({ header }) => !used.has(header))
    if (field.name === NAME_FIELD) {
      const split = splitName(free)
      if (split) {
        mapping[field.name] = split
        split.forEach((header) => used.add(header))
        continue
      }
    }
    const known = KNOWN_HEADERS[field.name] ?? { exact: [normalizeHeader(field.name)], partial: [] }
    const match =
      // Las exactas por orden de la lista: "Nom complet" antes que "Nom"
      known.exact.map((name) => free.find(({ key }) => key === name)).find((found) => found !== undefined) ??
      // "Cognoms" contiene "nom": los apellidos nunca son el nombre
      free.find(({ key }) => known.partial.some((part) => key.includes(part)) && !(field.name === NAME_FIELD && isSurname(key)))
    if (match) {
      mapping[field.name] = match.header
      used.add(match.header)
    }
  }
  return mapping
}

/**
 * Nombre en varias columnas: la del nombre de pila y las de apellidos, en el orden del fichero ("Primer apellido",
 * "Segundo apellido"). Solo si no hay una columna con el nombre completo.
 */
function splitName(headers: { header: string; key: string }[]): string[] | null {
  if (headers.some(({ key }) => FULL_NAME.includes(key))) return null
  const first = headers.find(({ key }) => FIRST_NAME.includes(key))
  const surnames = headers.filter(({ key }) => isSurname(key))
  if (!first || surnames.length === 0) return null
  return [first.header, ...surnames.map(({ header }) => header)]
}

/** Las columnas de una asignación, como lista, sin las que aún no se han elegido. */
export function mappedColumns(columns: string | string[] | undefined): string[] {
  if (columns === undefined) return []
  return (Array.isArray(columns) ? columns : [columns]).filter((column) => column !== '')
}

/**
 * Asignación al cambiar de plantilla con el mismo CSV: conserva las columnas ya elegidas para los campos que siguen
 * existiendo y solo propone las de los campos nuevos. Así no hay que volver a revisar las columnas.
 */
export function keepMapping(previous: ColumnMapping, fields: TemplateField[], headers: string[]): ColumnMapping {
  const kept: ColumnMapping = {}
  for (const field of fields) {
    const columns = mappedColumns(previous[field.name])
    if (!field.isStatic && columns.length > 0 && columns.every((c) => headers.includes(c))) kept[field.name] = previous[field.name]
  }
  const used = new Set(Object.values(kept).flatMap(mappedColumns))
  const rest = fields.filter((field) => !(field.name in kept))
  return { ...guessMapping(rest, headers.filter((header) => !used.has(header))), ...kept }
}
