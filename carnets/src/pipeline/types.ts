// Tipos compartidos del pipeline: parseCsv → validate → buildPdf / buildReport.

/** Fila tal como sale del CSV, antes de mapear columnas. */
export interface RawRow {
  /** Número de fila en el fichero original (1 = cabecera, los datos empiezan en 2). */
  rowNumber: number
  /** Valores indexados por la cabecera original del CSV. */
  data: Record<string, string>
}

export type CsvDelimiter = ';' | ','
export type CsvEncoding = 'utf-8' | 'windows-1252'

export interface ParsedCsv {
  headers: string[]
  rows: RawRow[]
  delimiter: CsvDelimiter
  encoding: CsvEncoding
}

export type TextAnchor = 'start' | 'middle' | 'end'

/** Un `<text data-field="...">` de la plantilla. Medidas en mm. */
export interface TemplateField {
  name: string
  x: number
  y: number
  fontSize: number
  minSize: number
  maxWidth: number
  anchor: TextAnchor
  fontWeight: number
  /** Espacio extra entre caracteres, en mm (`letter-spacing`). */
  letterSpacing: number
  /** `data-static="true"`: se configura una vez en la app, no viene del CSV. */
  isStatic: boolean
}

export interface Template {
  /** SVG saneado: sin `#guides` ni `<metadata>`. */
  svg: string
  /** Tamaño total con sangrado, en mm. */
  width: number
  height: number
  bleed: number
  fields: TemplateField[]
}

/** Nombre de campo de la plantilla → cabecera del CSV. */
export type ColumnMapping = Record<string, string>

export interface ValidationConfig {
  mapping: ColumnMapping
  /** Valores de los campos estáticos (p. ej. `temporada`). */
  staticValues: Record<string, string>
}

/** Datos listos para dibujar un carnet. */
export interface CardData {
  rowNumber: number
  values: Record<string, string>
  /** Tamaño de fuente final (mm) por campo, tras reducir si no cabía. */
  fontSizes: Record<string, number>
}

export type IssueCode =
  | 'encoding'
  | 'missing-glyph'
  | 'empty-field'
  | 'invalid-format'
  | 'duplicate'
  | 'does-not-fit'
  | 'font-reduced'

export interface ValidationIssue {
  rowNumber: number
  field?: string
  code: IssueCode
  message: string
}

export interface RejectedRow {
  row: RawRow
  reasons: ValidationIssue[]
}

export interface ValidationResult {
  valid: CardData[]
  warnings: ValidationIssue[]
  rejected: RejectedRow[]
}

export type Imposition =
  | { kind: 'grid'; cols: number; rows: number }
  | { kind: 'single' }

export interface PdfOptions {
  imposition: Imposition
  cropMarks: boolean
}
