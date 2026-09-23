import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')

/** Lee un fichero del proyecto como bytes (p. ej. 'fixtures/socios.csv'). */
export function readBytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(projectRoot, path)))
}

export function readText(path: string): string {
  return readFileSync(resolve(projectRoot, path), 'utf-8')
}

/** Los cuatro pesos de Inter que usa la plantilla de referencia. */
export function fontFiles(): Record<number, Uint8Array> {
  return {
    500: readBytes('fonts/Inter-Medium.ttf'),
    600: readBytes('fonts/Inter-SemiBold.ttf'),
    700: readBytes('fonts/Inter-Bold.ttf'),
    800: readBytes('fonts/Inter-ExtraBold.ttf'),
  }
}
