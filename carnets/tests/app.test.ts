import { describe, expect, it } from 'vitest'
import { sampleCard, widestCard } from '../src/app/cards'
import { guessMapping, normalizeHeader } from '../src/app/mapping'
import { currentSeason } from '../src/app/season'
import { loadFontSet, parseCsvBytes, parseTemplate, validate } from '../src/pipeline'
import { fontFiles, readBytes, readText } from './helpers'

const template = parseTemplate(readText('templates/plantilla-carnet-cr80.svg'))

describe('currentSeason', () => {
  it('empieza en septiembre', () => {
    expect(currentSeason(new Date(2026, 8, 1))).toBe('2026-27')
    expect(currentSeason(new Date(2026, 7, 31))).toBe('2025-26')
  })

  it('rellena con cero el año final', () => {
    expect(currentSeason(new Date(2008, 10, 1))).toBe('2008-09')
    expect(currentSeason(new Date(2099, 10, 1))).toBe('2099-00')
  })
})

describe('guessMapping', () => {
  it('quita acentos, espacios y signos', () => {
    expect(normalizeHeader('Núm. Llicència')).toBe('numllicencia')
  })

  it('reconoce cabeceras en catalán, castellano e inglés', () => {
    expect(guessMapping(template.fields, ['Nom', 'Llicència'])).toEqual({ nombre: 'Nom', num_federado: 'Llicència' })
    expect(guessMapping(template.fields, ['Nombre completo', 'Nº licencia'])).toEqual({
      nombre: 'Nombre completo',
      num_federado: 'Nº licencia',
    })
    expect(guessMapping(template.fields, ['License', 'Full name'])).toEqual({ nombre: 'Full name', num_federado: 'License' })
  })

  it('prefiere la coincidencia exacta a la parcial', () => {
    expect(guessMapping(template.fields, ['Nom del club', 'Nom', 'Llicència']).nombre).toBe('Nom')
  })

  it('no asigna los campos estáticos ni lo que no reconoce', () => {
    expect(guessMapping(template.fields, ['Temporada', 'Columna A'])).toEqual({})
  })
})

describe('sampleCard', () => {
  it('usa el texto de ejemplo y los valores estáticos configurados', () => {
    expect(sampleCard(template, { temporada: '2030-31' })).toEqual({
      rowNumber: 0,
      values: { nombre: 'Nom Cognom Cognom', num_federado: '000000', temporada: '2030-31' },
      fontSizes: { nombre: 4.4, num_federado: 4.4, temporada: 3 },
    })
  })

  it('sin temporada configurada, muestra la de ejemplo', () => {
    expect(sampleCard(template, { temporada: ' ' }).values['temporada']).toBe('2026-27')
  })
})

describe('widestCard', () => {
  it('encuentra el nombre más largo', () => {
    const files = fontFiles()
    const fonts = loadFontSet(files)
    const { rows } = parseCsvBytes(readBytes('fixtures/socios.csv'))
    const { valid } = validate(
      rows,
      template,
      { mapping: { nombre: 'Nom', num_federado: 'Llicència' }, staticValues: { temporada: '2026-27' } },
      fonts,
    )
    const index = widestCard(valid, template, fonts, 'nombre')
    expect(valid[index].values['nombre']).toBe('Maria Montserrat Puigdomènech i Sabaté')
  })

  it('devuelve -1 si no hay carnets', () => {
    expect(widestCard([], template, loadFontSet(fontFiles()), 'nombre')).toBe(-1)
  })
})
