import { fontFor, missingGlyphs, unitWidth } from './fonts'
import type { FontSet } from './fonts'
import type {
  CardData,
  RawRow,
  RejectedRow,
  Template,
  TemplateField,
  ValidationConfig,
  ValidationIssue,
  ValidationResult,
} from './types'

/** Campo con el número de federado: se normaliza y no puede repetirse. */
export const LICENSE_FIELD = 'num_federado'

/** Por debajo de esta proporción del tamaño original, reducir la fuente genera un aviso. */
export const REDUCTION_WARNING_RATIO = 0.8

/** "Licencia n.º 124692", "Llicència núm. 124692" o "124692": se queda con los dígitos finales. */
const LICENSE_PATTERN = /^\D*?(\d+)$/

/** UTF-8 leído como Windows-1252 ("Ã©" en lugar de "é"). */
const MOJIBAKE_PATTERN = /Ã[\u0080-\u00BF]|Â[\u00A0-\u00BF]/

interface RowCheck {
  row: RawRow
  values: Record<string, string>
  fontSizes: Record<string, number>
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export function validate(
  rows: RawRow[],
  template: Template,
  config: ValidationConfig,
  fonts: FontSet,
): ValidationResult {
  for (const field of template.fields) {
    if (!field.isStatic && !(field.name in config.mapping)) {
      throw new Error(`Falta asignar una columna del CSV al campo "${field.name}".`)
    }
  }

  const checks = rows.map((row) => checkRow(row, template, config, fonts))
  markDuplicates(checks)

  const valid: CardData[] = []
  const warnings: ValidationIssue[] = []
  const rejected: RejectedRow[] = []
  for (const check of checks) {
    if (check.errors.length > 0) {
      rejected.push({ row: check.row, reasons: check.errors })
    } else {
      valid.push({ rowNumber: check.row.rowNumber, values: check.values, fontSizes: check.fontSizes })
      warnings.push(...check.warnings)
    }
  }
  return { valid, warnings, rejected }
}

function checkRow(row: RawRow, template: Template, config: ValidationConfig, fonts: FontSet): RowCheck {
  const check: RowCheck = { row, values: {}, fontSizes: {}, errors: [], warnings: [] }
  const rowNumber = row.rowNumber

  for (const field of template.fields) {
    let value = field.isStatic
      ? (config.staticValues[field.name] ?? '').trim()
      : (row.data[config.mapping[field.name]] ?? '').trim()

    const name = field.name
    if (value === '') {
      check.errors.push({ rowNumber, field: name, code: field.isStatic ? 'missing-static' : 'empty-field' })
      continue
    }
    if (value.includes('\uFFFD') || MOJIBAKE_PATTERN.test(value)) {
      check.errors.push({ rowNumber, field: name, code: 'encoding', value })
      continue
    }
    if (name === LICENSE_FIELD) {
      const match = LICENSE_PATTERN.exec(value)
      if (!match) {
        check.errors.push({ rowNumber, field: name, code: 'invalid-format', value })
        continue
      }
      value = match[1]
    }

    const font = fontFor(fonts, field.fontWeight)
    const chars = missingGlyphs(font, value)
    if (chars.length > 0) {
      check.errors.push({ rowNumber, field: name, code: 'missing-glyph', value, chars })
      continue
    }

    const size = fittedSize(field, unitWidth(font, value), [...value].length)
    if (size < field.minSize) {
      check.errors.push({ rowNumber, field: name, code: 'does-not-fit', value })
      continue
    }
    if (size < field.fontSize * REDUCTION_WARNING_RATIO) {
      const percent = Math.round((size / field.fontSize) * 100)
      check.warnings.push({ rowNumber, field: name, code: 'font-reduced', value, percent })
    }

    check.values[field.name] = value
    check.fontSizes[field.name] = size
  }
  return check
}

/** Tamaño de fuente (mm) con el que el texto cabe en maxWidth, sin pasar del tamaño original. */
function fittedSize(field: TemplateField, widthPerMm: number, charCount: number): number {
  const available = field.maxWidth - field.letterSpacing * charCount
  if (widthPerMm === 0) return field.fontSize
  // Redondeo hacia abajo a centésimas: redondear hacia arriba podría pasarse del ancho.
  return Math.min(field.fontSize, Math.floor((available / widthPerMm) * 100) / 100)
}

/** Todas las filas que comparten número de federado se rechazan: no se sabe cuál es la buena. */
function markDuplicates(checks: RowCheck[]): void {
  const byLicense = new Map<string, RowCheck[]>()
  for (const check of checks) {
    const license = check.values[LICENSE_FIELD]
    if (license === undefined) continue
    byLicense.set(license, [...(byLicense.get(license) ?? []), check])
  }
  for (const [license, group] of byLicense) {
    if (group.length < 2) continue
    for (const check of group) {
      check.errors.push({
        rowNumber: check.row.rowNumber,
        field: LICENSE_FIELD,
        code: 'duplicate',
        value: license,
        otherRows: group.filter((other) => other !== check).map((other) => other.row.rowNumber),
      })
    }
  }
}
