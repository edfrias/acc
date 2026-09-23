// Pipeline de funciones puras. Ver CLAUDE.md § Pipeline.
import type { PDFPage } from 'pdf-lib'
import type { CardData, PdfOptions, RejectedRow, Template } from './types'

export { parseTemplate, TemplateError, BLEED_MM } from './template'
export { parseCsv, parseCsvBytes, CsvError } from './csv'
export { validate, LICENSE_FIELD, REDUCTION_WARNING_RATIO } from './validate'
export { loadFontSet } from './fonts'
export type { FontSet } from './fonts'
export type * from './types'

/** Dibuja un carnet en `page` con su esquina superior izquierda (incluido el sangrado) en (x, y) pt. */
export function renderCard(
  _page: PDFPage,
  _card: CardData,
  _template: Template,
  _origin: { x: number; y: number },
): void {
  throw new Error('renderCard: sin implementar')
}

export async function buildPdf(
  _cards: CardData[],
  _template: Template,
  _options: PdfOptions,
): Promise<Uint8Array> {
  throw new Error('buildPdf: sin implementar')
}

/** CSV de rechazados: número de fila, datos originales y motivo. */
export function buildReport(_rejected: RejectedRow[]): string {
  throw new Error('buildReport: sin implementar')
}
