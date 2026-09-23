import { describe, expect, it } from 'vitest'
import { loadFontSet, parseCsvBytes, parseTemplate, validate } from '../src/pipeline'
import type { RawRow, ValidationConfig } from '../src/pipeline'
import { readBytes, readText } from './helpers'

const template = parseTemplate(readText('templates/plantilla-carnet-cr80.svg'))
const fonts = loadFontSet({
  600: readBytes('fonts/Inter-SemiBold.ttf'),
  700: readBytes('fonts/Inter-Bold.ttf'),
})
const config: ValidationConfig = {
  mapping: { nombre: 'Nom', num_federado: 'Llicència' },
  staticValues: { temporada: '2026-27' },
}
const row = (rowNumber: number, nom: string, llicencia: string): RawRow => ({
  rowNumber,
  data: { Nom: nom, Llicència: llicencia },
})

describe('validate con el CSV de prueba', () => {
  const { rows } = parseCsvBytes(readBytes('fixtures/socios.csv'))
  const result = validate(rows, template, config, fonts)
  const reasonsByRow = Object.fromEntries(result.rejected.map((r) => [r.row.rowNumber, r.reasons.map((i) => i.code)]))
  const card = (rowNumber: number) => result.valid.find((c) => c.rowNumber === rowNumber)!

  it('genera los carnets válidos', () => {
    expect(result.valid.map((c) => c.rowNumber)).toEqual([2, 3, 4, 5, 6, 9, 10, 17])
  })

  it('rechaza cada fila por su motivo', () => {
    expect(reasonsByRow).toEqual({
      11: ['does-not-fit'],
      12: ['duplicate'],
      13: ['duplicate'],
      14: ['empty-field'],
      15: ['invalid-format'],
      16: ['missing-glyph'],
    })
  })

  it('normaliza el número de federado', () => {
    expect(card(2).values['num_federado']).toBe('124692')
    expect(card(17).values['num_federado']).toBe('124703')
  })

  it('usa el tamaño original cuando el nombre cabe', () => {
    expect(card(2).fontSizes['nombre']).toBe(4.4)
  })

  it('reduce el nombre largo sin avisar si no baja del 80 %', () => {
    expect(card(9).fontSizes['nombre']).toBeLessThan(4.4)
    expect(card(9).fontSizes['nombre']).toBeGreaterThanOrEqual(4.4 * 0.8)
  })

  it('avisa si el nombre baja del 80 %', () => {
    expect(result.warnings.map((w) => [w.rowNumber, w.code])).toEqual([[10, 'font-reduced']])
  })

  it('indica en el duplicado la otra fila', () => {
    const duplicate = result.rejected.find((r) => r.row.rowNumber === 12)!
    expect(duplicate.reasons[0].message).toContain('fila 13')
  })

  it('nombra el carácter que falta en la fuente', () => {
    const missing = result.rejected.find((r) => r.row.rowNumber === 16)!
    expect(missing.reasons[0].message).toContain('李')
  })
})

describe('validate', () => {
  it('acepta el CSV en Latin-1', () => {
    const { rows } = parseCsvBytes(readBytes('fixtures/socios-latin1.csv'))
    const mapping = { nombre: 'nombre', num_federado: 'num_federado' }
    const result = validate(rows, template, { ...config, mapping }, fonts)
    expect(result.rejected).toEqual([])
    expect(result.valid).toHaveLength(4)
  })

  it('rechaza caracteres mal codificados', () => {
    const result = validate([row(2, 'JosÃ© Roca', '1'), row(3, 'Jos� Roca', '2')], template, config, fonts)
    expect(result.rejected.map((r) => r.reasons[0].code)).toEqual(['encoding', 'encoding'])
  })

  it('acumula todos los errores de una fila', () => {
    const result = validate([row(2, '', 'pendent')], template, config, fonts)
    expect(result.rejected[0].reasons.map((i) => i.code)).toEqual(['empty-field', 'invalid-format'])
  })

  it('rechaza todas las filas si falta configurar la temporada', () => {
    const result = validate([row(2, 'Anna Roca', '1')], template, { ...config, staticValues: {} }, fonts)
    expect(result.valid).toEqual([])
    expect(result.rejected[0].reasons[0]).toMatchObject({ field: 'temporada', code: 'empty-field' })
  })

  it('exige asignar una columna a cada campo del CSV', () => {
    expect(() => validate([], template, { ...config, mapping: { nombre: 'Nom' } }, fonts)).toThrow(/num_federado/)
  })
})
