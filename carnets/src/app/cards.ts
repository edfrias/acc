import { unitWidth } from '../pipeline/fonts'
import { formatName, NAME_FIELD } from '../pipeline'
import type { CardData, DrawNode, FontSet, NameCase, Template } from '../pipeline'

/**
 * Carnet con el texto de ejemplo de la plantilla, para previsualizarla antes de cargar socios.
 * Los campos estáticos ya configurados se muestran con su valor, y el nombre con las mayúsculas elegidas.
 */
export function sampleCard(template: Template, staticValues: Record<string, string>, nameCase?: NameCase): CardData {
  const card: CardData = { rowNumber: 0, values: {}, fontSizes: {} }
  const visit = (node: DrawNode) => {
    if (node.type === 'group') node.children.forEach(visit)
    else if (node.type === 'text' && node.field !== null) {
      const value = staticValues[node.field]?.trim() || node.content
      card.values[node.field] = node.field === NAME_FIELD && nameCase ? formatName(value, nameCase) : value
      card.fontSizes[node.field] = node.fontSize
    }
  }
  visit(template.drawing)
  return card
}

/** Índice del carnet cuyo campo ocupa más a tamaño original: el caso difícil que conviene revisar. */
export function widestCard(cards: CardData[], template: Template, fonts: FontSet, fieldName: string): number {
  const field = template.fields.find((f) => f.name === fieldName)
  const font = field && fonts.get(field.fontWeight)
  if (!field || !font) return -1

  let widest = -1
  let maxWidth = -1
  cards.forEach((card, index) => {
    const width = unitWidth(font, card.values[fieldName] ?? '')
    if (width > maxWidth) {
      maxWidth = width
      widest = index
    }
  })
  return widest
}
