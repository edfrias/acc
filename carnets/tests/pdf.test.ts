import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  buildPdf,
  impose,
  ImpositionError,
  loadFontSet,
  parseCsvBytes,
  parseTemplate,
  PT_PER_MM,
  validate,
} from '../src/pipeline'
import type { CardData, PdfOptions } from '../src/pipeline'
import { fontFiles, readBytes, readText } from './helpers'

const template = parseTemplate(readText('templates/plantilla-carnet-cr80.svg'))
const files = fontFiles()
const grid: PdfOptions = { imposition: { kind: 'grid', cols: 2, rows: 4 }, cropMarks: true }
const single: PdfOptions = { imposition: { kind: 'single' }, cropMarks: false }

const { rows } = parseCsvBytes(readBytes('fixtures/socios.csv'))
const { valid } = validate(
  rows,
  template,
  { mapping: { nombre: 'Nom', num_federado: 'Llicència' }, staticValues: { temporada: '2026-27' } },
  loadFontSet(files),
)

/** Texto de cada página, extraído con pdf.js como lo haría un visor. */
async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdf = await getDocument({ data: bytes.slice() }).promise
  const pages = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join('\n'))
  }
  return pages
}

describe('impose', () => {
  it('coloca 2 × 4 carnets centrados en un A4, tocándose por el sangrado', () => {
    const layout = impose(template, grid)
    expect(layout).toMatchObject({ pageWidth: 210, pageHeight: 297 })
    expect(layout.slots).toHaveLength(8)
    expect(layout.slots[0].x).toBeCloseTo((210 - 2 * 91.6) / 2)
    expect(layout.slots[0].y).toBeCloseTo((297 - 4 * 60) / 2)
    expect(layout.slots[1].x - layout.slots[0].x).toBeCloseTo(91.6)
    expect(layout.slots[2].y - layout.slots[0].y).toBeCloseTo(60)
  })

  it('pone una marca a cada lado de cada línea de corte, fuera del bloque', () => {
    const layout = impose(template, grid)
    // 4 cortes verticales × 2 (arriba y abajo) + 8 horizontales × 2 (izquierda y derecha).
    expect(layout.marks).toHaveLength(4 * 2 + 8 * 2)
    const top = layout.slots[0].y
    const topMarks = layout.marks.filter((m) => m.x1 === m.x2 && m.y1 < top)
    expect(topMarks).toHaveLength(4)
    for (const mark of topMarks) expect(Math.max(mark.y1, mark.y2)).toBeLessThan(top)
  })

  it('rechaza 2 × 5 en A4: con el sangrado ocupan 300 mm de alto', () => {
    expect(() => impose(template, { ...grid, imposition: { kind: 'grid', cols: 2, rows: 5 } })).toThrow(ImpositionError)
  })

  it('un carnet por página: la página mide lo que el carnet con sangrado', () => {
    expect(impose(template, single)).toMatchObject({ pageWidth: 91.6, pageHeight: 60, slots: [{ x: 0, y: 0 }], marks: [] })
  })

  it('un carnet por página con marcas deja margen para ellas', () => {
    const layout = impose(template, { ...single, cropMarks: true })
    expect(layout.pageWidth).toBeGreaterThan(91.6)
    expect(layout.marks).toHaveLength(8)
  })
})

describe('buildPdf', () => {
  it('reparte los carnets en páginas A4', async () => {
    const cards = [...valid, valid[0]]
    const doc = await PDFDocument.load(await buildPdf(cards, template, grid, files))
    expect(doc.getPageCount()).toBe(2)
    const { width, height } = doc.getPage(0).getSize()
    expect(width / PT_PER_MM).toBeCloseTo(210)
    expect(height / PT_PER_MM).toBeCloseTo(297)
  })

  it('escribe los datos de cada socio con sus caracteres', async () => {
    const [text] = await pageTexts(await buildPdf(valid, template, grid, files))
    for (const expected of ['Laia Col·lell Serra', 'Iñaki Muñoz Ibáñez', 'Pere Soler i Vilaça', '124692', '2026-27', 'ARQUERS CLUB CASTELLDEFELS']) {
      expect(text).toContain(expected)
    }
    // El texto de ejemplo de la plantilla no debe aparecer.
    expect(text).not.toContain('Nom Cognom Cognom')
  })

  it('la previsualización es un carnet en una página de su tamaño', async () => {
    const bytes = await buildPdf([valid[0]], template, single, files)
    const page = (await PDFDocument.load(bytes)).getPage(0)
    expect(page.getWidth() / PT_PER_MM).toBeCloseTo(91.6)
    expect(page.getHeight() / PT_PER_MM).toBeCloseTo(60)
    expect((await pageTexts(bytes))[0]).toContain('Jordi Martínez Peña')
  })

  it('exige un TTF para cada peso de la plantilla', async () => {
    const incomplete = { ...files }
    delete incomplete[800]
    await expect(buildPdf(valid, template, grid, incomplete)).rejects.toThrow(/peso 800/)
  })

  it('no genera un PDF vacío', async () => {
    const none: CardData[] = []
    await expect(buildPdf(none, template, grid, files)).rejects.toThrow(/No hay carnets/)
  })
})
