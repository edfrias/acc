import { describe, expect, it } from 'vitest'
import { designOf, loadRepoTemplates, planSync, repoTemplate, repoTemplateId } from '../src/app/repoTemplates'
import type { LibraryTemplate, SeasonAssignment } from '../src/app/templateLibrary'
import { readText } from './helpers'

const escut = readText('templates/plantilla-carnet-2026-27.svg')
const diana = readText('templates/propuestas/diana.svg')
/** Otra versión del mismo diseño, como si se hubiera retocado. */
const escutOld = escut.replace('NOM / NOMBRE', 'NOM')
const today = new Date('2026-11-17T10:00:00Z')

const lib = (id: string, svg: string): LibraryTemplate => ({ id, name: id, svg, uploadedBy: 'junta@arquerscastelldefels.com', uploadedAt: null })
const assigned = (season: string, template: string): SeasonAssignment => ({ season, template, assignedBy: '', assignedAt: null })

describe('plantillas del repositorio', () => {
  it('saca el diseño y la temporada del fichero', () => {
    expect(repoTemplate('plantilla-carnet-2026-27.svg', escut)).toMatchObject({ design: 'Escut', season: '2026-27' })
    expect(repoTemplate('propuestas/diana.svg', diana)).toMatchObject({ design: 'Diana', season: null })
    expect(designOf('<svg/>')).toBeNull()
  })

  it('el despliegue lleva las plantillas de templates/', async () => {
    const repo = await loadRepoTemplates()
    expect(repo.map((t) => [t.path, t.design, t.season]).sort()).toEqual([
      ['plantilla-carnet-2026-27.svg', 'Escut', '2026-27'],
      ['propuestas/diana.svg', 'Diana', null],
      ['propuestas/fletxa.svg', 'Fletxa', null],
    ])
  })

  it('id fijo por versión, sin que importen los saltos de línea', async () => {
    const id = await repoTemplateId(escut)
    expect(id).toMatch(/^repo-[0-9a-f]{24}$/)
    expect(await repoTemplateId(escut.replaceAll('\n', '\r\n'))).toBe(id)
    expect(await repoTemplateId(escutOld)).not.toBe(id)
  })
})

describe('planSync', () => {
  const official = repoTemplate('plantilla-carnet-2026-27.svg', escut)
  const proposal = repoTemplate('propuestas/diana.svg', diana)

  it('aprueba la versión nueva si la oficial es una anterior del mismo diseño', () => {
    const actions = planSync([official], [lib('a', escutOld)], [assigned('2026-27', 'a')], today)
    expect(actions).toEqual([{ template: official, name: 'Escut · repo 2026-11-17', approveFor: '2026-27' }])
  })

  it('aprueba la oficial si la temporada no tiene plantilla', () => {
    expect(planSync([official], [], [], today)[0].approveFor).toBe('2026-27')
  })

  it('no hace nada si la biblioteca ya tiene esa versión, aunque no sea la oficial', () => {
    // La junta volvió a aprobar la anterior a mano: no se le cambia en cada entrada
    const library = [lib('a', escutOld), lib('b', escut.replaceAll('\n', '\r\n'))]
    expect(planSync([official], library, [assigned('2026-27', 'a')], today)).toEqual([])
  })

  it('si la temporada tiene otro diseño aprobado, solo la guarda', () => {
    const actions = planSync([official], [lib('d', diana)], [assigned('2026-27', 'd')], today)
    expect(actions).toHaveLength(1)
    expect(actions[0].approveFor).toBeNull()
  })

  it('las propuestas solo se guardan', () => {
    const actions = planSync([proposal], [], [], today)
    expect(actions).toEqual([{ template: proposal, name: 'Diana · repo 2026-11-17', approveFor: null }])
  })
})
