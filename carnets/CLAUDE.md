# Generador de carnets · Arquers Club Castelldefels

## Qué es

App web para generar los carnets de soci de los federados de cada temporada.
Entrada: una plantilla de diseño + un CSV de socios. Salida: un PDF listo para enviar a la copistería
y un CSV con las filas que no se pudieron procesar.

Usuarios: miembros de la junta del club. No necesariamente con perfil técnico.

## Principios

- **Todo en el navegador.** Los datos de los socios nunca se suben a ningún servidor
  (ni Firestore ni Storage). El CSV se procesa en cliente y desaparece al cerrar la pestaña. Evita problemas de RGPD.
- **Lo que se previsualiza es lo que se imprime.** La previsualización y el PDF final usan la misma función de render.
- **Procesado parcial.** Una fila inválida nunca bloquea el lote: se generan los carnets válidos y se informa de los rechazados.
- **Sin ataduras a herramientas de diseño.** El formato de plantilla es SVG; cualquier herramienta que exporte SVG sirve.

## Stack

- Vite + TypeScript + Vue 3 (igual que la web del club)
- PapaParse para el CSV
- pdf-lib + @pdf-lib/fontkit para generar el PDF e incrustar fuentes
- Fuente de la plantilla: Inter (OFL), incrustada como TTF (un fichero estático por peso, en `fonts/`)
- Tests: Vitest con entorno jsdom

Subproyecto independiente dentro del repo de la web: tiene su propio `package.json`.
Todos los comandos se ejecutan desde `carnets/`: `npm run dev` (puerto 3001), `npm test`, `npm run build`.

## Estructura

- `src/pipeline/`: `types.ts` (tipos), `template.ts`, `csv.ts`, `validate.ts`, `fonts.ts` (medición con fontkit),
  `render.ts` (un carnet sobre pdf-lib), `pdf.ts` (imposición y marcas), `report.ts`; `index.ts` lo reexporta todo
- `src/pipeline/svg/`: compilador de la plantilla (`compile.ts`), estilos y CSS (`style.ts`), trazados (`path.ts`)
- `templates/`: plantilla de referencia (fuera de `public/`, no se publica)
- `fonts/`: Inter 4.1 en TTF estático (Medium, SemiBold, Bold, ExtraBold) + licencia OFL
- `fixtures/`: CSV de prueba, generados con `npm run fixtures` (`scripts/make-fixtures.mjs`).
  No se editan a mano: el de Latin-1 se corrompería al guardarlo en UTF-8.
- `tests/`: tests de Vitest (`*.test.ts`), con su propio `tsconfig.test.json` (tipos de Node)
- `scripts/pdf-to-png.mjs`: rasteriza un PDF a PNG (`node scripts/pdf-to-png.mjs fichero.pdf 150`).
  Úsalo para revisar a ojo cualquier cambio en la plantilla o en el render.

## Pipeline (funciones puras)

```ts
parseTemplate(svg)                        → Template        // compila el SVG; campos; sin #guides ni <metadata>
parseCsv(file)                            → ParsedCsv       // detección de separador y codificación
validate(rows, template, config, fonts)   → { valid, warnings, rejected }  // config: mapeo + campos estáticos
renderCard(page, card, template, fonts, origin) → dibuja un carnet en una página PDF
buildPdf(valid, template, options, fontFiles)   → Uint8Array                // imposición, sangrado, marcas
buildReport(rejected, headers)            → string (CSV)
```

La previsualización es `buildPdf([valid[i]], template, { imposition: { kind: 'single' }, cropMarks: false }, fontFiles)`.

`fonts` es un `FontSet` de fontkit (para medir); `fontFiles` son los TTF en bytes (para incrustar).

## Plantilla SVG: contrato

Fichero de referencia: `templates/plantilla-carnet-cr80.svg`.

- Tamaño: CR80 (85,6 × 54 mm) + 3 mm de sangrado por lado = 91,6 × 60 mm.
  viewBox en mm (1 unidad = 1 mm). Línea de corte en (3,3) → (88,6, 57). Zona segura: 3 mm dentro del corte.
- `<text data-field="...">` es un campo variable; su contenido es texto de ejemplo.
  - `data-field`: nombre del campo, se mapea a una columna del CSV (`nombre`, `num_federado`).
  - `data-max-width`: ancho máximo en mm. Si el texto no cabe, se reduce la fuente.
  - `data-min-size`: tamaño mínimo en mm. Si ni así cabe → error de validación.
  - `text-anchor`: alineación.
- `data-static="true"`: campo que no viene del CSV; se configura una vez en la app (p. ej. `temporada`).
- `#guides`: guías de corte y zona segura, ocultas. La app las elimina antes de generar.
- `#logo`: logotipo oficial, copiado de `public/assets/svg/logotipo-acc.svg` (el de la web) con los `id`
  prefijados con `logo-` y escalado a 11 mm de alto. Si cambia el logo de la web, hay que volver a copiarlo aquí.

**SVG soportado por el render** (lo demás se rechaza al cargar la plantilla, con un mensaje que dice qué falla):

- Elementos: `g`, `rect` (con `rx`/`ry`), `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path` (todos
  los comandos, arcos incluidos), `text` (con `tspan` sin posición propia). Se ignoran `defs`, `title`, `desc`.
