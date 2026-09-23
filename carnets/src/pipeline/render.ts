import {
  appendBezierCurve,
  beginText,
  clip,
  closePath,
  concatTransformationMatrix,
  endPath,
  endText,
  lineTo,
  LineCapStyle,
  LineJoinStyle,
  moveTo,
  PDFName,
  PDFOperator,
  PDFOperatorNames,
  popGraphicsState,
  pushGraphicsState,
  setCharacterSpacing,
  setDashPattern,
  setFillingRgbColor,
  setFontAndSize,
  setGraphicsState,
  setLineCap,
  setLineJoin,
  setLineWidth,
  setStrokingRgbColor,
  setTextMatrix,
  showText,
} from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import type { CardData, DrawNode, Geometry, GroupNode, ShapeNode, Template, TextNode } from './types'

export const PT_PER_MM = 72 / 25.4

/** Fuentes incrustadas en el PDF, por peso. */
export type EmbeddedFonts = ReadonlyMap<number, PDFFont>

/** Constante para aproximar un cuarto de elipse con una Bézier cúbica. */
const KAPPA = 0.5522847498

/**
 * Dibuja un carnet en `page`. `origin` es la esquina superior izquierda del carnet (con sangrado), en pt.
 * El contenido se dibuja en coordenadas SVG (mm, y hacia abajo) gracias a una matriz que invierte el eje y.
 */
export function renderCard(
  page: PDFPage,
  card: CardData,
  template: Template,
  fonts: EmbeddedFonts,
  origin: { x: number; y: number },
): void {
  const ops: PDFOperator[] = [
    pushGraphicsState(),
    concatTransformationMatrix(PT_PER_MM, 0, 0, -PT_PER_MM, origin.x, origin.y),
  ]
  drawGroup(resourcesFor(page, fonts), card, template.drawing, ops)
  ops.push(popGraphicsState())
  page.pushOperators(...ops)
}

function drawNode(res: PageResources, card: CardData, node: DrawNode, ops: PDFOperator[]): void {
  if (node.type === 'group') drawGroup(res, card, node, ops)
  else if (node.type === 'shape') drawShape(res, node, ops)
  else drawText(res, card, node, ops)
}

function drawGroup(res: PageResources, card: CardData, group: GroupNode, ops: PDFOperator[]): void {
  ops.push(pushGraphicsState())
  if (group.transform) ops.push(concatTransformationMatrix(...group.transform))
  if (group.clip) {
    for (const geometry of group.clip) ops.push(...geometryOps(geometry))
    ops.push(clip(), endPath())
  }
  for (const child of group.children) drawNode(res, card, child, ops)
  ops.push(popGraphicsState())
}

function drawShape(res: PageResources, shape: ShapeNode, ops: PDFOperator[]): void {
  const { fill, stroke } = shape
  if (!fill && !stroke) return
  ops.push(pushGraphicsState())
  const alpha = res.opacity(fill?.opacity ?? 1, stroke?.opacity ?? 1)
  if (alpha) ops.push(setGraphicsState(alpha))
  if (fill) ops.push(setFillingRgbColor(fill.color.r, fill.color.g, fill.color.b))
  if (stroke) {
    ops.push(
      setStrokingRgbColor(stroke.color.r, stroke.color.g, stroke.color.b),
      setLineWidth(stroke.width),
      setLineCap(LINE_CAPS[stroke.lineCap]),
      setLineJoin(LINE_JOINS[stroke.lineJoin]),
      setDashPattern(stroke.dash, 0),
    )
  }
  ops.push(...geometryOps(shape.geometry))
  const evenOdd = shape.fillRule === 'evenodd'
  if (fill && stroke) ops.push(PDFOperator.of(evenOdd ? PDFOperatorNames.FillEvenOddAndStroke : PDFOperatorNames.FillNonZeroAndStroke))
  else if (fill) ops.push(PDFOperator.of(evenOdd ? PDFOperatorNames.FillEvenOdd : PDFOperatorNames.FillNonZero))
  else ops.push(PDFOperator.of(PDFOperatorNames.StrokePath))
  ops.push(popGraphicsState())
}

function drawText(res: PageResources, card: CardData, node: TextNode, ops: PDFOperator[]): void {
  const content = node.field === null ? node.content : (card.values[node.field] ?? '')
  const size = node.field === null ? node.fontSize : (card.fontSizes[node.field] ?? node.fontSize)
  if (!node.fill || content === '') return

  const font = res.font(node.fontWeight)
  const width = font.widthOfTextAtSize(content, size) + node.letterSpacing * [...content].length
  const x = node.anchor === 'middle' ? node.x - width / 2 : node.anchor === 'end' ? node.x - width : node.x

  ops.push(pushGraphicsState())
  const alpha = res.opacity(node.fill.opacity, 1)
  if (alpha) ops.push(setGraphicsState(alpha))
  ops.push(
    setFillingRgbColor(node.fill.color.r, node.fill.color.g, node.fill.color.b),
    beginText(),
    setFontAndSize(res.fontKey(font), size),
    // El eje y ya está invertido: la matriz de texto lo vuelve a invertir para que las letras no salgan del revés.
    setTextMatrix(1, 0, 0, -1, x, node.y),
    setCharacterSpacing(node.letterSpacing),
    showText(font.encodeText(content)),
    endText(),
    popGraphicsState(),
  )
}

