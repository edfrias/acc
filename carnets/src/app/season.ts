/** Mes (0 = enero) en que empieza la temporada: septiembre. */
const SEASON_START_MONTH = 8

/** Temporada en curso en el formato de la plantilla: "2026-27". */
export function currentSeason(date: Date): string {
  const year = date.getFullYear()
  const start = date.getMonth() >= SEASON_START_MONTH ? year : year - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}
