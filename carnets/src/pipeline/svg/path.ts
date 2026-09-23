import type { PathSegment } from '../types'
import { TemplateError } from './errors'

const ARG_COUNT: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }

/**
 * Convierte el atributo `d` de un `<path>` en segmentos absolutos M, L, C y Z,
 * que son los que PDF sabe dibujar. Las cuadráticas y los arcos se pasan a cúbicas.
 */
export function parsePath(d: string): PathSegment[] {
  const tokens = tokenize(d)
  const segments: PathSegment[] = []
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  // Último punto de control, para las curvas "suaves" (S y T).
  let lastCubic: [number, number] | null = null
  let lastQuad: [number, number] | null = null
  let i = 0
  let command = ''

  const fail = (): never => {
    throw new TemplateError(`Trazado SVG no válido: "${d.length > 60 ? d.slice(0, 60) + '…' : d}".`)
  }

  while (i < tokens.length) {
    const token = tokens[i]
    if (typeof token === 'string') {
      command = token
      i++
    } else if (!command || command.toLowerCase() === 'z') {
      fail()
    }
    const lower = command.toLowerCase()
    const relative = command === lower
    const count = ARG_COUNT[lower]
    const args = tokens.slice(i, i + count)
    if (args.length !== count || args.some((a) => typeof a !== 'number')) fail()
    i += count
    const n = args as number[]
    const ox = relative ? x : 0
    const oy = relative ? y : 0
    let cubic: [number, number] | null = null
    let quad: [number, number] | null = null

    switch (lower) {
      case 'm':
        x = ox + n[0]
        y = oy + n[1]
        startX = x
        startY = y
        segments.push({ op: 'M', x, y })
        // Los pares que siguen a un M son L implícitos.
        command = relative ? 'l' : 'L'
        break
      case 'l':
      case 'h':
      case 'v':
        if (lower === 'l') [x, y] = [ox + n[0], oy + n[1]]
        else if (lower === 'h') x = ox + n[0]
        else y = oy + n[0]
        segments.push({ op: 'L', x, y })
        break
      case 'c':
      case 's': {
        const [x1, y1]: [number, number] = lower === 'c' ? [ox + n[0], oy + n[1]] : reflect(lastCubic, x, y)
        const rest = lower === 'c' ? n.slice(2) : n
        const [x2, y2, ex, ey] = [ox + rest[0], oy + rest[1], ox + rest[2], oy + rest[3]]
        segments.push({ op: 'C', x1, y1, x2, y2, x: ex, y: ey })
        cubic = [x2, y2]
        ;[x, y] = [ex, ey]
        break
      }
      case 'q':
      case 't': {
        const [qx, qy]: [number, number] = lower === 'q' ? [ox + n[0], oy + n[1]] : reflect(lastQuad, x, y)
        const [ex, ey] = lower === 'q' ? [ox + n[2], oy + n[3]] : [ox + n[0], oy + n[1]]
        segments.push(quadToCubic(x, y, qx, qy, ex, ey))
        quad = [qx, qy]
        ;[x, y] = [ex, ey]
        break
      }
      case 'a': {
        const [ex, ey] = [ox + n[5], oy + n[6]]
        segments.push(...arcToCubics(x, y, n[0], n[1], n[2], n[3] !== 0, n[4] !== 0, ex, ey))
        ;[x, y] = [ex, ey]
        break
      }
      case 'z':
        segments.push({ op: 'Z' })
        x = startX
        y = startY
        break
    }
    lastCubic = cubic
    lastQuad = quad
  }
  return segments
}

const COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y

/** Números y letras de comando. Los flags de los arcos pueden ir pegados ("a1 1 0 01 5 5"). */
function tokenize(d: string): (string | number)[] {
  const tokens: (string | number)[] = []
  let command = ''
  let argIndex = 0
  let i = 0
  while (i < d.length) {
    const char = d[i]
    if (/[\s,]/.test(char)) {
      i++
    } else if (COMMAND.test(char)) {
      tokens.push(char)
      command = char.toLowerCase()
      argIndex = 0
      i++
    } else if (command === 'a' && (argIndex % 7 === 3 || argIndex % 7 === 4)) {
      // Los argumentos 4.º y 5.º de un arco son flags de un solo carácter.
      if (char !== '0' && char !== '1') throw new TemplateError(`Flag de arco no válido en un trazado SVG: "${char}".`)
      tokens.push(Number(char))
      argIndex++
      i++
    } else {
      NUMBER.lastIndex = i
      const match = NUMBER.exec(d)
      if (!match) throw new TemplateError(`Carácter no válido en un trazado SVG: "${char}".`)
      tokens.push(Number(match[0]))
      argIndex++
      i += match[0].length
    }
  }
  return tokens
}

function reflect(control: [number, number] | null, x: number, y: number): [number, number] {
  return control ? [2 * x - control[0], 2 * y - control[1]] : [x, y]
}

function quadToCubic(x0: number, y0: number, qx: number, qy: number, x: number, y: number): PathSegment {
  return {
    op: 'C',
    x1: x0 + (2 / 3) * (qx - x0),
    y1: y0 + (2 / 3) * (qy - y0),
    x2: x + (2 / 3) * (qx - x),
    y2: y + (2 / 3) * (qy - y),
    x,
    y,
  }
}

/** Arco elíptico (SVG, parametrización por extremos) como cúbicas de 90° como máximo. */
function arcToCubics(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  angle: number,
  largeArc: boolean,
  sweep: boolean,
  x2: number,
  y2: number,
): PathSegment[] {
  if (x1 === x2 && y1 === y2) return []
  let rx = Math.abs(rxIn)
  let ry = Math.abs(ryIn)
  if (rx === 0 || ry === 0) return [{ op: 'L', x: x2, y: y2 }]

  const phi = (angle * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy

  // Radios demasiado pequeños: se escalan hasta que el arco sea posible (SVG, apéndice F.6.6).
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }

  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den))
  const cxp = (coef * rx * y1p) / ry
  const cyp = (-coef * ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2

  const vectorAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1
    const dot = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))
    return sign * Math.acos(Math.min(1, Math.max(-1, dot)))
  }
  const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let delta = vectorAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI

  const parts = Math.ceil(Math.abs(delta) / (Math.PI / 2))
  const step = delta / parts
  const k = (4 / 3) * Math.tan(step / 4)
  const point = (t: number): [number, number] => {
    const px = rx * Math.cos(t)
    const py = ry * Math.sin(t)
    return [cx + cos * px - sin * py, cy + sin * px + cos * py]
  }
  const derivative = (t: number): [number, number] => {
    const px = -rx * Math.sin(t)
    const py = ry * Math.cos(t)
    return [cos * px - sin * py, sin * px + cos * py]
  }

  const segments: PathSegment[] = []
  for (let p = 0; p < parts; p++) {
    const t1 = theta1 + p * step
    const t2 = t1 + step
    // Los extremos exactos en el primer y el último tramo, para no acumular error de redondeo.
    const [sx, sy] = p === 0 ? [x1, y1] : point(t1)
    const [ex, ey] = p === parts - 1 ? [x2, y2] : point(t2)
    const [d1x, d1y] = derivative(t1)
    const [d2x, d2y] = derivative(t2)
    segments.push({ op: 'C', x1: sx + k * d1x, y1: sy + k * d1y, x2: ex - k * d2x, y2: ey - k * d2y, x: ex, y: ey })
  }
  return segments
}
