/** Mes (0 = enero) en que empieza la temporada: septiembre. */
const SEASON_START_MONTH = 8

/** Temporada en curso en el formato de la plantilla: "2026-27". */
export function currentSeason(date: Date): string {
  const year = date.getFullYear()
  const start = date.getMonth() >= SEASON_START_MONTH ? year : year - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

/** "2026-27" sí; "2026-28", "2026/27" o "26-27" no. Es lo mismo que comprueba firestore.rules. */
export function isSeason(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  return match !== null && Number(match[2]) === (Number(match[1]) + 1) % 100
}

/**
 * Temporada que se abre por defecto entre las publicadas: la en curso si existe;
 * si no, la más reciente. Con el formato "AAAA-AA" el orden alfabético es el cronológico.
 */
export function defaultSeason(published: string[], current: string): string | null {
  if (published.includes(current)) return current
  return [...published].sort().at(-1) ?? null
}

/** Temporada siguiente: "2026-27" → "2027-28". */
export function nextSeason(season: string): string {
  const start = Number(season.slice(0, 4)) + 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

/**
 * Temporada que se propone al publicar una plantilla: la en curso si aún no tiene;
 * si ya tiene, la siguiente (la plantilla nueva se suele preparar antes de que empiece).
 */
export function suggestedSeason(published: string[], current: string): string {
  return published.includes(current) ? nextSeason(current) : current
}

/** Cómo se escribe la temporada en el carnet: "2026-27" → "2026-2027". */
export function seasonLabel(season: string): string {
  const start = Number(season.slice(0, 4))
  return `${start}-${start + 1}`
}

/** Temporada corta, para marcas de agua y textos grandes: "2026-27" → "26-27". */
export function shortSeasonLabel(season: string): string {
  return season.slice(2)
}

/**
 * Campos estáticos que la app rellena sola con la temporada de los carnets, y cómo se escribe en cada uno.
 * Así una plantilla no queda atada a un año: la misma sirve para cualquier temporada.
 */
export const SEASON_FIELDS: Record<string, (season: string) => string> = {
  temporada: seasonLabel,
  temporada_corta: shortSeasonLabel,
}

export function isSeasonField(name: string): boolean {
  return name in SEASON_FIELDS
}

/** Valores de los campos de temporada para `season`; vacío si no es una temporada válida. */
export function seasonValues(season: string): Record<string, string> {
  if (!isSeason(season)) return {}
  return Object.fromEntries(Object.entries(SEASON_FIELDS).map(([field, format]) => [field, format(season)]))
}