function geometryOps(geometry: Geometry): PDFOperator[] {
  switch (geometry.kind) {
    case 'path':
      return geometry.segments.map((s) =>
        s.op === 'M' ? moveTo(s.x, s.y)
        : s.op === 'L' ? lineTo(s.x, s.y)
        : s.op === 'C' ? appendBezierCurve(s.x1, s.y1, s.x2, s.y2, s.x, s.y)
        : closePath(),
      )
    case 'polyline': {
      const [x0, y0, ...rest] = geometry.points
      const ops = [moveTo(x0, y0)]
      for (let i = 0; i + 1 < rest.length; i += 2) ops.push(lineTo(rest[i], rest[i + 1]))
      if (geometry.closed) ops.push(closePath())
      return ops
    }
    case 'ellipse':
      return ellipseOps(geometry.cx, geometry.cy, geometry.rx, geometry.ry)
    case 'rect':
      return rectOps(geometry)
  }
}

function ellipseOps(cx: number, cy: number, rx: number, ry: number): PDFOperator[] {
  const ox = rx * KAPPA
  const oy = ry * KAPPA
  return [
    moveTo(cx + rx, cy),
    appendBezierCurve(cx + rx, cy + oy, cx + ox, cy + ry, cx, cy + ry),
    appendBezierCurve(cx - ox, cy + ry, cx - rx, cy + oy, cx - rx, cy),
    appendBezierCurve(cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry),
    appendBezierCurve(cx + ox, cy - ry, cx + rx, cy - oy, cx + rx, cy),
    closePath(),
  ]
}

function rectOps({ x, y, width: w, height: h, rx, ry }: Extract<Geometry, { kind: 'rect' }>): PDFOperator[] {
  const r = Math.min(rx, w / 2)
  const s = Math.min(ry, h / 2)
  if (r <= 0 || s <= 0) {
    return [moveTo(x, y), lineTo(x + w, y), lineTo(x + w, y + h), lineTo(x, y + h), closePath()]
  }
  const kr = r * KAPPA
  const ks = s * KAPPA
  return [
    moveTo(x + r, y),
    lineTo(x + w - r, y),
    appendBezierCurve(x + w - r + kr, y, x + w, y + s - ks, x + w, y + s),
    lineTo(x + w, y + h - s),
    appendBezierCurve(x + w, y + h - s + ks, x + w - r + kr, y + h, x + w - r, y + h),
    lineTo(x + r, y + h),
    appendBezierCurve(x + r - kr, y + h, x, y + h - s + ks, x, y + h - s),
    lineTo(x, y + s),
    appendBezierCurve(x, y + s - ks, x + r - kr, y, x + r, y),
    closePath(),
  ]
}

const LINE_CAPS = { butt: LineCapStyle.Butt, round: LineCapStyle.Round, square: LineCapStyle.Projecting }
const LINE_JOINS = { miter: LineJoinStyle.Miter, round: LineJoinStyle.Round, bevel: LineJoinStyle.Bevel }

/** Fuentes y estados de opacidad registrados en una página: cada uno se registra una sola vez. */
class PageResources {
  private fontKeys = new Map<PDFFont, PDFName>()
  private alphaKeys = new Map<string, PDFName>()
  private page: PDFPage
  private fonts: EmbeddedFonts

  constructor(page: PDFPage, fonts: EmbeddedFonts) {
    this.page = page
    this.fonts = fonts
  }

  font(weight: number): PDFFont {
    const font = this.fonts.get(weight)
    if (!font) throw new Error(`No hay fuente cargada para el peso ${weight}.`)
    return font
  }

  fontKey(font: PDFFont): PDFName {
    let key = this.fontKeys.get(font)
    if (!key) {
      key = this.page.node.newFontDictionary(font.name, font.ref)
      this.fontKeys.set(font, key)
    }
    return key
  }

  /** Estado gráfico con la opacidad de relleno y trazo; `null` si ambas son 1. */
  opacity(fill: number, stroke: number): PDFName | null {
    if (fill >= 1 && stroke >= 1) return null
    const id = `${fill}/${stroke}`
    let key = this.alphaKeys.get(id)
    if (!key) {
      const state = this.page.doc.context.obj({ Type: 'ExtGState', ca: fill, CA: stroke })
      key = this.page.node.newExtGState('GS', state)
      this.alphaKeys.set(id, key)
    }
    return key
  }
}

const RESOURCES = new WeakMap<PDFPage, PageResources>()

function resourcesFor(page: PDFPage, fonts: EmbeddedFonts): PageResources {
  let resources = RESOURCES.get(page)
  if (!resources) {
    resources = new PageResources(page, fonts)
    RESOURCES.set(page, resources)
  }
  return resources
}
