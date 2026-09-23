import { describe, expect, it } from 'vitest'
import { CsvError, parseCsv, parseCsvBytes } from '../src/pipeline'
import { readBytes } from './helpers'

const utf8 = (text: string) => new TextEncoder().encode(text)

describe('parseCsv', () => {
  describe('UTF-8 con BOM y separador ";"', () => {
    const csv = parseCsvBytes(readBytes('fixtures/socios.csv'))

    it('detecta separador y codificación', () => {
      expect(csv.delimiter).toBe(';')
      expect(csv.encoding).toBe('utf-8')
    })

    it('quita el BOM de la primera cabecera', () => {
      expect(csv.headers).toEqual(['Nom', 'Llicència'])
    })

    it('ignora las filas vacías y conserva el número de fila original', () => {
      const numbers = csv.rows.map((r) => r.rowNumber)
      expect(numbers).toHaveLength(14)
      expect(numbers).not.toContain(7)
      expect(numbers).not.toContain(8)
      expect(numbers.slice(4, 6)).toEqual([6, 9])
    })

    it('conserva acentos, ñ, ç y l·l', () => {
      const names = csv.rows.map((r) => r.data['Nom'])
      expect(names).toContain('Laia Col·lell Serra')
      expect(names).toContain('Iñaki Muñoz Ibáñez')
      expect(names).toContain('Pere Soler i Vilaça')
    })
  })

  describe('Latin-1 con separador ","', () => {
    const csv = parseCsvBytes(readBytes('fixtures/socios-latin1.csv'))

    it('reintenta como Windows-1252', () => {
      expect(csv.encoding).toBe('windows-1252')
      expect(csv.delimiter).toBe(',')
      expect(csv.rows.map((r) => r.data['nombre'])).toEqual([
        'Àlex Pérez Ruiz',
        'Mònica Castañer Puig',
        'Francesc Col·lell Garcia',
        'Ramon Llull, Jaume',
      ])
    })
  })

  it('recorta espacios y rellena las columnas que faltan', () => {
    const csv = parseCsvBytes(utf8('nombre,num_federado\n  Anna Roca  \n'))
    expect(csv.rows[0].data).toEqual({ nombre: 'Anna Roca', num_federado: '' })
  })

  it('no confunde con el separador las comas dentro de comillas', () => {
    const csv = parseCsvBytes(utf8('"Cognoms, Nom";Llicència\n"Roca, Anna";1\n'))
    expect(csv.delimiter).toBe(';')
  })

  it('rechaza un fichero vacío', () => {
    expect(() => parseCsvBytes(utf8(''))).toThrow(CsvError)
    expect(() => parseCsvBytes(utf8('\r\n;\r\n'))).toThrow(CsvError)
  })

  it('acepta un Blob', async () => {
    const csv = await parseCsv(new Blob(['nombre;num_federado\nAnna;1\n']))
    expect(csv.rows).toHaveLength(1)
  })
})
