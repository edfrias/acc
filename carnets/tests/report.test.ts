import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { buildReport } from '../src/pipeline'
import type { RejectedRow, ReportLabels } from '../src/pipeline'

const rejected: RejectedRow[] = [
  {
    row: { rowNumber: 12, data: { Nom: 'Anna Roca Puig', Llicència: '124700' } },
    reasons: [{ rowNumber: 12, field: 'num_federado', code: 'duplicate', value: '124700', otherRows: [13] }],
  },
  {
    row: { rowNumber: 14, data: { Nom: '', Llicència: 'pendent' } },
    reasons: [
      { rowNumber: 14, field: 'nombre', code: 'empty-field' },
      { rowNumber: 14, field: 'num_federado', code: 'invalid-format', value: 'pendent' },
    ],
  },
]

const labels: ReportLabels = {
  row: 'Fila',
  reason: 'Motiu',
  describe: (issue) => `${issue.code}:${issue.field}`,
}

describe('buildReport', () => {
  const csv = buildReport(rejected, ['Nom', 'Llicència'], labels)

  it('empieza con BOM para que Excel lo abra en UTF-8', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('incluye fila, datos originales y motivo, con las etiquetas del idioma', () => {
    const { data } = Papa.parse<string[]>(csv.slice(1), { delimiter: ';' })
    expect(data).toEqual([
      ['Fila', 'Nom', 'Llicència', 'Motiu'],
      ['12', 'Anna Roca Puig', '124700', 'duplicate:num_federado'],
      ['14', '', 'pendent', 'empty-field:nombre | invalid-format:num_federado'],
    ])
  })

  it('separa las filas con CRLF, como Excel', () => {
    expect(csv).toContain('Motiu\r\n12;')
  })

  it('neutraliza las celdas que Excel ejecutaría como fórmula, pero no los números con signo', () => {
    const values = ['=HYPERLINK("http://x")', '@SUM(A1)', '+cmd|calc', '-1+1', '+34 600 111 222', '-5']
    const rows: RejectedRow[] = values.map((value, i) => ({
      row: { rowNumber: i + 2, data: { Nom: value } },
      reasons: [{ rowNumber: i + 2, field: 'nombre', code: 'empty-field' }],
    }))
    const { data } = Papa.parse<string[]>(buildReport(rows, ['Nom'], labels).slice(1), { delimiter: ';' })
    expect(data.slice(1).map((row) => row[1])).toEqual([
      `'=HYPERLINK("http://x")`,
      `'@SUM(A1)`,
      `'+cmd|calc`,
      `'-1+1`,
      '+34 600 111 222',
      '-5',
    ])
  })
})
