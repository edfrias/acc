import Papa from 'papaparse'
import type { CsvDelimiter, CsvEncoding, ParsedCsv, RawRow } from './types'

/** El fichero no se puede leer como CSV de socios. `code` permite traducir el mensaje en la interfaz. */
export class CsvError extends Error {
  name = 'CsvError'
  code: 'empty'

  constructor(code: 'empty') {
    super('El fichero está vacío.')
    this.code = code
  }
}

/** Detecta separador y codificación (UTF-8, con reintento en Windows-1252). */
export async function parseCsv(file: Blob): Promise<ParsedCsv> {
  return parseCsvBytes(new Uint8Array(await file.arrayBuffer()))
}

export function parseCsvBytes(bytes: Uint8Array): ParsedCsv {
  const { text, encoding } = decode(bytes)
  const delimiter = detectDelimiter(text)
  const { data } = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: false })

  const headerIndex = data.findIndex((cells) => !isEmptyRow(cells))
  if (headerIndex === -1) throw new CsvError('empty')
  const headers = data[headerIndex].map((h) => h.trim())

  const rows: RawRow[] = []
  for (let i = headerIndex + 1; i < data.length; i++) {
    const cells = data[i]
    if (isEmptyRow(cells)) continue
    const row: Record<string, string> = {}
    headers.forEach((header, col) => (row[header] = (cells[col] ?? '').trim()))
    // Papa no da números de línea: se asume una línea por registro (sin saltos dentro de comillas).
    rows.push({ rowNumber: i + 1, data: row })
  }

  return { headers, rows, delimiter, encoding }
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
