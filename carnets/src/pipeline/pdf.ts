import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
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

export class ImpositionError extends Error {
  name = 'ImpositionError'
}

/** Calcula dónde va cada carnet en la página y dónde van las marcas de corte. */
export function impose(template: Template, options: PdfOptions): Layout {
  const { width: w, height: h, bleed } = template
  const markSpace = options.cropMarks ? MARK_GAP_MM + MARK_LENGTH_MM : 0

  if (options.imposition.kind === 'single') {
    const margin = options.cropMarks ? markSpace + 2 : 0
    const layout: Layout = { pageWidth: w + 2 * margin, pageHeight: h + 2 * margin, slots: [{ x: margin, y: margin }], marks: [] }
    if (options.cropMarks) layout.marks = cropMarks(layout, [margin + bleed, margin + w - bleed], [margin + bleed, margin + h - bleed], template)
    return layout
  }

  const { cols, rows } = options.imposition
  if (cols < 1 || rows < 1) throw new ImpositionError('La rejilla necesita al menos una fila y una columna.')
  // Los carnets se tocan por el sangrado: cada corte separa dos carnets vecinos sin dejar tira de papel.
  const blockWidth = cols * w
  const blockHeight = rows * h
  const marginX = (A4_MM.width - blockWidth) / 2
  const marginY = (A4_MM.height - blockHeight) / 2
  const needed = Math.max(MIN_MARGIN_MM, markSpace + 1)
  if (marginX < needed || marginY < needed) {
    throw new ImpositionError(
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
    const cutsX = Array.from({ length: cols }, (_, c) => [marginX + c * w + bleed, marginX + (c + 1) * w - bleed]).flat()
    const cutsY = Array.from({ length: rows }, (_, r) => [marginY + r * h + bleed, marginY + (r + 1) * h - bleed]).flat()
    layout.marks = cropMarks(layout, cutsX, cutsY, template)
  }
  return layout
}

/**
 * Marcas en el margen, fuera del bloque de carnets, alineadas con cada línea de corte.
 * Nunca dentro del bloque: se imprimirían sobre el sangrado del carnet vecino.
 */
function cropMarks(layout: Layout, cutsX: number[], cutsY: number[], template: Template): Line[] {
  const top = Math.min(...layout.slots.map((s) => s.y))
  const left = Math.min(...layout.slots.map((s) => s.x))
  const bottom = Math.max(...layout.slots.map((s) => s.y)) + template.height
  const right = Math.max(...layout.slots.map((s) => s.x)) + template.width
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
  const perPage = layout.slots.length
  for (let start = 0; start < cards.length; start += perPage) {
    const page = doc.addPage([pt(layout.pageWidth), pt(layout.pageHeight)])
    const pageHeight = pt(layout.pageHeight)
    cards.slice(start, start + perPage).forEach((card, i) => {
      const slot = layout.slots[i]
      renderCard(page, card, template, fonts, { x: pt(slot.x), y: pageHeight - pt(slot.y) })
    })
    for (const mark of layout.marks) {
      page.drawLine({
        start: { x: pt(mark.x1), y: pageHeight - pt(mark.y1) },
        end: { x: pt(mark.x2), y: pageHeight - pt(mark.y2) },
        thickness: MARK_WIDTH_PT,
        color: rgb(0, 0, 0),
      })
    }
  }
  return doc.save()
}
