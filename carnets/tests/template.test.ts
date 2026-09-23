import { describe, expect, it } from 'vitest'
import svg from '../templates/plantilla-carnet-cr80.svg?raw'

describe('plantilla de referencia', () => {
  it('tiene viewBox CR80 con sangrado (91,6 × 60 mm)', () => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(doc.documentElement.getAttribute('viewBox')).toBe('0 0 91.6 60')
  })

  it('declara los campos del contrato', () => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    const fields = [...doc.querySelectorAll('text[data-field]')].map((el) => el.getAttribute('data-field'))
    expect(fields).toEqual(['nombre', 'num_federado', 'temporada'])
  })
})
