import type { RawRow, ValidationIssue, ValidationResult } from '../pipeline'

export type MemberStatus = 'valid' | 'warning' | 'rejected'

/** Un socio del CSV con el resultado de la validación, para la lista del paso 2. */
export interface Member {
  row: RawRow
  status: MemberStatus
  /** Errores si está excluido; avisos si no. */
  issues: ValidationIssue[]
  /** Posición entre los carnets válidos (para previsualizarlo); `null` si está excluido. */
  card: number | null
}

/** Todos los socios en el orden del fichero, cada uno con su estado. */
export function listMembers(rows: RawRow[], result: ValidationResult): Member[] {
  const cards = new Map(result.valid.map((card, index) => [card.rowNumber, index]))
  const rejected = new Map(result.rejected.map((r) => [r.row.rowNumber, r.reasons]))
  const warnings = new Map<number, ValidationIssue[]>()
  for (const warning of result.warnings) {
    warnings.set(warning.rowNumber, [...(warnings.get(warning.rowNumber) ?? []), warning])
  }

  return rows.map((row) => {
    const reasons = rejected.get(row.rowNumber)
    if (reasons) return { row, status: 'rejected', issues: reasons, card: null }
    const issues = warnings.get(row.rowNumber) ?? []
    return { row, status: issues.length > 0 ? 'warning' : 'valid', issues, card: cards.get(row.rowNumber) ?? null }
  })
}
