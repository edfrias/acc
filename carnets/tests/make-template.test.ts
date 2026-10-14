import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseTemplate } from '../src/pipeline'
import { readText } from './helpers'

const script = resolve(import.meta.dirname, '../scripts/make-template.mjs')
const out = mkdtempSync(join(tmpdir(), 'carnets-template-'))

/** Ejecuta el script como lo haría alguien de la junta y lee el SVG que deja. */
function make(design: string, season: string): string {
  const file = join(out, `${design}-${season}.svg`)
  // stdio 'pipe': los errores esperados del script no salen por la consola de los tests
  execFileSync(process.execPath, [script, design, season, file], { stdio: 'pipe' })
  return readFileSync(file, 'utf-8')
}

// Sin contar los saltos de línea: en Windows, git puede dejar las plantillas con CRLF al hacer checkout
const lf = (text: string) => text.replaceAll('\r\n', '\n')

describe('scripts/make-template.mjs', () => {
  it('regenera la plantilla oficial de 2026-27 tal cual', () => {
    expect(lf(make('escut', '2026-27'))).toBe(lf(readText('templates/plantilla-carnet-2026-27.svg')))
  })

  it('regenera tal cual las propuestas guardadas en templates/propuestas', () => {
    for (const design of ['diana', 'fletxa']) {
      expect(lf(make(design, '2027-28'))).toBe(lf(readText(`templates/propuestas/${design}-2027-28.svg`)))
    }
  })

  for (const design of ['escut', 'diana', 'fletxa']) {
    it(`"${design}": dos caras que la app sabe dibujar, con los tres campos`, () => {
      const template = parseTemplate(make(design, '2027-28'))
      expect(template).toMatchObject({ width: 91.6, height: 60, sides: 2 })
      expect(template.fields.map((f) => f.name)).toEqual(['nombre', 'num_federado', 'temporada'])
    })
  }

  it('pone la temporada que se le pide, entera y corta', () => {
    const svg = make('diana', '2027-28')
    expect(svg).toContain('>2027-2028</text>')
    expect(svg).toContain('>27-28</text>')
  })

  it('rechaza un diseño que no existe', () => {
    expect(() => make('ona', '2027-28')).toThrow()
  })
})
