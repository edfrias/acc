import Papa from 'papaparse'
import type { RejectedRow, ValidationIssue } from './types'

/** Marca de orden de bytes: sin ella, Excel abre un CSV en UTF-8 como si fuera Windows-1252. */
const UTF8_BOM = '\uFEFF'

export interface ReportLabels {
  /** Cabecera de la columna con el número de fila. */
  row: string
  /** Cabecera de la columna con el motivo. */
  reason: string
  /** Texto de una incidencia, en el idioma de la interfaz. */
  describe: (issue: ValidationIssue) => string
}

/**
 * CSV de rechazados: número de fila, datos originales y motivo.
 * Con separador ";" y BOM para que Excel en castellano o catalán lo abra bien con doble clic.
 * Las columnas originales se conservan, así que se puede corregir y volver a subir.
 */
export function buildReport(rejected: RejectedRow[], headers: string[], labels: ReportLabels): string {
  const rows = rejected.map(({ row, reasons }) => [
    String(row.rowNumber),
    ...headers.map((header) => row.data[header] ?? ''),
    reasons.map(labels.describe).join(' | '),
  ])
  const csv = Papa.unparse({ fields: [labels.row, ...headers, labels.reason], data: rows }, { delimiter: ';', newline: '\r\n' })
  return UTF8_BOM + csv
}
