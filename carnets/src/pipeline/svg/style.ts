import type { Matrix, Rgb } from '../types'
import { TemplateError } from './errors'

/** Propiedades de estilo que entiende el render. El resto se ignora. */
const PROPERTIES = new Set([
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'display',
  'visibility',
  'font-size',
  'font-weight',
  'letter-spacing',
  'text-anchor',
])

/** Todas se heredan salvo `opacity` y `display`, como en SVG. */
const NOT_INHERITED = new Set(['opacity', 'display'])

export type Style = Record<string, string>

interface Rule {
  tag: string | null
  id: string | null
  classes: string[]
  specificity: number
  order: number
  declarations: Style
}

/** Hoja de estilos de los `<style>` de la plantilla. Solo selectores simples: `tag`, `#id`, `.clase` y combinaciones. */
export class Stylesheet {
  private rules: Rule[] = []

  constructor(css: string) {
    const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
    for (const [, selectors, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const declarations = parseDeclarations(body)
      for (const selector of selectors.split(',').map((s) => s.trim())) {
        const match = /^([a-zA-Z][\w-]*)?(#[\w-]+)?((?:\.[\w-]+)*)$/.exec(selector)
        if (!selector || !match) throw new TemplateError(`Selector CSS no soportado en la plantilla: "${selector}".`)
        const [, tag, id, classList] = match
        const classes = classList ? classList.slice(1).split('.') : []
        this.rules.push({
          tag: tag ?? null,
          id: id ? id.slice(1) : null,
          classes,
          specificity: (id ? 100 : 0) + classes.length * 10 + (tag ? 1 : 0),
          order: this.rules.length,
          declarations,
        })
      }
    }
    this.rules.sort((a, b) => a.specificity - b.specificity || a.order - b.order)
  }

  matching(el: Element): Style[] {
    const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
    return this.rules
      .filter(
        (rule) =>
          (rule.tag === null || rule.tag === el.localName) &&
          (rule.id === null || rule.id === el.getAttribute('id')) &&
          rule.classes.every((c) => classes.includes(c)),
      )
      .map((rule) => rule.declarations)
  }
}

function parseDeclarations(body: string): Style {
  const style: Style = {}
  for (const declaration of body.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    if (PROPERTIES.has(name)) style[name] = declaration.slice(colon + 1).trim()
  }
  return style
}

/** Estilo resuelto de un elemento: heredado < atributos de presentación < CSS < `style=""`. */
export function computeStyle(el: Element, parent: Style, stylesheet: Stylesheet): Style {
  const style: Style = {}
  for (const [name, value] of Object.entries(parent)) {
    if (!NOT_INHERITED.has(name)) style[name] = value
  }
  for (const attr of el.attributes) {
    if (PROPERTIES.has(attr.name)) style[attr.name] = attr.value.trim()
  }
  for (const declarations of stylesheet.matching(el)) Object.assign(style, declarations)
  Object.assign(style, parseDeclarations(el.getAttribute('style') ?? ''))
  return style
}

/** Longitud en unidades de usuario (mm). `px` y sin unidad valen lo mismo, como en SVG. */
export function parseLength(value: string, what: string): number {
  const match = /^(-?[\d.]+(?:e-?\d+)?)(px)?$/i.exec(value.trim())
  if (!match) throw new TemplateError(`Valor no soportado en ${what}: "${value}". Usa números sin unidades.`)
  return Number.parseFloat(match[1])
}

export function parseNumberList(value: string): number[] {
  return value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  gray: '#808080',
  grey: '#808080',
}

/** `null` para `none` o `transparent`. */
export function parseColor(value: string): Rgb | null {
  const color = value.trim().toLowerCase()
  if (color === 'none' || color === 'transparent') return null
  const hex = NAMED_COLORS[color] ?? color

  let match = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(hex)
  if (match) return rgb(...match.slice(1).map((c) => Number.parseInt(c + c, 16)))
  match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(hex)
  if (match) return rgb(...match.slice(1).map((c) => Number.parseInt(c, 16)))
  match = /^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/.exec(hex)
  if (match) return rgb(...match.slice(1).map(Number))

  throw new TemplateError(`Color no soportado en la plantilla: "${value}". Usa #rrggbb, rgb() o none.`)
}

function rgb(...[r, g, b]: number[]): Rgb {
  return { r: r / 255, g: g / 255, b: b / 255 }
}

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

/** m1 × m2: primero se aplica m2 y luego m1, como una lista de `transform` en SVG. */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a, b, c, d, e, f] = m1
  const [a2, b2, c2, d2, e2, f2] = m2
  return [a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f]
}

/** Atributo `transform` de SVG. `null` si no hay transformación. */
export function parseTransform(value: string | null): Matrix | null {
  if (!value?.trim()) return null
  let matrix = IDENTITY
  const source = value.trim()
  const pattern = /([a-zA-Z]+)\s*\(([^)]*)\)\s*,?\s*/y
  let match: RegExpExecArray | null
  let consumed = 0
  while ((match = pattern.exec(source))) {
    consumed = pattern.lastIndex
    matrix = multiply(matrix, transformFunction(match[1], parseNumberList(match[2]), value))
  }
  if (consumed !== source.length) throw new TemplateError(`transform no válido: "${value}".`)
  return matrix
}

function transformFunction(name: string, args: number[], source: string): Matrix {
  const deg = (angle: number) => (angle * Math.PI) / 180
  switch (name) {
    case 'matrix':
      if (args.length === 6) return args as Matrix
      break
    case 'translate':
      if (args.length === 1 || args.length === 2) return [1, 0, 0, 1, args[0], args[1] ?? 0]
      break
    case 'scale':
      if (args.length === 1 || args.length === 2) return [args[0], 0, 0, args[1] ?? args[0], 0, 0]
      break
    case 'rotate': {
      if (args.length !== 1 && args.length !== 3) break
      const [angle, cx = 0, cy = 0] = args
      const cos = Math.cos(deg(angle))
      const sin = Math.sin(deg(angle))
      const rotation: Matrix = [cos, sin, -sin, cos, 0, 0]
      return multiply(multiply([1, 0, 0, 1, cx, cy], rotation), [1, 0, 0, 1, -cx, -cy])
    }
    case 'skewX':
      if (args.length === 1) return [1, 0, Math.tan(deg(args[0])), 1, 0, 0]
      break
    case 'skewY':
      if (args.length === 1) return [1, Math.tan(deg(args[0])), 0, 1, 0, 0]
      break
  }
  throw new TemplateError(`transform no válido: "${source}".`)
}
