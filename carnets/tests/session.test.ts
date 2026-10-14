import { describe, expect, it } from 'vitest'
import { isClubAccount } from '../src/app/club'
import { defaultSeason, isSeason, nextSeason, seasonLabel, suggestedSeason } from '../src/app/season'

describe('isClubAccount', () => {
  it('acepta las cuentas verificadas del club', () => {
    expect(isClubAccount('junta@arquerscastelldefels.com', true)).toBe(true)
    expect(isClubAccount('Junta@ArquersCastelldefels.com', true)).toBe(true)
  })

  it('rechaza otros dominios y cuentas sin verificar', () => {
    expect(isClubAccount('junta@gmail.com', true)).toBe(false)
    expect(isClubAccount('junta@arquerscastelldefels.com.evil.com', true)).toBe(false)
    expect(isClubAccount('junta@sub.arquerscastelldefels.com', true)).toBe(false)
    expect(isClubAccount('junta@arquerscastelldefels.com', false)).toBe(false)
    expect(isClubAccount(null, true)).toBe(false)
  })
})

describe('isSeason', () => {
  it('acepta "AAAA-AA" con años consecutivos', () => {
    expect(isSeason('2026-27')).toBe(true)
    expect(isSeason('2099-00')).toBe(true)
  })

  it('rechaza otros formatos', () => {
    for (const value of ['2026-28', '2026/27', '26-27', '2026-2027', '', ' 2026-27']) {
      expect(isSeason(value)).toBe(false)
    }
  })
})

describe('defaultSeason', () => {
  it('abre la temporada en curso si está publicada', () => {
    expect(defaultSeason(['2025-26', '2026-27', '2027-28'], '2026-27')).toBe('2026-27')
  })

  it('si no, la más reciente', () => {
    expect(defaultSeason(['2024-25', '2025-26'], '2026-27')).toBe('2025-26')
    expect(defaultSeason([], '2026-27')).toBeNull()
  })
})

describe('suggestedSeason', () => {
  it('propone la en curso si aún no tiene plantilla, y si no la siguiente', () => {
    expect(suggestedSeason(['2025-26'], '2026-27')).toBe('2026-27')
    expect(suggestedSeason(['2026-27'], '2026-27')).toBe('2027-28')
  })

  it('pasa de siglo', () => {
    expect(nextSeason('2099-00')).toBe('2100-01')
  })
})

describe('seasonLabel', () => {
  it('escribe la temporada entera, como en el carnet', () => {
    expect(seasonLabel('2026-27')).toBe('2026-2027')
    expect(seasonLabel('2099-00')).toBe('2099-2100')
  })
})
