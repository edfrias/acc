// Genera una plantilla oficial de carnet (cara y reverso en un solo SVG) para una temporada.
// Uso: node scripts/make-template.mjs [diseño] [temporada] [salida]
//   diseño     escut (por defecto, el de 2026-27) | diana | fletxa
//   temporada  "2027-28"; por defecto, la en curso
//   salida     por defecto templates/plantilla-carnet-<temporada>.svg
// Los tres diseños salieron de las propuestas de 2026-27 (carnets/SIGUIENTES-PASOS.md). Todo va en trazados y texto
// Inter, sin degradados ni imágenes, para que lo dibuje el render de la app. Revisa el resultado cargándolo en la app
// (paso 1, "Probar una plantilla desde fichero") antes de publicarlo.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const YELLOW = '#fcdd09'
const RED = '#d41519'
const BLUE = '#0099ff'
const NAVY = '#0b1f3a'
const DEEP = '#00579b'
const INK = '#0f172a'

// ---------- Logo ----------

const LOGO_SVG = readFileSync(new URL('../../public/assets/svg/logotipo-acc.svg', import.meta.url), 'utf-8')
/** Logo oficial de la web, sin la raíz <svg> ni <defs>: los grupos y trazados, con los id prefijados con "logo-". */
const LOGO = LOGO_SVG.slice(LOGO_SVG.indexOf('>', LOGO_SVG.indexOf('<defs')) + 1, LOGO_SVG.lastIndexOf('</svg>')).replaceAll(
  'id="',
  'id="logo-',
)
/** Alto del logo en sus unidades (el último número del viewBox). */
const LOGO_HEIGHT = Number(/viewBox="([^"]+)"/.exec(LOGO_SVG)[1].trim().split(/[\s,]+/)[3])

const place = (id, x, y, h, body, extra = '') =>
  `<g id="${id}" transform="translate(${x} ${y}) scale(${(h / LOGO_HEIGHT).toFixed(6)})"${extra}>${body}</g>`

/** Logo en color de `h` mm de alto, con la esquina superior izquierda en (x, y). */
const logo = (x, y, h, id) => place(id, x, y, h, LOGO.replaceAll('id="logo-', `id="${id}-`))

/** Color sólido equivalente a `c1` con opacidad `t` sobre `c2`: en la copistería, mejor que una transparencia. */
function mix(c1, c2, t) {
  const channels = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const [a, b] = [channels(c1), channels(c2)]
  return '#' + a.map((x, i) => Math.round(x * t + b[i] * (1 - t)).toString(16).padStart(2, '0')).join('')
}

/** Cambia el estilo de un elemento del logo, buscado por su id. */
function restyle(body, id, change) {
  const k = body.indexOf(`id="${id}"`)
  const start = body.lastIndexOf('<', k)
  const end = body.indexOf('>', k)
  return body.slice(0, start) + change(body.slice(start, end)) + body.slice(end)
}

