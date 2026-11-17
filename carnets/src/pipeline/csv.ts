import Papa from 'papaparse'
import type { CsvDelimiter, CsvEncoding, ParsedCsv, RawRow } from './types'
import { isZip, readXlsx, XlsxError } from './xlsx'

export type CsvErrorCode = 'empty' | 'legacy-xls' | 'bad-xlsx'

const MESSAGES: Record<CsvErrorCode, string> = {
  empty: 'El fichero está vacío.',
  'legacy-xls': 'Formato de Excel antiguo (.xls binario): hay que guardarlo como .xlsx o .csv.',
  'bad-xlsx': 'El fichero de Excel no se puede leer.',
}

/** El fichero no se puede leer como lista de socios. `code` permite traducir el mensaje en la interfaz. */
export class CsvError extends Error {
  name = 'CsvError'
  code: CsvErrorCode

  constructor(code: CsvErrorCode, detail?: string) {
    super(detail ? `${MESSAGES[code]} ${detail}` : MESSAGES[code])
    this.code = code
  }
}

/** Firma de los ficheros OLE: el .xls binario de Excel 97-2003. */
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0]

/**
 * Lee la lista de socios. Acepta CSV (detecta separador y codificación: UTF-8, con reintento en Windows-1252),
 * Excel .xlsx (primera hoja con datos) y el .xls que en realidad es una tabla HTML (lo que exportan muchas webs).
 * Se decide por el contenido, no por la extensión. El .xls binario antiguo no se puede leer: error `legacy-xls`.
 */
export async function parseCsv(file: Blob): Promise<ParsedCsv> {
  return parseTableBytes(new Uint8Array(await file.arrayBuffer()))
}

export async function parseTableBytes(bytes: Uint8Array): Promise<ParsedCsv> {
  if (isZip(bytes)) {
    let sheet
    try {
      sheet = await readXlsx(bytes)
    } catch (error) {
      if (error instanceof XlsxError) throw new CsvError('bad-xlsx', error.message)
      throw error
    }
    return { ...fromCells(sheet.cells), format: 'xlsx', sheet: sheet.name, delimiter: null, encoding: null }
  }
  if (OLE_SIGNATURE.every((byte, i) => bytes[i] === byte)) throw new CsvError('legacy-xls')

  const { text, encoding } = decode(bytes)
  if (/^\s*</.test(text) && /<table[\s>]/i.test(text)) {
    return { ...fromCells(htmlTable(text)), format: 'html', sheet: null, delimiter: null, encoding }
  }
  return parseCsvBytes(bytes)
}

export function parseCsvBytes(bytes: Uint8Array): ParsedCsv {
  const { text, encoding } = decode(bytes)
  const delimiter = detectDelimiter(text)
  const { data } = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: false })
  // Papa no da números de línea: se asume una línea por registro (sin saltos dentro de comillas).
  return { ...fromCells(data), format: 'csv', sheet: null, delimiter, encoding }
}

/**
 * Cabecera (la primera fila con contenido) y registros de una rejilla de celdas. Las filas vacías se ignoran;
 * `cells[i]` es la fila i + 1 del fichero original, así que el número de fila de cada registro es el suyo.
 */
function fromCells(cells: string[][]): Pick<ParsedCsv, 'headers' | 'rows'> {
  const headerIndex = cells.findIndex((line) => !isEmptyRow(line))
  if (headerIndex === -1) throw new CsvError('empty')
  const headers = cells[headerIndex].map((h) => h.trim())

  const rows: RawRow[] = []
  for (let i = headerIndex + 1; i < cells.length; i++) {
    const line = cells[i]
    if (isEmptyRow(line)) continue
    const row: Record<string, string> = {}
    headers.forEach((header, col) => (row[header] = (line[col] ?? '').trim()))
    rows.push({ rowNumber: i + 1, data: row })
  }
  return { headers, rows }
}

/** Celdas de la primera tabla de un documento HTML. */
function htmlTable(text: string): string[][] {
  const table = new DOMParser().parseFromString(text, 'text/html').querySelector('table')
  if (!table) return []
  return [...table.querySelectorAll('tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim()),
  )
}

/**
 * Un fichero Latin-1/Windows-1252 leído como UTF-8 produce caracteres de reemplazo (�).
 * Windows-1252 decodifica cualquier byte, así que el reintento siempre da texto;
 * lo que siga mal codificado lo detecta validate() fila a fila.
 */
function decode(bytes: Uint8Array): { text: string; encoding: CsvEncoding } {
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  if (!utf8.includes('\uFFFD')) return { text: utf8, encoding: 'utf-8' }
  return { text: new TextDecoder('windows-1252').decode(bytes), encoding: 'windows-1252' }
}

/** Elige el separador que más aparece en la primera línea con contenido, fuera de comillas. */
function detectDelimiter(text: string): CsvDelimiter {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== '') ?? ''
  const unquoted = firstLine.replace(/"[^"]*"/g, '')
  const count = (char: string) => unquoted.split(char).length - 1
  return count(';') > count(',') ? ';' : ','
}

function isEmptyRow(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === '')
}
