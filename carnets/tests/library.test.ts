import { describe, expect, it } from 'vitest'
import { cleanName, nameFromFile, seasonsOf } from '../src/app/templateLibrary'
import type { SeasonAssignment } from '../src/app/templateLibrary'

describe('cleanName', () => {
  it('quita los espacios de sobra', () => {
    expect(cleanName('  Escut   v2 ')).toBe('Escut v2')
  })

  it('rechaza un nombre vacío o de más de 80 caracteres, como firestore.rules', () => {
    expect(cleanName('   ')).toBeNull()
    expect(cleanName('x'.repeat(80))).toHaveLength(80)
    expect(cleanName('x'.repeat(81))).toBeNull()
  })
})

describe('nameFromFile', () => {
  it('propone el nombre del fichero, sin extensión ni guiones', () => {
    expect(nameFromFile('plantilla-carnet-2026-27.svg')).toBe('plantilla carnet 2026 27')
    expect(nameFromFile('Escut_v2.SVG')).toBe('Escut v2')
  })
})

describe('seasonsOf', () => {
  const at = (season: string, template: string): SeasonAssignment => ({ season, template, assignedBy: '', assignedAt: null })

  it('las temporadas en las que una plantilla es la oficial, de la más reciente a la más antigua', () => {
    const assignments = [at('2025-26', 'escut'), at('2027-28', 'escut'), at('2026-27', 'diana')]
    expect(seasonsOf('escut', assignments)).toEqual(['2027-28', '2025-26'])
    expect(seasonsOf('fletxa', assignments)).toEqual([])
  })
})
