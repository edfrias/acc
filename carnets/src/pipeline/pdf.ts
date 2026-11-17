import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { PT_PER_MM, renderCard } from './render'
import type { CardData, FontFiles, PdfOptions, Template } from './types'

export const A4_MM = { width: 210, height: 297 }

/** Las marcas empiezan este tanto fuera del borde del sangrado, para que no se vean tras el corte. */
const MARK_GAP_MM = 1
const MARK_LENGTH_MM = 5
/** Margen mínimo del papel sin marcas: la mayoría de impresoras no llegan al borde. */
const MIN_MARGIN_MM = 5
const MARK_WIDTH_PT = 0.25

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Posición de cada carnet en la página. Todo en mm, con el origen arriba a la izquierda. */
export interface Layout {
  pageWidth: number
  pageHeight: number
  /** Esquina superior izquierda de cada carnet, con el sangrado incluido. */
  slots: { x: number; y: number }[]
  marks: Line[]
}

/** La imposición pedida no es posible. `code` permite traducir el mensaje en la interfaz. */
export class ImpositionError extends Error {
  name = 'ImpositionError'
  code: 'invalid-grid' | 'does-not-fit'
  cols: number
  rows: number

  constructor(code: 'invalid-grid' | 'does-not-fit', cols: number, rows: number, message: string) {
    super(message)
    this.code = code
    this.cols = cols
    this.rows = rows
  }
}

/**
 * Caras que van una al lado de la otra en cada hueco: 2 si la plantilla tiene reverso y se pide anverso y reverso
 * juntos; si no, 1.
 */
export function facesAcross(template: Template, options: PdfOptions): 1 | 2 {
  return template.sides === 2 && options.sides === 'side-by-side' ? 2 : 1
}

/**
 * Calcula dónde va cada carnet en la página y dónde van las marcas de corte. Con anverso y reverso juntos, cada
 * hueco es el par (el doble de ancho) y hay marcas para el corte de cada cara.
 */
export function impose(template: Template, options: PdfOptions): Layout {
  const { width: faceWidth, height: h, bleed } = template
  const across = facesAcross(template, options)
  const w = across * faceWidth
  const markSpace = options.cropMarks ? MARK_GAP_MM + MARK_LENGTH_MM : 0
  /** Líneas de corte verticales de un hueco que empieza en `x`: las dos de cada cara. */
  const cutsIn = (x: number) =>
    Array.from({ length: across }, (_, f) => [x + f * faceWidth + bleed, x + (f + 1) * faceWidth - bleed]).flat()

  if (options.imposition.kind === 'single') {
    const margin = options.cropMarks ? markSpace + 2 : 0
    const layout: Layout = { pageWidth: w + 2 * margin, pageHeight: h + 2 * margin, slots: [{ x: margin, y: margin }], marks: [] }
    if (options.cropMarks) layout.marks = cropMarks(layout, cutsIn(margin), [margin + bleed, margin + h - bleed], w, h)
    return layout
  }

  const { cols, rows } = options.imposition
  if (cols < 1 || rows < 1) {
    throw new ImpositionError('invalid-grid', cols, rows, 'La rejilla necesita al menos una fila y una columna.')
  }
  // Los carnets se tocan por el sangrado: cada corte separa dos carnets vecinos sin dejar tira de papel.
  const blockWidth = cols * w
  const blockHeight = rows * h
  const marginX = (A4_MM.width - blockWidth) / 2
  const marginY = (A4_MM.height - blockHeight) / 2
  const needed = Math.max(MIN_MARGIN_MM, markSpace + 1)
  if (marginX < needed || marginY < needed) {
    throw new ImpositionError(
      'does-not-fit',
      cols,
      rows,
      `No caben ${cols} × ${rows} carnets en un A4: ocupan ${blockWidth.toFixed(1)} × ${blockHeight.toFixed(1)} mm ` +
        `con el sangrado y hacen falta ${needed} mm de margen por lado.`,
    )
  }

  const slots = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) slots.push({ x: marginX + col * w, y: marginY + row * h })
  }
  const layout: Layout = { pageWidth: A4_MM.width, pageHeight: A4_MM.height, slots, marks: [] }
  if (options.cropMarks) {
    const cutsX = Array.from({ length: cols }, (_, c) => cutsIn(marginX + c * w)).flat()
    const cutsY = Array.from({ length: rows }, (_, r) => [marginY + r * h + bleed, marginY + (r + 1) * h - bleed]).flat()
    layout.marks = cropMarks(layout, cutsX, cutsY, w, h)
  }
  return layout
}