- Estilo: atributos de presentación, `style=""` y `<style>` con selectores simples (`tag`, `#id`, `.clase`).
  Colores `#rgb`, `#rrggbb`, `rgb()` y algunos nombres; `fill-rule`, trazos con discontinuas, `opacity`.
- `transform` (todas las funciones) y `clip-path` a un `<clipPath>` de formas sin `transform`.
- Longitudes sin unidades o en `px` (= unidades de usuario = mm).
- No soportado: `<image>`, `<use>`, degradados, patrones, filtros, máscaras.
  Los logos tienen que ir en trazados (`<path>`), con el texto convertido a trazados.
- La `opacity` de un grupo se aplica a cada hijo por separado: si los hijos se solapan, el solape se ve más oscuro.
- Solo Inter: `font-family` se ignora. Hace falta un TTF por cada `font-weight` que use la plantilla.
- Formato alternativo futuro: fondo PNG/PDF + posiciones de campos en JSON, para quien diseñe en herramientas sin buen soporte SVG.

## CSV

Columnas: nombre completo y número de federado. Posibles cabeceras en catalán ("Nom", "Llicència"),
así que hay mapeo de columnas en la UI.

- Detectar separador (`;` o `,`).
- Leer como UTF-8; si aparecen caracteres de reemplazo (`�`), reintentar como Windows-1252.
  Lo que siga mal codificado (`�` o mojibake como `Ã©`) lo rechaza `validate` fila a fila.
- Las filas vacías se ignoran; el número de fila de cada registro es el del fichero original.
- Vista previa en tabla tras la carga.

## Validación

**Errores (el carnet no se genera):**
- Codificación irrecuperable
- Caracteres sin glifo en la fuente incrustada (comprobar con fontkit)
- Campos vacíos o número de federado con formato inválido. Formato: dígitos, con o sin prefijo de texto
  ("Licencia n.º 124692", "Llicència núm. 124692" o "124692"); en el carnet se imprimen solo los dígitos
- Número de federado duplicado
- Nombre que no cabe ni con el tamaño mínimo

**Avisos (se genera, pero se señala):** texto reducido por debajo del 80 % del tamaño original.

El ancho se mide sumando los avances de los glifos sin kerning, igual que pdf-lib al dibujar.
Si hay números de federado repetidos se rechazan todas las filas implicadas: no se sabe cuál es la buena.

La UI muestra un resumen ("48 válidos, 2 con avisos, 3 excluidos") con la tabla de incidencias antes de generar.

## Salida

- **PDF para la copistería**: solo carnets. Nunca incluye páginas de errores.
  - Imposición: por defecto 8 carnets por A4 (2 × 4). Alternativa: un carnet por página.
    Pendiente de confirmar con la copistería. **2 × 5 no cabe en A4**: con el sangrado son 5 × 60 = 300 mm de alto.
  - Los carnets se tocan por el sangrado; las marcas de corte van en el margen, fuera del bloque,
    alineadas con cada línea de corte (dentro caerían sobre el sangrado del vecino).
  - Color en RGB. Si la copistería pide CMYK, hay que convertir los colores en el render.
  - Doble cara (fase 2): hoja de reverso con columnas espejadas.
- **CSV de rechazados**: número de fila, datos originales, motivo. Se puede corregir y volver a subir solo ese fichero.

## Alojamiento

- Firebase Hosting, como segundo sitio dentro del proyecto Firebase de la web del club,
  en subdominio (p. ej. `carnets.arquerscastelldefels.com`). Despliegue independiente:
  `firebase deploy --only hosting:carnets`.
- Cabecera `X-Robots-Tag: noindex, nofollow`.
- Fase posterior: Firebase Auth (Google) con lista de correos de la junta, y la plantilla oficial
  servida desde Firebase Storage con reglas de acceso (no en el bundle). Dejar la arquitectura preparada.

## Fases

**MVP**
- Cargar plantilla SVG
- Cargar CSV con detección de codificación y separador, mapeo de columnas
- Configurar campos estáticos (temporada)
- Previsualización con navegación entre socios y botón "ver el nombre más largo"
- Validación con resumen de errores y avisos
- Descarga del PDF impuesto + CSV de rechazados

**Fase 2**
- Reverso con doble cara
- Guardar/cargar configuración como JSON
- Login con lista de correos + plantilla en Storage

**Fase 3 (si hace falta)**
- Editor visual de posiciones
- Foto del socio, código QR con el número de federado
- Comparar con la temporada anterior para detectar socios nuevos

## Pendiente de decidir

- Formato que prefiere la copistería (tamaño, imposición, marcas de corte)
- Si el carnet tiene reverso
- Si el nombre llega en una columna o en dos ("Nom" + "Cognoms"). De momento se asume una

## Casos de prueba obligatorios

CSV de prueba con: acentos, ñ, ç y l·l; fichero en Latin-1; separador `;`; filas vacías;
números de federado duplicados; nombres muy largos
(p. ej. "Maria del Carme Puigdomènech i Sabaté", que no cabe a tamaño normal en la plantilla).

## Siguiente paso

El pipeline está completo y con tests. Pendiente: la UI (carga de plantilla y CSV, mapeo de columnas,
temporada, resumen de validación, previsualización con pdf.js y descargas) y la configuración de Firebase Hosting.
