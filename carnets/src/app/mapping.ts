import type { ColumnMapping, TemplateField } from '../pipeline'

/**
 * Cabeceras habituales de cada campo, normalizadas (sin acentos, espacios ni signos).
 * `exact` se prueba antes que `partial` para no confundir "Nom" con "Nom del club".
 */
const KNOWN_HEADERS: Record<string, { exact: string[]; partial: string[] }> = {
  nombre: {
    exact: ['nom', 'nombre', 'name', 'nomcomplet', 'nombrecompleto', 'fullname', 'nomicognoms', 'nomcognoms', 'nombreyapellidos', 'soci', 'socio'],
    partial: ['nom', 'name'],
  },
  num_federado: {
    exact: ['llicencia', 'licencia', 'license', 'licence', 'numfederat', 'numfederado', 'numerofederat', 'numerofederado', 'federat', 'federado'],
    partial: ['llicenc', 'licenc', 'licens', 'federa', 'num'],
  },
}

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
    const known = KNOWN_HEADERS[field.name] ?? { exact: [normalizeHeader(field.name)], partial: [] }
    const free = normalized.filter(({ header }) => !used.has(header))
    const match =
      free.find(({ key }) => known.exact.includes(key)) ??
      free.find(({ key }) => known.partial.some((part) => key.includes(part)))
    if (match) {
      mapping[field.name] = match.header
      used.add(match.header)
    }
  }
  return mapping
}

/**
 * Asignación al cambiar de plantilla con el mismo CSV: conserva las columnas ya elegidas para los campos que siguen
 * existiendo y solo propone las de los campos nuevos. Así no hay que volver a revisar las columnas.
 */
export function keepMapping(previous: ColumnMapping, fields: TemplateField[], headers: string[]): ColumnMapping {
  const kept: ColumnMapping = {}
  for (const field of fields) {
    const header = previous[field.name]
    if (!field.isStatic && header !== undefined && headers.includes(header)) kept[field.name] = header
  }
  const used = new Set(Object.values(kept))
  const rest = fields.filter((field) => !(field.name in kept))
  return { ...guessMapping(rest, headers.filter((header) => !used.has(header))), ...kept }
}
