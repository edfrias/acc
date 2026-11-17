// Lectura de hojas de cálculo de Excel sin dependencias: un .xlsx es un zip de XML. El zip se descomprime con
// DecompressionStream y el XML se lee con DOMParser, los dos del navegador (y de jsdom en los tests).

/** Una hoja como rejilla de celdas en texto. `cells[i]` es la fila i + 1 de la hoja (las vacías también están). */
export interface Sheet {
  name: string
  cells: string[][]
}

/** El fichero no es un .xlsx que se pueda leer. */
export class XlsxError extends Error {
  name = 'XlsxError'
}

const ZIP_LOCAL = 0x04034b50
const ZIP_CENTRAL = 0x02014b50
const ZIP_END = 0x06054b50

export function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true) === ZIP_LOCAL
}

/** Lee la primera hoja de un .xlsx (la primera con datos, si la primera está vacía). */
export async function readXlsx(bytes: Uint8Array): Promise<Sheet> {
  const zip = readZip(bytes)
  const read = async (path: string) => {
    const entry = zip.get(path)
    return entry ? new TextDecoder('utf-8').decode(await entry()) : null
  }
  const xml = (text: string) => new DOMParser().parseFromString(text, 'application/xml')

  const workbook = await read('xl/workbook.xml')
  if (!workbook) throw new XlsxError('No es un fichero de Excel (.xlsx): falta xl/workbook.xml.')
  const rels = xml((await read('xl/_rels/workbook.xml.rels')) ?? '<Relationships/>')
  const targets = new Map(
    [...rels.getElementsByTagName('Relationship')].map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']),
  )
  const strings = parseSharedStrings((await read('xl/sharedStrings.xml')) ?? '')

  const sheets = [...xml(workbook).getElementsByTagName('sheet')].map((sheet) => {
    const id = sheet.getAttribute('r:id') ?? sheet.getAttributeNS(REL_NS, 'id')
    const target = targets.get(id) ?? ''
    // El destino es relativo a xl/ o absoluto desde la raíz del zip
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`
    return { name: sheet.getAttribute('name') ?? '', path }
  })
  if (sheets.length === 0) throw new XlsxError('El libro no tiene hojas.')

  let first: Sheet | null = null
  for (const { name, path } of sheets) {
    const text = await read(path)
    if (!text) continue
    const parsed: Sheet = { name, cells: parseSheet(xml(text), strings) }
    first ??= parsed
    if (parsed.cells.some((row) => row.some((cell) => cell.trim() !== ''))) return parsed
  }
  if (!first) throw new XlsxError('No se encuentra ninguna hoja en el libro.')
  return first
}

const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

/** Textos compartidos: cada `<si>` es un texto, simple (`<t>`) o con formato (varios `<r><t>`). */
function parseSharedStrings(text: string): string[] {
  if (!text) return []
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  return [...doc.getElementsByTagName('si')].map(textOf)
}

/** Texto de un `<si>` o `<is>`: sus `<t>`, sin los de la guía fonética (`<rPh>`). */
function textOf(node: Element): string {
  return [...node.getElementsByTagName('t')]
    .filter((t) => t.parentElement?.localName !== 'rPh')
    .map((t) => t.textContent ?? '')
    .join('')
}

function parseSheet(doc: Document, strings: string[]): string[][] {
  const cells: string[][] = []
  for (const row of doc.getElementsByTagName('row')) {
    const rowIndex = Number(row.getAttribute('r')) - 1
    let col = 0
    for (const cell of row.getElementsByTagName('c')) {
      const ref = cell.getAttribute('r')
      if (ref) col = columnIndex(ref)
      const value = cellValue(cell, strings)
      const line = (cells[rowIndex >= 0 ? rowIndex : cells.length] ??= [])
      line[col] = value
      col++
    }
  }
  // Huecos (filas sin celdas, celdas que no aparecen) como texto vacío
  return Array.from(cells, (row) => Array.from(row ?? [], (cell) => cell ?? ''))
}

function cellValue(cell: Element, strings: string[]): string {
  const type = cell.getAttribute('t')
  if (type === 'inlineStr') {
    const is = cell.getElementsByTagName('is')[0]
    return is ? textOf(is) : ''
  }
  const v = cell.getElementsByTagName('v')[0]?.textContent ?? ''
  if (type === 's') return strings[Number(v)] ?? ''
  if (type === 'b') return v === '1' ? 'TRUE' : 'FALSE'
  // Números: Excel guarda el valor sin formato. Un número de licencia es entero; se quita el ruido de coma flotante.
  if ((type === null || type === 'n') && v !== '' && Number.isFinite(Number(v))) {
    const n = Number(v)
    return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(15)))
  }
  return v
}

/** "B12" → 1 (columna B). */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? 'A'
  let index = 0
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

/** Entradas de un zip: ruta → función que devuelve su contenido descomprimido. */
function readZip(bytes: Uint8Array): Map<string, () => Promise<Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // El final del directorio central está en los últimos 22 bytes más el comentario (hasta 64 KB)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === ZIP_END) {
      end = i
      break
    }
  }
  if (end === -1) throw new XlsxError('El fichero de Excel está dañado (zip sin directorio).')

  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  const entries = new Map<string, () => Promise<Uint8Array>>()
  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL) throw new XlsxError('El fichero de Excel está dañado.')
    const method = view.getUint16(offset + 10, true)
    const size = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const local = view.getUint32(offset + 42, true)
    const name = new TextDecoder('utf-8').decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    offset += 46 + nameLength + extraLength + commentLength

    entries.set(name, async () => {
      if (view.getUint32(local, true) !== ZIP_LOCAL) throw new XlsxError('El fichero de Excel está dañado.')
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
      const data = bytes.subarray(start, start + size)
      if (method === 0) return data
      if (method !== 8) throw new XlsxError(`Compresión de zip no soportada (${method}).`)
      return inflate(data)
    })
  }
  return entries
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(data as Uint8Array<ArrayBuffer>).body!.pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}
