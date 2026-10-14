import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'
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

const template = parseTemplate(readText('fixtures/plantilla-una-cara.svg'))
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

  it('dibuja los textos con contorno en el modo de texto que corresponde', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.6 60">' +
      '<text x="5" y="20" font-weight="800" fill="#ffffff" stroke="#00579b" stroke-width="0.4">26-27</text>' +
      '<text x="5" y="40" font-weight="800" fill="none" stroke="#ffffff" stroke-width="0.2">26-27</text>' +
      '<text x="5" y="50" font-weight="800">26-27</text></svg>'
    const outlined = parseTemplate(svg)
    const bytes = await buildPdf([{ rowNumber: 0, values: {}, fontSizes: {} }], outlined, single, files)
    const page = await (await getDocument({ data: bytes.slice() }).promise).getPage(1)
    const { fnArray, argsArray } = await page.getOperatorList()
    const modes = fnArray.flatMap((fn, i) => (fn === OPS.setTextRenderingMode ? [argsArray[i][0]] : []))
    // 2: relleno y contorno; 1: solo contorno; 0: solo relleno
    expect(modes).toEqual([2, 1, 0])
  })

  describe('dos caras', () => {
    // La cara lleva el nombre y el reverso (debajo, en y = 60..120) la licencia, para saber qué es cada cosa
    const duplex = parseTemplate(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.6 120" data-sides="2">' +
        '<text data-field="nombre" data-max-width="70" data-min-size="2" x="10" y="30" font-weight="700">Nom</text>' +
        '<text data-field="num_federado" data-max-width="70" data-min-size="2" x="10" y="90" font-weight="700">0</text>' +
        '</svg>',
    )
    const cardsFor = (n: number): CardData[] =>
      Array.from({ length: n }, (_, i) => ({
        rowNumber: i + 2,
        values: { nombre: `Soci ${i + 1}`, num_federado: `${1000 + i}` },
        fontSizes: { nombre: 4, num_federado: 4 },
      }))

    /** Posición x (mm) de cada texto de cada página. */
    async function textX(bytes: Uint8Array): Promise<Record<string, number>[]> {
      const pdf = await getDocument({ data: bytes.slice() }).promise
      const pages = []
      for (let n = 1; n <= pdf.numPages; n++) {
        const items = (await (await pdf.getPage(n)).getTextContent()).items
        pages.push(Object.fromEntries(items.flatMap((it) => ('str' in it && it.str.trim() ? [[it.str, it.transform[4] / PT_PER_MM]] : []))))
      }
      return pages
    }

    it('detrás de cada hoja de caras va su hoja de reversos', async () => {
      const doc = await PDFDocument.load(await buildPdf(cardsFor(9), duplex, grid, files))
      expect(doc.getPageCount()).toBe(4)
    })

    it('los reversos van en espejo: el de la columna izquierda cae a la derecha', async () => {
      const [front, back] = await textX(await buildPdf(cardsFor(2), duplex, grid, files))
      const marginX = (210 - 2 * 91.6) / 2
      expect(front['Soci 1']).toBeCloseTo(marginX + 10)
      expect(front['Soci 2']).toBeCloseTo(marginX + 91.6 + 10)
      expect(back['1000']).toBeCloseTo(marginX + 91.6 + 10)
      expect(back['1001']).toBeCloseTo(marginX + 10)
    })

    it('un carnet por página: cara y reverso seguidos, del tamaño del carnet', async () => {
      const bytes = await buildPdf(cardsFor(2), duplex, single, files)
      const doc = await PDFDocument.load(bytes)
      expect(doc.getPageCount()).toBe(4)
      expect(doc.getPage(1).getHeight() / PT_PER_MM).toBeCloseTo(60)
      const pages = await textX(bytes)
      expect(Object.keys(pages[1])).toContain('1000')
      expect(Object.keys(pages[2])).toContain('Soci 2')
    })

    it('la plantilla oficial genera las dos caras con los datos del socio', async () => {
      const official = parseTemplate(readText('templates/plantilla-carnet-2026-27.svg'))
      const card = { ...valid[0], values: { ...valid[0].values, temporada: '2026-2027' } }
      const texts = await pageTexts(await buildPdf([card], official, single, files))
      expect(texts).toHaveLength(2)
      expect(texts[0]).toContain('Jordi Martínez Peña')
      expect(texts[0]).toContain('2026-2027')
      expect(texts[1]).toContain('secretaria@arquerscastelldefels.com')
    })
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
