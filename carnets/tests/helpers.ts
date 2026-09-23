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
