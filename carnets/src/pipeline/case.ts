import type { NameCase } from './types'

/**
 * Partículas que van en minúscula dentro de un nombre ("Maria del Carme Puig i Soler", "Ana de la Fuente y López"),
 * salvo al principio.
 */
const PARTICLES = new Set(['de', 'del', 'dels', 'des', 'la', 'las', 'les', 'los', 'el', 'i', 'y', 'e'])

/** Prefijos con apóstrofo que van en minúscula: "d'Alòs", "l'Hospitalet". */
const APOSTROPHE_PREFIXES = new Set(['d', 'l'])

const APOSTROPHE = /['’]/

/**
 * Escribe el nombre como pide `nameCase`, sea cual sea cómo venga en el fichero:
 * - `upper`: todo en mayúsculas ("MARIA DEL CARME PUIG I SOLER").
 * - `title`: primera letra de cada palabra en mayúscula y el resto en minúscula ("Maria del Carme Puig i Soler"),
 *   con las partículas en minúscula y las palabras compuestas con guion ("Joan-Marc") o apóstrofo ("d'Alòs",
 *   "O'Brien") bien resueltas.
 * Los espacios repetidos se reducen a uno.
 */
export function formatName(value: string, nameCase: NameCase): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (nameCase === 'upper') return words.join(' ').toLocaleUpperCase('ca')
  return words.map((word, index) => titleWord(word.toLocaleLowerCase('ca'), index === 0)).join(' ')
}

function titleWord(word: string, first: boolean): string {
  if (!first && PARTICLES.has(word)) return word
  return word
    .split('-')
    .map((part) => {
      const [head, ...rest] = part.split(APOSTROPHE)
      if (rest.length === 0) return capitalize(part)
      const separator = APOSTROPHE.exec(part)![0]
      const tail = rest.join(separator)
      // "d'alòs" → "d'Alòs" (al principio, "D'Alòs"); "o'brien" → "O'Brien"
      const prefix = APOSTROPHE_PREFIXES.has(head) && !first ? head : capitalize(head)
      return prefix + separator + capitalize(tail)
    })
    .join('-')
}

/** Primera letra en mayúscula. Con "l·l" no hay sorpresa: la "l" que sigue al punto volado queda en minúscula. */
function capitalize(text: string): string {
  const [initial, ...rest] = [...text]
  return initial === undefined ? '' : initial.toLocaleUpperCase('ca') + rest.join('')
}
