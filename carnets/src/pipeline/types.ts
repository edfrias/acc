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
  /** La plantilla compilada, lista para dibujar. Coordenadas SVG (mm, y hacia abajo). */
  drawing: GroupNode
  /** Pesos de Inter que usa la plantilla; buildPdf necesita un TTF para cada uno. */
  fontWeights: number[]
}

/** Matriz afín [a, b, c, d, e, f], como en SVG y PDF. */
export type Matrix = [number, number, number, number, number, number]

/** Componentes entre 0 y 1. */
export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Paint {
  color: Rgb
  /** Opacidad final: incluye la de los grupos que lo contienen. */
  opacity: number
}

export interface StrokePaint extends Paint {
  width: number
  dash: number[]
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'miter' | 'round' | 'bevel'
}

/** Segmento de trazado en coordenadas absolutas. Cuadráticas y arcos ya convertidos a cúbicas. */
export type PathSegment =
  | { op: 'M' | 'L'; x: number; y: number }
  | { op: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: 'Z' }

export type Geometry =
  | { kind: 'path'; segments: PathSegment[] }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number; ry: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'polyline'; points: number[]; closed: boolean }

export interface ShapeNode {
  type: 'shape'
  geometry: Geometry
  fill: Paint | null
  fillRule: 'nonzero' | 'evenodd'
  stroke: StrokePaint | null
}

export interface TextNode {
  type: 'text'
  x: number
  y: number
  /** Texto de la plantilla; en los campos variables es texto de ejemplo. */
  content: string
  /** Nombre del campo si es variable (`data-field`). */
  field: string | null
  fontSize: number
  fontWeight: number
  letterSpacing: number
  anchor: TextAnchor
  fill: Paint | null
}

export interface GroupNode {
  type: 'group'
  transform: Matrix | null
  /** Recorte (`clip-path`): unión de estas geometrías, en el espacio del grupo. */
  clip: Geometry[] | null
  children: DrawNode[]
}

export type DrawNode = GroupNode | ShapeNode | TextNode

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
  /** Rejilla en A4 vertical, carnets pegados por el sangrado. */
  | { kind: 'grid'; cols: number; rows: number }
  /** Un carnet por página, del tamaño del carnet con sangrado (más margen para las marcas). */
  | { kind: 'single' }

export interface PdfOptions {
  imposition: Imposition
  cropMarks: boolean
}

/** TTF de Inter por peso (500, 600, 700…). */
export type FontFiles = Record<number, Uint8Array>
