// Pipeline de funciones puras. Ver CLAUDE.md § Pipeline.
import type { PDFPage } from 'pdf-lib'
import type {
  CardData,
  ParsedCsv,
  PdfOptions,
  RawRow,
  RejectedRow,
  Template,
  ValidationConfig,
  ValidationResult,
} from './types'

/** Lee el SVG, extrae los campos y elimina `#guides` y `<metadata>`. */
export function parseTemplate(_svg: string): Template {
  throw new Error('parseTemplate: sin implementar')
}

/** Detecta separador y codificación (UTF-8, con reintento en Windows-1252). */
export async function parseCsv(_file: Blob): Promise<ParsedCsv> {
  throw new Error('parseCsv: sin implementar')
}

export function validate(
  _rows: RawRow[],
  _template: Template,
  _config: ValidationConfig,
): ValidationResult {
  throw new Error('validate: sin implementar')
}

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

export type * from './types'
