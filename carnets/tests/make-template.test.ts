import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { seasonValues } from '../src/app/season'
import { loadFontSet, parseTemplate, validate } from '../src/pipeline'
import { fontFiles, readText } from './helpers'

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
      expect(lf(make(design, '2027-28'))).toBe(lf(readText(`templates/propuestas/${design}.svg`)))
    }
  })

  for (const design of ['escut', 'diana', 'fletxa']) {
    it(`"${design}": dos caras que la app sabe dibujar, con los campos del socio y la temporada`, () => {
      const template = parseTemplate(make(design, '2027-28'))
      expect(template).toMatchObject({ width: 91.6, height: 60, sides: 2 })
      const names = template.fields.map((f) => f.name)
      expect(names).toEqual(expect.arrayContaining(['nombre', 'num_federado', 'temporada']))
      // La marca de agua con la temporada corta es un campo: la plantilla no queda atada a un año
      expect(names.includes('temporada_corta')).toBe(design !== 'escut')
    })
  }

  it('la temporada de cualquier año cabe en las propuestas sin reducirla', () => {
    const fonts = loadFontSet(fontFiles())
    const row = { rowNumber: 2, data: { Nom: 'Anna Puig', Llicència: '124692' } }
    const mapping = { nombre: 'Nom', num_federado: 'Llicència' }
    for (const design of ['diana', 'fletxa']) {
      const template = parseTemplate(readText(`templates/propuestas/${design}.svg`))
      for (const season of ['2026-27', '2028-29', '2099-00']) {
        const result = validate([row], template, { mapping, staticValues: seasonValues(season) }, fonts)
        expect(result.rejected).toEqual([])
        expect(result.warnings).toEqual([])
        expect(result.valid[0].values['temporada_corta']).toBe(season.slice(2))
      }
    }
  })

  it('pone la temporada que se le pide, entera y corta', () => {
    const svg = make('diana', '2027-28')
    expect(svg).toContain('>2027-2028</text>')
    expect(svg).toContain('>27-28</text>')
  })

  it('rechaza un diseño que no existe', () => {
    expect(() => make('ona', '2027-28')).toThrow()
  })
})
