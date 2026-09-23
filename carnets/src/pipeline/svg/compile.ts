import type {
  DrawNode,
  Geometry,
  GroupNode,
  Paint,
  ShapeNode,
  StrokePaint,
  TemplateField,
  TextAnchor,
  TextNode,
} from '../types'
import { TemplateError } from './errors'
import { parsePath } from './path'
import { computeStyle, parseColor, parseLength, parseNumberList, parseTransform, Stylesheet } from './style'
import type { Style } from './style'

/** Elementos que no se dibujan. `clipPath` solo se usa a través de `clip-path="url(#…)"`. */
const SKIPPED = new Set(['defs', 'style', 'title', 'desc', 'metadata', 'clipPath'])
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path'])
const ANCHORS: readonly TextAnchor[] = ['start', 'middle', 'end']

export interface CompiledTemplate {
  drawing: GroupNode
  fields: TemplateField[]
  fontWeights: number[]
}

/**
 * Convierte el SVG en un árbol de nodos que el render sabe dibujar.
 * Todo lo que no se soporta se rechaza aquí, al cargar la plantilla, y no al generar el PDF.
 */
export function compileSvg(root: Element): CompiledTemplate {
  const doc = root.ownerDocument
  const stylesheet = new Stylesheet([...doc.getElementsByTagName('style')].map((s) => s.textContent ?? '').join('\n'))
  const unsupported = new Set<string>()
  const fields: TemplateField[] = []
  const weights = new Set<number>()

  function walk(el: Element, parentStyle: Style, parentOpacity: number, isRoot = false): DrawNode | null {
    const tag = el.localName
    if (SKIPPED.has(tag)) return null
    if (!(isRoot ? tag === 'svg' : tag === 'g' || tag === 'text' || SHAPES.has(tag))) {
      unsupported.add(`<${tag}>`)
      return null
    }
    for (const attr of ['filter', 'mask']) {
      if (el.hasAttribute(attr)) unsupported.add(`${attr}=""`)
    }

    const style = computeStyle(el, parentStyle, stylesheet)
    if (style['display'] === 'none') return null
    const opacity = parentOpacity * number(style, 'opacity', 1)
    const transform = isRoot ? null : parseTransform(el.getAttribute('transform'))
    const clip = clipFor(el)

    let node: DrawNode | null
    if (tag === 'svg' || tag === 'g') {
      const children = [...el.children].map((child) => walk(child, style, opacity)).filter((n) => n !== null)
      return { type: 'group', transform, clip, children }
    } else if (hidden(style)) {
      node = null
    } else if (tag === 'text') {
      node = text(el, style, opacity)
    } else {
      node = shape(el, style, opacity)
    }
    if (node && (transform || clip)) return { type: 'group', transform, clip, children: [node] }
    return node
  }

  function text(el: Element, style: Style, opacity: number): TextNode {
    for (const child of el.children) {
      const positioned = ['x', 'y', 'dx', 'dy', 'rotate'].some((a) => child.hasAttribute(a))
      if (child.localName !== 'tspan' || positioned) unsupported.add(`<${child.localName}> dentro de <text>`)
    }
    const anchor = (style['text-anchor'] ?? 'start') as TextAnchor
    if (!ANCHORS.includes(anchor)) throw new TemplateError(`text-anchor no válido: "${anchor}".`)
    const fontWeight = parseWeight(style['font-weight'])
    weights.add(fontWeight)

    const node: TextNode = {
      type: 'text',
      x: coordinate(el, 'x'),
      y: coordinate(el, 'y'),
      // Espacios colapsados como en SVG por defecto.
      content: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      field: null,
      fontSize: number(style, 'font-size', 16),
      fontWeight,
      letterSpacing: number(style, 'letter-spacing', 0),
      anchor,
      fill: paint(style, 'fill', 'black', opacity),
    }
    if (el.hasAttribute('data-field')) {
      const field = readField(el, node)
      node.field = field.name
      fields.push(field)
    }
    return node
  }

  function clipFor(el: Element): Geometry[] | null {
    const value = el.getAttribute('clip-path')
    if (!value || value === 'none') return null
    const id = /^url\(\s*#([^)\s]+)\s*\)$/.exec(value)?.[1]
    const clipPath = id ? doc.getElementById(id) : null
    if (!clipPath || clipPath.localName !== 'clipPath') {
      throw new TemplateError(`clip-path no encontrado: "${value}".`)
    }
    if ((clipPath.getAttribute('clipPathUnits') ?? 'userSpaceOnUse') !== 'userSpaceOnUse' || clipPath.hasAttribute('transform')) {
      unsupported.add('clipPath con clipPathUnits o transform')
    }
    return [...clipPath.children].map((child) => {
      if (!SHAPES.has(child.localName) || child.hasAttribute('transform')) {
        unsupported.add(`<${child.localName}> con transform dentro de <clipPath>`)
      }
      return geometry(child)
    })
  }

  const drawing = walk(root, {}, 1, true) as GroupNode
  if (unsupported.size > 0) {
    throw new TemplateError(`La plantilla usa elementos de SVG no soportados: ${[...unsupported].join(', ')}.`)
  }
  return { drawing, fields, fontWeights: [...weights].sort((a, b) => a - b) }
}

function shape(el: Element, style: Style, opacity: number): ShapeNode {
  // Una línea no tiene área: nunca se rellena.
  const fill = el.localName === 'line' ? null : paint(style, 'fill', 'black', opacity)
  const strokeColor = paint(style, 'stroke', 'none', opacity)
  const stroke: StrokePaint | null = strokeColor && {
    ...strokeColor,
    width: number(style, 'stroke-width', 1),
    dash: dashes(style['stroke-dasharray']),
    lineCap: oneOf(style['stroke-linecap'], ['butt', 'round', 'square'] as const, 'butt'),
    lineJoin: oneOf(style['stroke-linejoin'], ['miter', 'round', 'bevel'] as const, 'miter'),
  }
  return {
    type: 'shape',
    geometry: geometry(el),
    fill,
    fillRule: style['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero',
    stroke,
  }
}

function geometry(el: Element): Geometry {
  const attr = (name: string, fallback = 0) => {
    const value = el.getAttribute(name)
    return value === null ? fallback : parseLength(value, `${name} de <${el.localName}>`)
  }
  switch (el.localName) {
    case 'rect': {
      const rx = el.getAttribute('rx')
      const ry = el.getAttribute('ry')
      return {
        kind: 'rect',
        x: attr('x'),
        y: attr('y'),
        width: attr('width'),
        height: attr('height'),
        rx: attr('rx', ry === null ? 0 : attr('ry')),
        ry: attr('ry', rx === null ? 0 : attr('rx')),
      }
    }
    case 'circle':
      return { kind: 'ellipse', cx: attr('cx'), cy: attr('cy'), rx: attr('r'), ry: attr('r') }
    case 'ellipse':
      return { kind: 'ellipse', cx: attr('cx'), cy: attr('cy'), rx: attr('rx'), ry: attr('ry') }
    case 'line':
      return { kind: 'polyline', points: [attr('x1'), attr('y1'), attr('x2'), attr('y2')], closed: false }
    case 'polyline':
    case 'polygon': {
      const points = parseNumberList(el.getAttribute('points') ?? '')
      if (points.length < 4 || points.length % 2 !== 0 || points.some(Number.isNaN)) {
        throw new TemplateError(`points no válido en <${el.localName}>.`)
      }
      return { kind: 'polyline', points, closed: el.localName === 'polygon' }
    }
    case 'path':
      return { kind: 'path', segments: parsePath(el.getAttribute('d') ?? '') }
    default:
      throw new TemplateError(`<${el.localName}> no es una forma.`)
  }
}

function readField(el: Element, node: TextNode): TemplateField {
  const name = el.getAttribute('data-field')?.trim() ?? ''
  if (!name) throw new TemplateError('Hay un <text> con data-field vacío.')
  const required = (attr: string) => {
    const value = el.getAttribute(attr)
    if (value === null) throw new TemplateError(`Al campo "${name}" le falta el atributo ${attr}.`)
    return parseLength(value, `${attr} del campo "${name}"`)
  }
  const maxWidth = required('data-max-width')
  const minSize = required('data-min-size')
  if (minSize > node.fontSize) throw new TemplateError(`En el campo "${name}", data-min-size es mayor que font-size.`)
  return {
    name,
    x: node.x,
    y: node.y,
    fontSize: node.fontSize,
    minSize,
    maxWidth,
    anchor: node.anchor,
    fontWeight: node.fontWeight,
    letterSpacing: node.letterSpacing,
    isStatic: el.getAttribute('data-static') === 'true',
  }
}

function paint(style: Style, property: 'fill' | 'stroke', fallback: string, opacity: number): Paint | null {
  const value = style[property] ?? fallback
  if (value.startsWith('url(')) throw new TemplateError(`Degradados y patrones no soportados (${property}="${value}").`)
  const color = parseColor(value)
  if (!color) return null
  const total = opacity * number(style, `${property}-opacity`, 1)
  return total > 0 ? { color, opacity: total } : null
}

function hidden(style: Style): boolean {
  return style['visibility'] === 'hidden' || style['visibility'] === 'collapse'
}

function number(style: Style, property: string, fallback: number): number {
  const value = style[property]
  return value === undefined ? fallback : parseLength(value, property)
}

/** `x` e `y` de un `<text>`: solo se admite un valor, no listas por carácter. */
function coordinate(el: Element, name: 'x' | 'y'): number {
  const value = el.getAttribute(name)
  if (value === null) return 0
  const list = parseNumberList(value)
  if (list.length !== 1 || Number.isNaN(list[0])) throw new TemplateError(`${name} no válido en <text>: "${value}".`)
  return list[0]
}

function dashes(value: string | undefined): number[] {
  if (!value || value === 'none') return []
  const list = parseNumberList(value)
  if (list.some((n) => Number.isNaN(n) || n < 0)) throw new TemplateError(`stroke-dasharray no válido: "${value}".`)
  // SVG repite una lista impar para hacerla par; PDF no.
  return list.length % 2 === 1 ? [...list, ...list] : list
}

function parseWeight(value: string | undefined): number {
  if (value === undefined || value === 'normal') return 400
  if (value === 'bold') return 700
  const weight = Number.parseInt(value, 10)
  if (Number.isNaN(weight)) throw new TemplateError(`font-weight no válido: "${value}".`)
  return weight
}

function oneOf<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return value !== undefined && (options as readonly string[]).includes(value) ? (value as T) : fallback
}