/**
 * Marcas en el margen, fuera del bloque de carnets, alineadas con cada línea de corte.
 * Nunca dentro del bloque: se imprimirían sobre el sangrado del carnet vecino.
 */
function cropMarks(layout: Layout, cutsX: number[], cutsY: number[], slotWidth: number, slotHeight: number): Line[] {
  const top = Math.min(...layout.slots.map((s) => s.y))
  const left = Math.min(...layout.slots.map((s) => s.x))
  const bottom = Math.max(...layout.slots.map((s) => s.y)) + slotHeight
  const right = Math.max(...layout.slots.map((s) => s.x)) + slotWidth
  const marks: Line[] = []
  for (const x of cutsX) {
    marks.push({ x1: x, y1: top - MARK_GAP_MM, x2: x, y2: top - MARK_GAP_MM - MARK_LENGTH_MM })
    marks.push({ x1: x, y1: bottom + MARK_GAP_MM, x2: x, y2: bottom + MARK_GAP_MM + MARK_LENGTH_MM })
  }
  for (const y of cutsY) {
    marks.push({ x1: left - MARK_GAP_MM, y1: y, x2: left - MARK_GAP_MM - MARK_LENGTH_MM, y2: y })
    marks.push({ x1: right + MARK_GAP_MM, y1: y, x2: right + MARK_GAP_MM + MARK_LENGTH_MM, y2: y })
  }
  return marks
}

/** PDF para la copistería: solo carnets, nunca páginas de errores. */
export async function buildPdf(
  cards: CardData[],
  template: Template,
  options: PdfOptions,
  fontFiles: FontFiles,
): Promise<Uint8Array> {
  if (cards.length === 0) throw new Error('No hay carnets que generar.')
  const layout = impose(template, options)

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle('Carnets · Arquers Club Castelldefels')
  doc.setProducer('Generador de carnets · Arquers Club Castelldefels')

  const fonts = new Map<number, PDFFont>()
  for (const weight of template.fontWeights) {
    const bytes = fontFiles[weight]
    if (!bytes) throw new Error(`Falta el fichero de la fuente Inter con peso ${weight}.`)
    fonts.set(weight, await doc.embedFont(bytes, { subset: true }))
  }

  const pt = (mm: number) => mm * PT_PER_MM
  const pageHeight = pt(layout.pageHeight)
  const sheet = (draw: (page: PDFPage) => void) => {
    const page = doc.addPage([pt(layout.pageWidth), pageHeight])
    draw(page)
    for (const mark of layout.marks) {
      page.drawLine({
        start: { x: pt(mark.x1), y: pageHeight - pt(mark.y1) },
        end: { x: pt(mark.x2), y: pageHeight - pt(mark.y2) },
        thickness: MARK_WIDTH_PT,
        color: rgb(0, 0, 0),
      })
    }
  }

  const perPage = layout.slots.length
  const batches: CardData[][] = []
  for (let start = 0; start < cards.length; start += perPage) batches.push(cards.slice(start, start + perPage))
  const draw = (page: PDFPage, card: CardData, x: number, y: number, side: 0 | 1) =>
    renderCard(page, card, template, fonts, { x: pt(x), y: pageHeight - pt(y) }, side)

  if (facesAcross(template, options) === 2) {
    // Anverso y reverso juntos: cada carnet ocupa su hueco con la cara a la izquierda y el reverso a la derecha
    for (const batch of batches) {
      sheet((page) =>
        batch.forEach((card, i) => {
          const slot = layout.slots[i]
          draw(page, card, slot.x, slot.y, 0)
          draw(page, card, slot.x + template.width, slot.y, 1)
        }),
      )
    }
    return doc.save()
  }

  for (const batch of batches) {
    sheet((page) => batch.forEach((card, i) => draw(page, card, layout.slots[i].x, layout.slots[i].y, 0)))
  }
  // Con dos caras, después de todos los anversos van todos los reversos, en el mismo orden de hojas y en espejo:
  // la hoja n de reversos va detrás de la hoja n de anversos al imprimir a doble cara volteando por el lado largo.
  // El bloque está centrado, así que las marcas coinciden.
  if (template.sides === 2) {
    for (const batch of batches) {
      sheet((page) =>
        batch.forEach((card, i) => {
          const slot = layout.slots[i]
          draw(page, card, layout.pageWidth - slot.x - template.width, slot.y, 1)
        }),
      )
    }
  }
  return doc.save()
}
