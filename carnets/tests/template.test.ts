import { describe, expect, it } from 'vitest'
import { parseTemplate, TemplateError } from '../src/pipeline'
import { readText } from './helpers'

const svg = readText('templates/plantilla-carnet-cr80.svg')

describe('parseTemplate', () => {
  const template = parseTemplate(svg)

  it('lee el tamaño CR80 con sangrado', () => {
    expect(template).toMatchObject({ width: 91.6, height: 60, bleed: 3 })
  })

  it('extrae los campos del contrato', () => {
    expect(template.fields.map((f) => f.name)).toEqual(['nombre', 'num_federado', 'temporada'])
    expect(template.fields[0]).toEqual({
      name: 'nombre',
      x: 7,
      y: 30.5,
      fontSize: 4.4,
      minSize: 2.8,
      maxWidth: 70,
      anchor: 'start',
      fontWeight: 700,
      letterSpacing: 0,
      isStatic: false,
    })
  })

  it('marca los campos estáticos', () => {
    expect(template.fields.filter((f) => f.isStatic).map((f) => f.name)).toEqual(['temporada'])
  })

  it('elimina las guías y los metadatos', () => {
    expect(svg).toContain('id="guides"')
    expect(svg).toContain('<metadata')
    expect(template.svg).not.toContain('id="guides"')
    expect(template.svg).not.toContain('<metadata')
    expect(template.svg).toContain('id="logo"')
  })

  it('rechaza un fichero que no es SVG', () => {
    expect(() => parseTemplate('no es svg')).toThrow(TemplateError)
  })

  it('rechaza un campo sin data-max-width', () => {
    const broken = svg.replace('data-max-width="70" ', '')
    expect(() => parseTemplate(broken)).toThrow(/"nombre".*data-max-width/)
  })

  it('rechaza campos repetidos', () => {
    const repeated = svg.replace('data-field="num_federado"', 'data-field="nombre"')
    expect(() => parseTemplate(repeated)).toThrow(/más de una vez/)
  })
})
