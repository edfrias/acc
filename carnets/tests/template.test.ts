import { describe, expect, it } from 'vitest'
import { parseTemplate, TemplateError } from '../src/pipeline'
import type { DrawNode, GroupNode, ShapeNode, TextNode } from '../src/pipeline'
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

describe('compilación del SVG', () => {
  const template = parseTemplate(svg)
  const texts = (node: DrawNode): TextNode[] =>
    node.type === 'group' ? node.children.flatMap(texts) : node.type === 'text' ? [node] : []
  const minimal = (body: string, head = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.6 60">${head}${body}</svg>`

  it('recoge los pesos de fuente que hay que incrustar', () => {
    expect(template.fontWeights).toEqual([500, 600, 700, 800])
  })

  it('aplica el CSS de las clases a las etiquetas', () => {
    const label = texts(template.drawing).find((t) => t.content === 'NOM')!
    expect(label).toMatchObject({ fontSize: 2.2, fontWeight: 600, letterSpacing: 0.25 })
    expect(label.fill?.color).toEqual({ r: 0x64 / 255, g: 0x74 / 255, b: 0x8b / 255 })
  })

  it('pasa la opacidad de los grupos a sus hijos', () => {
    const background = template.drawing.children[0] as GroupNode
    expect(background.clip).toHaveLength(1)
    const target = background.children[1] as GroupNode
    const ring = target.children[0] as ShapeNode
    expect(ring.fill).toBeNull()
    expect(ring.stroke).toMatchObject({ opacity: 0.07, width: 2.4 })
  })

  it('el estilo en línea gana al CSS, y el CSS a los atributos', () => {
    const head = '<style>.a { fill: #00ff00 }</style>'
    const { drawing } = parseTemplate(
      minimal(
        '<rect class="a" fill="#ff0000" width="1" height="1"/><rect class="a" style="fill:#0000ff" width="1" height="1"/>',
        head,
      ),
    )
    const [css, inline] = drawing.children as ShapeNode[]
    expect(css.fill?.color).toEqual({ r: 0, g: 1, b: 0 })
    expect(inline.fill?.color).toEqual({ r: 0, g: 0, b: 1 })
  })

  it('rechaza elementos que el render no sabe dibujar', () => {
    expect(() => parseTemplate(minimal('<image href="logo.png"/><use href="#a"/>'))).toThrow(/<image>, <use>/)
  })

  it('rechaza degradados', () => {
    expect(() => parseTemplate(minimal('<rect fill="url(#g)" width="1" height="1"/>'))).toThrow(/Degradados/)
  })

  it('rechaza selectores CSS complejos', () => {
    expect(() => parseTemplate(minimal('', '<style>g > text { fill: red }</style>'))).toThrow(/Selector CSS/)
  })

  it('ignora lo que está oculto', () => {
    const { drawing } = parseTemplate(
      minimal('<rect display="none" width="1" height="1"/><rect visibility="hidden" width="1" height="1"/>'),
    )
    expect(drawing.children).toEqual([])
  })
})
