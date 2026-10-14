import { describe, expect, it } from 'vitest'
import { sampleCard, widestCard } from '../src/app/cards'
import { guessMapping, keepMapping, normalizeHeader } from '../src/app/mapping'
import { listMembers } from '../src/app/members'
import { currentSeason } from '../src/app/season'
import { loadFontSet, parseCsvBytes, parseTemplate, validate } from '../src/pipeline'
import { fontFiles, readBytes, readText } from './helpers'

const template = parseTemplate(readText('fixtures/plantilla-una-cara.svg'))

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

describe('keepMapping', () => {
  it('conserva las columnas elegidas a mano al cambiar de plantilla', () => {
    // "Nom del club" no es lo que propondría guessMapping: es una elección del usuario
    const previous = { nombre: 'Nom del club', num_federado: 'Llicència' }
    expect(keepMapping(previous, template.fields, ['Nom', 'Nom del club', 'Llicència'])).toEqual(previous)
  })

  it('propone los campos que faltan sin repetir columnas ya usadas', () => {
    expect(keepMapping({ nombre: 'Nom' }, template.fields, ['Nom', 'Llicència'])).toEqual({
      nombre: 'Nom',
      num_federado: 'Llicència',
    })
  })

  it('descarta campos que ya no están en la plantilla y columnas que ya no están en el CSV', () => {
    expect(keepMapping({ foto: 'Foto', nombre: 'Name' }, template.fields, ['Nom', 'Llicència'])).toEqual({
      nombre: 'Nom',
      num_federado: 'Llicència',
    })
  })
})

describe('listMembers', () => {
  it('da a cada fila del CSV su estado, en el orden del fichero', () => {
    const fonts = loadFontSet(fontFiles())
    const { rows } = parseCsvBytes(readBytes('fixtures/socios.csv'))
    const result = validate(
      rows,
      template,
      { mapping: { nombre: 'Nom', num_federado: 'Llicència' }, staticValues: { temporada: '2026-27' } },
      fonts,
    )
    const members = listMembers(rows, result)

    expect(members.map((m) => m.row.rowNumber)).toEqual(rows.map((r) => r.rowNumber))
    expect(members.filter((m) => m.status === 'rejected')).toHaveLength(result.rejected.length)
    expect(members.filter((m) => m.status !== 'rejected')).toHaveLength(result.valid.length)
    expect(new Set(members.filter((m) => m.status === 'warning').map((m) => m.row.rowNumber))).toEqual(
      new Set(result.warnings.map((w) => w.rowNumber)),
    )
    for (const member of members) {
      if (member.card === null) expect(member.status).toBe('rejected')
      else expect(result.valid[member.card].rowNumber).toBe(member.row.rowNumber)
    }
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