/** Logo de una tinta: líneas, texto y franjas en `mark`; lo amarillo y blanco del original, en el color del fondo. */
function monoLogo(x, y, h, id, mark, bg) {
  let body = LOGO.replaceAll('id="logo-', `id="${id}-`)
  // En una sola pasada: si no, un color ya cambiado se volvería a cambiar (el negro pasa a blanco y luego a fondo)
  const roles = { '#000000': mark, '#d41519': mark, '#0099ff': mark, '#f80362': bg, '#ffffff': bg, '#fcdd09': bg }
  body = body.replace(/fill:(#[0-9a-fA-F]{6})/g, (m, color) => `fill:${roles[color.toLowerCase()] ?? color}`)
  // El centro amarillo de la diana va con la tinta, para que se vean los anillos
  body = restyle(body, `${id}-path4`, (el) => el.replace(`fill:${bg}`, `fill:${mark}`))
  // El texto no tiene relleno propio (negro por defecto)
  body = body.replace('style="font-weight:bold;', `style="fill:${mark};font-weight:bold;`)
  // Las franjas de las almenas y la base no llegan del todo al contorno: en color el hueco es amarillo y no se ve;
  // en una tinta recorta con el fondo y deja hilos. Un trazo de su color las solapa con el contorno, que lo tapa.
  for (const part of ['path8', 'path9', 'path10', 'path11', 'path1']) {
    body = restyle(body, `${id}-${part}`, (el) =>
      el.replace(/stroke-width:[\d.]+/, `stroke:${mark};stroke-width:1.2;stroke-linejoin:round`),
    )
  }
  return place(id, x, y, h, body)
}

/** Logo en color con un reborde de `border` mm: debajo, su silueta en `color` con un trazo del doble de ancho. */
function outlinedLogo(x, y, h, id, border = 0.6, color = '#ffffff') {
  const width = (2 * border) / (h / LOGO_HEIGHT) // el trazo va centrado en el borde: sobresale la mitad
  const body = LOGO.replaceAll('id="logo-', `id="${id}-halo-`)
    .replace(/fill:#[0-9a-fA-F]{6}/g, `fill:${color}`)
    .replace(/stroke-width:[\d.]+/g, `stroke-width:${width.toFixed(2)}`)
    .replace('style="font-weight:bold;', `style="fill:${color};font-weight:bold;`)
  const halo = place(`${id}-halo`, x, y, h, body, ` stroke="${color}" stroke-linejoin="round" stroke-linecap="round"`)
  return halo + logo(x, y, h, id)
}

// ---------- Piezas comunes ----------

/**
 * Temporada corta ("26-27") en grande, como marca de agua. Es un campo que rellena la app (temporada_corta):
 * la misma plantilla sirve para cualquier temporada. `season` en el SVG es solo el texto de ejemplo.
 */
const shortSeasonField = (season, x, y, size, fill, opacity) =>
  `<text id="temporada-corta" data-field="temporada_corta" data-static="true" data-max-width="${Math.round(size * 3.4)}" data-min-size="${Math.round(size * 7) / 10}" x="${x}" y="${y}" font-size="${size}" font-weight="800" letter-spacing="-0.6" fill="${fill}" opacity="${opacity}" text-anchor="end">${shortSeason(season)}</text>`

/** Datos del socio en la cara. La temporada va abajo a la derecha o, con `seasonY`, a esa altura. */
function fields(season, { name, number, label, seasonFill, x = 7, seasonY }) {
  return `  <g id="fields">
    <text x="${x}" y="39.3" font-size="2" font-weight="700" letter-spacing="0.3" fill="${label}">NOM</text>
    <text id="nombre" data-field="nombre" data-max-width="76" data-min-size="2.8" x="${x}" y="44.5" font-size="4.6" font-weight="800" fill="${name}">MARIA PUIG I SOLER</text>
    <text x="${x}" y="48.3" font-size="2" font-weight="700" letter-spacing="0.3" fill="${label}">LLICÈNCIA FEDERATIVA</text>
    <text id="num_federado" data-field="num_federado" data-max-width="30" data-min-size="3" x="${x}" y="52.6" font-size="3.8" font-weight="700" fill="${number}">124692</text>
    <text id="temporada" data-field="temporada" data-static="true" data-max-width="26" data-min-size="2.4" x="84.6" y="${seasonY ?? 52.6}" font-size="3.2" font-weight="700" fill="${seasonFill}" text-anchor="end">${seasonLabel(season)}</text>
  </g>`
}

/** Datos de contacto del reverso: los mismos que en la web (src/locales y el pie de página). */
const CONTACT = [
  ['ADREÇA', ['Canal Olímpic de Catalunya', 'Av. de Castelldefels, 0', '08860 Castelldefels (Barcelona)']],
  ['WHATSAPP', ['+34 606 750 639 · +34 666 941 845']],
  ['CORREU', ['secretaria@arquerscastelldefels.com', 'junta@arquerscastelldefels.com']],
  ['INSTAGRAM', ['@arquersclubc']],
]

function contact(x, { ink, label, title }) {
  let y = 11
  const out = [`<text x="${x}" y="${y}" font-size="2.75" font-weight="800" letter-spacing="0.1" fill="${title}">ARQUERS CLUB CASTELLDEFELS</text>`]
  y += 5
  for (const [head, lines] of CONTACT) {
    out.push(`<text x="${x}" y="${round(y)}" font-size="1.6" font-weight="700" letter-spacing="0.3" fill="${label}">${head}</text>`)
    y += 2.9
    for (const line of lines) {
      out.push(`<text x="${x}" y="${round(y)}" font-size="2.3" font-weight="500" fill="${ink}">${line}</text>`)
      y += 2.9
    }
    y += 1.1
  }
  return '  <g id="contact">\n    ' + out.join('\n    ') + '\n  </g>'
}

/**
 * Franja inferior en los tres colores del logo, en tramos iguales de la parte visible (del corte 3 al 88,6).
 * En el reverso, al revés: al girar la tarjeta, cada color queda detrás del mismo color.
 */
function tricolor(back = false) {
  const colors = back ? [BLUE, RED, YELLOW] : [YELLOW, RED, BLUE]
  const third = 85.6 / 3
  const edges = [0, 3 + third, 3 + 2 * third, 91.6]
  return colors
    .map((c, i) => `<rect x="${edges[i].toFixed(2)}" y="54.5" width="${(edges[i + 1] - edges[i]).toFixed(2)}" height="5.5" fill="${c}"/>`)
    .join('')
}

const background = (fill, content) => `  <g id="background" clip-path="url(#clip-bleed)">
    <rect width="91.6" height="60" fill="${fill}"/>
    ${content}
  </g>`

const round = (n) => Math.round(n * 1000) / 1000

// ---------- Diseños ----------

const DESIGNS = {
  // Escudo de una tinta, grande e inclinado, de fondo; logo en color con reborde blanco. Temporada 2026-27.
  escut: {
    name: 'Escut',
    front: (season) => {
      const mark = mix('#ffffff', DEEP, 0.09) // 9 %: en papel puede verse más apagado; subir a 0.11-0.12 si hace falta
      return `${background(DEEP, `<g transform="rotate(-14 46 30)">${monoLogo(8, -9, 104, 'escut', mark, DEEP)}</g>
    ${tricolor()}`)}
  ${outlinedLogo(7, 6, 15, 'logo')}
${fields(season, { name: '#ffffff', number: YELLOW, label: '#9cc9ef', seasonFill: YELLOW, seasonY: 11.5 })}`
    },
    back: () => `${background(DEEP, tricolor(true))}
  ${monoLogo(6.5, 13, 27, 'logo', '#ffffff', DEEP)}
${contact(36, { ink: '#ffffff', label: '#9cc9ef', title: YELLOW })}`,
  },

  // Fondo marino con una diana en azules y el logo en un círculo blanco; "26-27" casi invisible.
  diana: {
    name: 'Diana',
    front: (season) => `${background(NAVY, `${target(84, 14)}
    ${shortSeasonField(season, 90, 34, 22, '#ffffff', 0.1)}
    ${tricolor()}`)}
  <circle cx="15.5" cy="14.2" r="9.4" fill="#ffffff"/>
  ${logo(8.85, 8.4, 13, 'logo')}
${fields(season, { name: '#ffffff', number: YELLOW, label: '#8aa0bd', seasonFill: YELLOW })}`,
    back: () => `${background(NAVY, `${target(18, 30, 0.9)}
    ${tricolor(true)}`)}
  <circle cx="18" cy="30" r="12.5" fill="#ffffff"/>
  ${logo(9.06, 22.38, 17.5, 'logo')}
${contact(36, { ink: '#ffffff', label: '#8aa0bd', title: YELLOW })}`,
  },

  // Blanco minimalista con franja vertical tricolor y una flecha bajo el "26-27".
  fletxa: {
    name: 'Fletxa',
    front: (season) => `${background('#ffffff', `${shortSeasonField(season, 87, 28, 19, BLUE, 0.13)}
    <rect width="9" height="20" fill="${YELLOW}"/>
    <rect y="20" width="9" height="20" fill="${RED}"/>
    <rect y="40" width="9" height="20" fill="${BLUE}"/>
    ${arrow(31, 33, 86, RED)}`)}
  ${logo(12.5, 6, 15, 'logo')}
${fields(season, { name: INK, number: BLUE, label: '#64748b', seasonFill: INK, x: 12.5 })}`,
    back: () => `${background('#ffffff', `<rect x="85.1" width="6.5" height="20" fill="${YELLOW}"/>
    <rect x="85.1" y="20" width="6.5" height="20" fill="${RED}"/>
    <rect x="85.1" y="40" width="6.5" height="20" fill="${BLUE}"/>`)}
  ${logo(7, 7, 24, 'logo')}
${contact(33, { ink: INK, label: '#64748b', title: INK })}`,
  },
}

/** Diana en tonos de azul con el centro amarillo. */
function target(cx, cy, scale = 1) {
  const rings = [[34, '#13294b'], [27, '#16365f'], [20, '#1a4475'], [13, '#1f5590'], [6, YELLOW]]
  return rings.map(([r, c]) => `<circle cx="${cx}" cy="${cy}" r="${(r * scale).toFixed(2)}" fill="${c}"/>`).join('')
}

/** Flecha horizontal a la altura `y`, de `x0` (plumas) a `x1` (punta). */
function arrow(y, x0, x1, color) {
  return (
    `<g fill="${color}"><rect x="${x0 + 4}" y="${round(y - 0.25)}" width="${x1 - x0 - 7}" height="0.5"/>` +
    `<path d="M${x1} ${y} L${round(x1 - 4.2)} ${round(y - 1.8)} L${round(x1 - 3.2)} ${y} L${round(x1 - 4.2)} ${round(y + 1.8)} Z"/>` +
    `<path d="M${x0} ${y - 2} L${x0 + 4} ${y - 2} L${x0 + 6} ${y} L${x0 + 2} ${y} Z" opacity="0.85"/>` +
    `<path d="M${x0} ${y + 2} L${x0 + 4} ${y + 2} L${x0 + 6} ${y} L${x0 + 2} ${y} Z" opacity="0.85"/></g>`
  )
}

// ---------- Temporada ----------

/** Igual que src/app/season.ts: la temporada empieza en septiembre. */
function currentSeason(date) {
  const start = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}
const seasonLabel = (season) => `${season.slice(0, 4)}-${Number(season.slice(0, 4)) + 1}` // "2026-2027"
const shortSeason = (season) => season.slice(2) // "26-27"

// ---------- Fichero ----------

/** Prefija los id del reverso (y sus referencias): no se pueden repetir los de la cara. */
const prefixed = (content, prefix) =>
  content.replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`).replaceAll('url(#clip-bleed)', `url(#${prefix}clip-bleed)`)

export function makeTemplate(designKey, season) {
  const design = DESIGNS[designKey]
  if (!design) throw new Error(`Diseño desconocido: "${designKey}". Disponibles: ${Object.keys(DESIGNS).join(', ')}.`)
  const front = design.front(season)
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Plantilla de carnet de soci · Arquers Club Castelldefels · temporada ${season} (diseño "${design.name}")
  Formato: CR80 (85,6 × 54 mm) + 3 mm de sangrado por lado = 91,6 × 60 mm por cara.
  Dos caras (data-sides="2"): la cara de y = 0 a 60 y el reverso debajo, de y = 60 a 120.
  Unidades: 1 unidad del viewBox = 1 mm. Corte en (3, 3) → (88,6, 57) en cada cara.

  CONTRATO DE LA PLANTILLA (lo que la app lee), ver carnets/CLAUDE.md § Plantilla SVG:
  - <text data-field="..."> : campo variable. El contenido es texto de ejemplo y se sustituye.
      data-field       nombre del campo (se mapea a una columna del CSV)
      data-max-width   ancho máximo en mm; si no cabe, se reduce la fuente
      data-min-size    tamaño mínimo de fuente en mm; si ni así cabe → error de validación
      data-static      "true": no viene del CSV; la app pone la temporada de la plantilla ("${seasonLabel(season)}")
${front.includes('data-field="temporada_corta"') ? `      temporada_corta  la temporada corta ("${shortSeason(season)}"), también la pone la app: la plantilla vale para cualquier año
` : ''}  - #guides : guías de corte y zona segura de las dos caras. La app las elimina antes de generar el PDF.
  - #logo, #revers-logo : logotipo oficial en trazados (de public/assets/svg/logotipo-acc.svg, la web).
    Los logos de una tinta (#escut, #revers-logo en "Escut") llevan líneas, texto y franjas en un color y lo amarillo
    y blanco del original en el del fondo. #logo-halo, si está, es la silueta blanca que hace de reborde.
  - Fuente: Inter (OFL); la app incrusta los TTF.
  Generada con scripts/make-template.mjs (${designKey}). Se puede retocar aquí directamente.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="91.6mm" height="120mm" viewBox="0 0 91.6 120" data-sides="2">
  <defs>
    <clipPath id="clip-bleed"><rect width="91.6" height="60"/></clipPath>
    <clipPath id="revers-clip-bleed"><rect width="91.6" height="60"/></clipPath>
  </defs>

  <!-- ===== CARA ===== -->
  <g id="cara">
${front}
  </g>

  <!-- ===== REVERS (debajo de la cara) ===== -->
  <g id="revers" transform="translate(0 60)">
${prefixed(design.back(season), 'revers-')}
  </g>

  <!-- Guías: no se imprimen, la app elimina este grupo -->
  <g id="guides" display="none" fill="none" stroke-width="0.15">
    <rect x="3" y="3" width="85.6" height="54" rx="3.18" stroke="#ef4444"/>
    <rect x="6" y="6" width="79.6" height="48" stroke="#22c55e" stroke-dasharray="1 0.6"/>
    <rect x="3" y="63" width="85.6" height="54" rx="3.18" stroke="#ef4444"/>
    <rect x="6" y="66" width="79.6" height="48" stroke="#22c55e" stroke-dasharray="1 0.6"/>
  </g>
</svg>
`
}

// Ejecutado como script (no importado desde los tests)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [designKey = 'escut', season = currentSeason(new Date()), output] = process.argv.slice(2)
  if (!/^\d{4}-\d{2}$/.test(season)) throw new Error(`Temporada no válida: "${season}". Formato: 2027-28.`)
  const target = output ?? new URL(`../templates/plantilla-carnet-${season}.svg`, import.meta.url)
  writeFileSync(target, makeTemplate(designKey, season))
  console.log(`Plantilla "${designKey}" de la temporada ${season}: ${target instanceof URL ? fileURLToPath(target) : target}`)
}
