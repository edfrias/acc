import { describe, expect, it } from 'vitest'
import { parsePath } from '../src/pipeline/svg/path'
import { TemplateError } from '../src/pipeline'
import type { PathSegment } from '../src/pipeline'

const end = (segments: PathSegment[]) => {
  const last = segments.filter((s) => s.op !== 'Z').pop()
  return last && 'x' in last ? [last.x, last.y] : null
}

describe('parsePath', () => {
  it('convierte comandos relativos a absolutos', () => {
    expect(parsePath('m10 10 l5 0 h5 v5 z')).toEqual([
      { op: 'M', x: 10, y: 10 },
      { op: 'L', x: 15, y: 10 },
      { op: 'L', x: 20, y: 10 },
      { op: 'L', x: 20, y: 15 },
      { op: 'Z' },
    ])
  })

  it('trata los pares tras un M como L implícitos', () => {
    expect(parsePath('M0 0 10 0 10 10')).toEqual([
      { op: 'M', x: 0, y: 0 },
      { op: 'L', x: 10, y: 0 },
      { op: 'L', x: 10, y: 10 },
    ])
  })

  it('vuelve al inicio del subtrazado tras Z', () => {
    expect(parsePath('M5 5 L10 5 Z l1 1').pop()).toEqual({ op: 'L', x: 6, y: 6 })
  })

  it('acepta números pegados y con exponente', () => {
    expect(parsePath('M-1.5.5L1e1-2')).toEqual([
      { op: 'M', x: -1.5, y: 0.5 },
      { op: 'L', x: 10, y: -2 },
    ])
  })

  it('refleja el punto de control en S', () => {
    const [, first, second] = parsePath('M0 0 C0 10 10 10 10 0 S20 -10 20 0')
    expect(first).toMatchObject({ op: 'C', x2: 10, y2: 10 })
    expect(second).toMatchObject({ op: 'C', x1: 10, y1: -10, x: 20, y: 0 })
  })

  it('convierte las cuadráticas en cúbicas equivalentes', () => {
    expect(parsePath('M0 0 Q15 30 30 0')[1]).toEqual({ op: 'C', x1: 10, y1: 20, x2: 20, y2: 20, x: 30, y: 0 })
  })

  it('convierte un semicírculo en dos cúbicas que acaban en el punto exacto', () => {
    const segments = parsePath('M0 0 A5 5 0 0 1 10 0')
    expect(segments.filter((s) => s.op === 'C')).toHaveLength(2)
    expect(end(segments)).toEqual([10, 0])
    // Con sweep=1 y y hacia abajo, el semicírculo pasa por encima: por (5, -5).
    expect(segments[1]).toMatchObject({ op: 'C', x: expect.closeTo(5, 6), y: expect.closeTo(-5, 6) })
  })

  it('lee los flags de arco pegados', () => {
    expect(end(parsePath('M0 0a5 5 0 0110 0'))).toEqual([10, 0])
  })

  it('rechaza trazados mal formados', () => {
    expect(() => parsePath('M0 0 L10')).toThrow(TemplateError)
    expect(() => parsePath('10 10')).toThrow(TemplateError)
    expect(() => parsePath('M0 0 X5 5')).toThrow(TemplateError)
  })
})
