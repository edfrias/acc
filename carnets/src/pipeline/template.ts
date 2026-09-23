import { compileSvg } from './svg/compile'
import { TemplateError } from './svg/errors'
import type { Template } from './types'

export { TemplateError }

/** Sangrado por lado, fijado por el contrato de la plantilla. */
export const BLEED_MM = 3

/** Lee el SVG, lo compila para el render y extrae los campos. Elimina `#guides` y `<metadata>`. */
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

  const { drawing, fields, fontWeights } = compileSvg(root)
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
    drawing,
    fontWeights,
  }
}
