import { describe, expect, it } from 'vitest'
import { formatName, loadFontSet, parseTemplate, validate } from '../src/pipeline'
import type { RawRow } from '../src/pipeline'
import { sampleCard } from '../src/app/cards'
import { readBytes, readText } from './helpers'

describe('formatName', () => {
  it('pasa a mayúsculas, con acentos, ç y l·l', () => {
    expect(formatName('Maria del Carme Puigdomènech i Sabaté', 'upper')).toBe('MARIA DEL CARME PUIGDOMÈNECH I SABATÉ')
    expect(formatName('Narcís Garriga i Gual·la', 'upper')).toBe('NARCÍS GARRIGA I GUAL·LA')
    expect(formatName('françesc muñoz', 'upper')).toBe('FRANÇESC MUÑOZ')
  })

  it('deja la inicial en mayúscula y las partículas en minúscula', () => {
    expect(formatName('MARIA DEL CARME PUIGDOMÈNECH I SABATÉ', 'title')).toBe('Maria del Carme Puigdomènech i Sabaté')
    expect(formatName('ana DE LA fuente y lópez', 'title')).toBe('Ana de la Fuente y López')
    expect(formatName('ÀNGEL GUAL·LA', 'title')).toBe('Àngel Gual·la')
  })

  it('resuelve guiones y apóstrofos', () => {
    expect(formatName('JOAN-MARC FERRER', 'title')).toBe('Joan-Marc Ferrer')
    expect(formatName("JORDI D'ALÒS", 'title')).toBe("Jordi d'Alòs")
    expect(formatName("SEAN O'BRIEN", 'title')).toBe("Sean O'Brien")
    expect(formatName("D'ALÒS JORDI", 'title')).toBe("D'Alòs Jordi")
  })

  it('una partícula al principio va en mayúscula', () => {
    expect(formatName('DE LA ROSA, JUAN', 'title')).toBe('De la Rosa, Juan')
  })

  it('reduce los espacios repetidos', () => {
    expect(formatName('  maria   puig ', 'upper')).toBe('MARIA PUIG')
    expect(formatName('  maria   puig ', 'title')).toBe('Maria Puig')
  })
})

describe('validate con nameCase', () => {
  const template = parseTemplate(readText('fixtures/plantilla-una-cara.svg'))
  const fonts = loadFontSet({ 600: readBytes('fonts/Inter-SemiBold.ttf'), 700: readBytes('fonts/Inter-Bold.ttf') })
  const rows: RawRow[] = [
    { rowNumber: 2, data: { Nom: 'MARIA PUIG I SOLER', Llicència: '124692' } },
    { rowNumber: 3, data: { Nom: 'joan ferrer', Llicència: '124693' } },
  ]
  const run = (nameCase?: 'upper' | 'title') =>
    validate(rows, template, { mapping: { nombre: 'Nom', num_federado: 'Llicència' }, staticValues: { temporada: '2026-27' }, nameCase }, fonts)
  const names = (nameCase?: 'upper' | 'title') => run(nameCase).valid.map((c) => c.values['nombre'])

  it('escribe todos los nombres igual, vengan como vengan', () => {
    expect(names('upper')).toEqual(['MARIA PUIG I SOLER', 'JOAN FERRER'])
    expect(names('title')).toEqual(['Maria Puig i Soler', 'Joan Ferrer'])
  })

  it('sin indicar, deja el nombre tal como viene', () => {
    expect(names()).toEqual(['MARIA PUIG I SOLER', 'joan ferrer'])
  })

  it('mide el ancho con el texto ya convertido', () => {
    const upper = run('upper').valid[1].fontSizes['nombre']
    const asIs = run().valid[1].fontSizes['nombre']
    expect(upper).toBeLessThanOrEqual(asIs)
  })

  it('el carnet de ejemplo sigue la misma opción', () => {
    const sample = sampleCard(template, {}, 'title').values['nombre']
    expect(sample).toBe(formatName(sampleCard(template, {}).values['nombre'], 'title'))
  })
})
