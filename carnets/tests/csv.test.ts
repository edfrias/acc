import { describe, expect, it } from 'vitest'
import { columnValue, CsvError, parseCsv, parseCsvBytes, parseTableBytes } from '../src/pipeline'
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

describe('Excel y tablas HTML', () => {
  describe('.xlsx con el nombre en dos columnas', async () => {
    const table = await parseTableBytes(readBytes('fixtures/socios-nom-cognoms.xlsx'))

    it('lee la primera hoja con sus cabeceras', () => {
      expect(table).toMatchObject({ format: 'xlsx', sheet: 'Socis', delimiter: null })
      expect(table.headers).toEqual(['Llicència', 'Nom', 'Cognoms'])
    })

    it('lee textos compartidos, en línea y números, y salta la fila vacía conservando el número de fila', () => {
      expect(table.rows.map((r) => r.rowNumber)).toEqual([2, 3, 5, 6, 7])
      expect(table.rows[0].data).toEqual({ Llicència: '125101', Nom: 'Marta', Cognoms: 'Casals Ribas' })
      expect(table.rows[2].data.Nom).toBe('Berta')
      expect(table.rows[3].data).toEqual({ Llicència: '125104', Nom: 'Iñaki', Cognoms: 'Muñoz Ibáñez' })
    })

    it('une nombre y apellidos', () => {
      expect(columnValue(table.rows[4], ['Nom', 'Cognoms'])).toBe('Maria del Carme Puigdomènech i Sabaté')
      expect(columnValue({ rowNumber: 2, data: { Nom: 'Anna', Cognoms: '' } }, ['Nom', 'Cognoms'])).toBe('Anna')
    })
  })

  it('lee el falso .xls que en realidad es una tabla HTML', async () => {
    const html = '<html><body><table><tr><th>Nombre</th><th>Licencia</th></tr><tr><td> Anna  Roca </td><td>124700</td></tr></table></body></html>'
    const table = await parseTableBytes(utf8(html))
    expect(table.format).toBe('html')
    expect(table.headers).toEqual(['Nombre', 'Licencia'])
    expect(table.rows).toEqual([{ rowNumber: 2, data: { Nombre: 'Anna Roca', Licencia: '124700' } }])
  })

  it('pide guardar como .xlsx o .csv el .xls binario antiguo', async () => {
    const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0])
    await expect(parseTableBytes(ole)).rejects.toMatchObject({ code: 'legacy-xls' })
  })

  it('rechaza un zip que no es un Excel', async () => {
    // Zip vacío: solo el final del directorio central, sin entradas
    const empty = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new Array(18).fill(0)])
    await expect(parseTableBytes(empty)).rejects.toMatchObject({ code: 'bad-xlsx' })
  })

  it('un CSV sigue siendo CSV', async () => {
    const table = await parseTableBytes(readBytes('fixtures/socios.csv'))
    expect(table).toMatchObject({ format: 'csv', delimiter: ';' })
  })
})
