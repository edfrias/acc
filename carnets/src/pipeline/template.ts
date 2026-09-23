import type { Template, TemplateField, TextAnchor } from './types'

/** Sangrado por lado, fijado por el contrato de la plantilla. */
export const BLEED_MM = 3

export class TemplateError extends Error {
  name = 'TemplateError'
}

const ANCHORS: readonly TextAnchor[] = ['start', 'middle', 'end']

/** Lee el SVG, extrae los campos y elimina `#guides` y `<metadata>`. */
export function parseTemplate(svg: string): Template {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (doc.querySelector('parsererror') || root.localName !== 'svg') {
    throw new TemplateError('El fichero no es un SVG válido.')
  }

  const viewBox = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  if (viewBox.length !== 4 || viewBox.some(Number.isNaN) || viewBox[0] !== 0 || viewBox[1] !== 0) {
    throw new TemplateError('La plantilla necesita un viewBox en mm que empiece en 0 0 (p. ej. "0 0 91.6 60").')
  }

  doc.getElementById('guides')?.remove()
  for (const el of [...doc.getElementsByTagName('metadata')]) el.remove()

  const fields = [...doc.querySelectorAll('text[data-field]')].map(readField)
  const names = new Set<string>()
  for (const field of fields) {
    if (names.has(field.name)) throw new TemplateError(`El campo "${field.name}" aparece más de una vez.`)
    names.add(field.name)
  }

  return {
    svg: new XMLSerializer().serializeToString(doc),
    width: viewBox[2],
    height: viewBox[3],
    bleed: BLEED_MM,
    fields,
  }
}

function readField(el: Element): TemplateField {
  const name = el.getAttribute('data-field')?.trim() ?? ''
  if (!name) throw new TemplateError('Hay un <text> con data-field vacío.')

  const num = (attr: string, fallback?: number): number => {
    const raw = el.getAttribute(attr)
    if (raw === null) {
      if (fallback !== undefined) return fallback
      throw new TemplateError(`Al campo "${name}" le falta el atributo ${attr}.`)
    }
    const value = Number.parseFloat(raw)
    if (Number.isNaN(value)) throw new TemplateError(`El atributo ${attr} del campo "${name}" no es un número: "${raw}".`)
    return value
  }

  const anchor = (el.getAttribute('text-anchor') ?? 'start') as TextAnchor
  if (!ANCHORS.includes(anchor)) throw new TemplateError(`text-anchor no válido en el campo "${name}": "${anchor}".`)

  const fontSize = num('font-size')
  const minSize = num('data-min-size')
  if (minSize > fontSize) throw new TemplateError(`En el campo "${name}", data-min-size es mayor que font-size.`)

  return {
    name,
    x: num('x'),
    y: num('y'),
    fontSize,
    minSize,
    maxWidth: num('data-max-width'),
    anchor,
    fontWeight: parseWeight(el.getAttribute('font-weight'), name),
    letterSpacing: num('letter-spacing', 0),
    isStatic: el.getAttribute('data-static') === 'true',
  }
}

function parseWeight(raw: string | null, field: string): number {
  if (raw === null || raw === 'normal') return 400
  if (raw === 'bold') return 700
  const weight = Number.parseInt(raw, 10)
  if (Number.isNaN(weight)) throw new TemplateError(`font-weight no válido en el campo "${field}": "${raw}".`)
  return weight
}
