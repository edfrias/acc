import Papa from 'papaparse'
import type { RejectedRow } from './types'

/**
 * CSV de rechazados: número de fila, datos originales y motivo.
 * Con separador ";" y BOM para que Excel en castellano o catalán lo abra bien con doble clic.
 * Las columnas originales se conservan, así que se puede corregir y volver a subir.
 */
export function buildReport(rejected: RejectedRow[], headers: string[]): string {
  const rows = rejected.map(({ row, reasons }) => [
    String(row.rowNumber),
    ...headers.map((header) => row.data[header] ?? ''),
    reasons.map((reason) => reason.message).join(' | '),
  ])
  return '﻿' + Papa.unparse({ fields: ['Fila', ...headers, 'Motivo'], data: rows }, { delimiter: ';', newline: '\r\n' })
}
