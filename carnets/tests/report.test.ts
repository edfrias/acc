import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { buildReport } from '../src/pipeline'
import type { RejectedRow } from '../src/pipeline'

const rejected: RejectedRow[] = [
  {
    row: { rowNumber: 12, data: { Nom: 'Anna Roca Puig', Llicència: '124700' } },
    reasons: [
      {
        rowNumber: 12,
        field: 'num_federado',
        code: 'duplicate',
        message: 'Número de federado 124700 repetido (también en la fila 13).',
      },
    ],
  },
  {
    row: { rowNumber: 14, data: { Nom: '', Llicència: 'pendent' } },
    reasons: [
      { rowNumber: 14, field: 'nombre', code: 'empty-field', message: '"nombre" está vacío.' },
      { rowNumber: 14, field: 'num_federado', code: 'invalid-format', message: 'Número de federado no válido: "pendent".' },
    ],
  },
]

describe('buildReport', () => {
  const csv = buildReport(rejected, ['Nom', 'Llicència'])

  it('empieza con BOM para que Excel lo abra en UTF-8', () => {
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('incluye fila, datos originales y motivo', () => {
    const { data } = Papa.parse<string[]>(csv.slice(1), { delimiter: ';' })
    expect(data).toEqual([
      ['Fila', 'Nom', 'Llicència', 'Motivo'],
      ['12', 'Anna Roca Puig', '124700', 'Número de federado 124700 repetido (también en la fila 13).'],
      ['14', '', 'pendent', '"nombre" está vacío. | Número de federado no válido: "pendent".'],
    ])
  })
})
