# Generador de carnets · Arquers Club Castelldefels

## Qué es

App web para generar los carnets de soci de los federados de cada temporada.
Entrada: una plantilla de diseño + un CSV de socios. Salida: un PDF listo para enviar a la copistería
y un CSV con las filas que no se pudieron procesar.

Usuarios: miembros de la junta del club. No necesariamente con perfil técnico.

## Principios

- **Todo en el navegador.** Los datos de los socios nunca se suben a ningún servidor
  (ni Firestore ni Storage). El CSV se procesa en cliente y desaparece al cerrar la pestaña. Evita problemas de RGPD.
  En Firestore solo están las plantillas oficiales (ver § Acceso y plantillas oficiales).
- **Lo que se previsualiza es lo que se imprime.** La previsualización y el PDF final usan la misma función de render.
- **Procesado parcial.** Una fila inválida nunca bloquea el lote: se generan los carnets válidos y se informa de los rechazados.
- **Sin ataduras a herramientas de diseño.** El formato de plantilla es SVG; cualquier herramienta que exporte SVG sirve.

## Stack

- Vite + TypeScript + Vue 3 + Tailwind 4 (igual que la web del club)
- vue-i18n: catalán (por defecto), castellano (idioma de reserva) e inglés, como la web
- pdf.js (`pdfjs-dist`) para la previsualización
- PapaParse para el CSV
- pdf-lib + @pdf-lib/fontkit para generar el PDF e incrustar fuentes
- Fuente de la plantilla: Inter (OFL), incrustada como TTF (un fichero estático por peso, en `fonts/`)
- Interfaz con el aspecto de la web del club: misma cabecera que su `NavBar.vue` (logo, nombre en Montserrat),
  Inter y Montserrat servidas desde el bundle con `@fontsource` (nada de Google Fonts: la app no pide nada a terceros)
- Tests: Vitest con entorno jsdom
- Firebase (SDK `firebase`): Auth con Google y Firestore para las plantillas oficiales. Plan gratuito (Spark) siempre:
  nada que pida el plan Blaze (Storage, Functions)

Subproyecto independiente dentro del repo de la web: miembro del workspace de pnpm de la raíz, con su propio
`package.json`. Se usa `pnpm` (nunca `npm`); las dependencias se instalan con `pnpm install` desde la raíz.
Desde `carnets/`: `pnpm dev` (http://localhost:3001/carnets/), `pnpm test`, `pnpm build`.
Desde la raíz: `pnpm dev:carnets`, `pnpm test:carnets`, `pnpm build:carnets`, o `pnpm dev:all` para levantar también la web.

## Estructura

- `src/pipeline/`: `types.ts` (tipos), `template.ts`, `csv.ts`, `validate.ts`, `fonts.ts` (medición con fontkit),
  `render.ts` (un carnet sobre pdf-lib), `pdf.ts` (imposición y marcas), `report.ts`; `index.ts` lo reexporta todo
- `src/pipeline/svg/`: compilador de la plantilla (`compile.ts`), estilos y CSS (`style.ts`), trazados (`path.ts`)
- `src/app/`: estado de la interfaz (`useCarnets.ts`), sesión (`useSession.ts`), acceso a Firestore
  (`officialTemplates.ts`) y lógica pura de la UI: temporadas (`season.ts`), cuentas del club (`club.ts`),
  asignación automática de columnas, carnet de ejemplo, nombre más largo
- `src/firebase.ts`: configuración de Firebase; en desarrollo se conecta siempre a los emuladores
- `src/components/`: un componente por paso (plantilla, CSV, columnas, revisión, previsualización, descarga)
- `src/i18n/`: configuración y `locales/{ca,es,en}.json`. Todo texto visible va en los tres idiomas
- `public/favicon.ico`: el mismo que la web
- `src/assets/logotipo-acc.svg`: copia de `public/assets/svg/logotipo-acc.svg` de la web, para la cabecera.
  Si cambia el logo de la web, hay que volver a copiarlo (y el de la plantilla, ver más abajo)
- `templates/`: plantillas oficiales, una por temporada (`plantilla-carnet-2026-27.svg`: diseño "Escut", dos caras).
  No van en el bundle: se publican desde la app en Firestore. Sirven de punto de partida para la siguiente
- `fonts/`: Inter 4.1 en TTF estático (Medium, SemiBold, Bold, ExtraBold) + licencia OFL
- `fixtures/plantilla-una-cara.svg`: la primera plantilla de referencia, de una cara. Los tests miden contra ella
  (posiciones, estilos, texto de ejemplo): no la retoques sin revisar los tests
- `fixtures/`: CSV de prueba, generados con `pnpm fixtures` (`scripts/make-fixtures.mjs`).
  No se editan a mano: el de Latin-1 se corrompería al guardarlo en UTF-8.
  `socios.csv` y `socios-latin1.csv` cubren los casos límite de los tests; `socios-ejemplo.csv` es una lista
  normal de 30 socios inventados para probar la app en local (`pnpm dev` y cargarlo en el paso 2).
- `tests/`: tests de Vitest (`*.test.ts`), con su propio `tsconfig.test.json` (tipos de Node).
  `tests/rules/`: tests de `firestore.rules` (raíz del repo) contra el emulador, con `pnpm test:rules`
  (`vitest.rules.config.ts`); `pnpm test` no los incluye
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

El pipeline no produce texto para el usuario: las incidencias (`ValidationIssue`), `CsvError` e `ImpositionError`
llevan un código y sus parámetros, y la interfaz redacta el mensaje en el idioma elegido (`describeIssue`).
`buildReport` recibe las etiquetas y esa misma función. Excepción: el detalle de `TemplateError` va en castellano
(son más de veinte casos técnicos que solo ve quien diseña plantillas) bajo un título traducido.

## Plantilla SVG: contrato

Plantilla oficial actual: `templates/plantilla-carnet-2026-27.svg` (dos caras).

- Tamaño: CR80 (85,6 × 54 mm) + 3 mm de sangrado por lado = 91,6 × 60 mm por cara.
  viewBox en mm (1 unidad = 1 mm). Línea de corte en (3,3) → (88,6, 57). Zona segura: 3 mm dentro del corte.
- **Dos caras**: `data-sides="2"` en la raíz y viewBox `0 0 91.6 120`, con el reverso debajo de la cara (y = 60..120).
  Así se diseña en una sola mesa de trabajo y en Firestore sigue siendo un único SVG. Cada cara se recorta a su
  rectángulo al dibujar: lo que se salga no pisa la otra cara ni al vecino en la hoja. Sin `data-sides`, una cara.
- `<text data-field="...">` es un campo variable; su contenido es texto de ejemplo.
  - `data-field`: nombre del campo, se mapea a una columna del CSV (`nombre`, `num_federado`).
  - `data-max-width`: ancho máximo en mm. Si el texto no cabe, se reduce la fuente.
  - `data-min-size`: tamaño mínimo en mm. Si ni así cabe → error de validación.
  - `text-anchor`: alineación.
- `data-static="true"`: campo que no viene del CSV; se configura una vez en la app (p. ej. `temporada`).
  La app rellena `temporada` con la de la plantilla oficial escrita entera: "2026-2027" (`seasonLabel`).
- `#guides`: guías de corte y zona segura, ocultas. La app las elimina antes de generar.
- `#logo`: logotipo oficial, copiado de `public/assets/svg/logotipo-acc.svg` (el de la web) con los `id`
  prefijados con `logo-`. Si cambia el logo de la web, hay que volver a copiarlo en las plantillas.
  Versión de una tinta (`#escut`, `#revers-logo`): líneas, texto y franjas en un color y lo amarillo y blanco en el
  del fondo. Las franjas de las almenas y la base no tocan el contorno del original: en una tinta llevan un trazo
  de su color (`stroke-width` 1.2 en unidades del logo) para que no aparezcan hilos del color del fondo.

**SVG soportado por el render** (lo demás se rechaza al cargar la plantilla, con un mensaje que dice qué falla):

- Elementos: `g`, `rect` (con `rx`/`ry`), `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path` (todos
  los comandos, arcos incluidos), `text` (con `tspan` sin posición propia). Se ignoran `defs`, `title`, `desc`.
- Estilo: atributos de presentación, `style=""` y `<style>` con selectores simples (`tag`, `#id`, `.clase`).
  Colores `#rgb`, `#rrggbb`, `rgb()` y algunos nombres; `fill-rule`, trazos con discontinuas, `opacity`.
  El texto admite `stroke` (contorno de las letras, con o sin relleno).
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
  - Doble cara: detrás de cada hoja de anversos, su hoja de reversos con las columnas en espejo, para imprimir
    a doble cara volteando por el lado largo. Un carnet por página: anverso y reverso seguidos.
- **CSV de rechazados**: número de fila, datos originales, motivo. Se puede corregir y volver a subir solo ese fichero.

## Alojamiento

- En `arquerscastelldefels.com/carnets/`, dentro del mismo sitio de Firebase Hosting que la web: así no hace falta
  tocar el DNS del dominio. Por eso `base: '/carnets/'` en `vite.config.ts`.
- El build de carnets sigue en `carnets/dist`; `pnpm build:site` (raíz) lo copia en `dist/carnets/` con
  `scripts/copy-carnets.mjs`. `firebase.json` envía `/carnets/**` a su `index.html` antes que el resto a la web.
- Se despliega con la web (`pnpm run deploy` desde la raíz): Firebase sustituye el sitio entero en cada despliegue,
  así que la web y carnets siempre se publican juntos. Pide confirmación antes: es publicar.
- Mismo origen que la web: comparten `localStorage`, incluida la clave `locale` (el idioma elegido en una vale para la otra).
- Cabecera `X-Robots-Tag: noindex, nofollow` para `/carnets/**` y meta `robots` en `index.html`.
  No hay `robots.txt` propio: los buscadores solo leen el de la raíz del dominio.

## Acceso y plantillas oficiales

- **Login con Google** (Firebase Auth, popup). Solo cuentas `@arquerscastelldefels.com`: las tiene solo la junta.
  Tres capas: la pantalla de consentimiento de OAuth en "Interna" (el proyecto cuelga de la organización de
  Workspace del club, así que Google no deja entrar a cuentas de fuera), la app cierra la sesión de cualquier otra
  cuenta (`isClubAccount`) y, la que cuenta de verdad, las reglas de Firestore.
- **Una plantilla oficial por temporada** en Firestore: colección `plantilles`, id = temporada (`2026-27`),
  campos `svg`, `uploadedBy`, `uploadedAt`. La junta prepara cada año una plantilla nueva: la prueba en la app
  desde fichero y la publica desde el mismo paso 1 (se propone la temporada en curso o, si ya tiene, la siguiente).
  Al entrar se abre la de la temporada en curso (o la más reciente) y su temporada rellena el campo `temporada`.
- **`firestore.rules`** (raíz): leer y publicar solo con cuenta de Google del club verificada; temporada con formato
  válido; autor = quien publica; fecha del servidor; solo esos tres campos; SVG de hasta 500 000 caracteres.
  Borrar, nunca desde la app (desde la consola de Firebase). El resto de la base de datos, cerrado.
- **Local**: `pnpm emulators` (raíz; necesita Java 21, instalado con Temurin) levanta los emuladores de Auth y
  Firestore, y `pnpm dev` se conecta a ellos: nunca toca producción. El emulador tiene su propio selector de
  cuentas falsas. La base de datos del emulador empieza vacía: hay que publicar una plantilla.
- **Despliegue de las reglas**: `pnpm deploy:rules` (raíz), aparte del de hosting. Pide confirmación antes.

## Fases

**MVP**
- Cargar plantilla SVG
- Cargar CSV con detección de codificación y separador, mapeo de columnas
- Configurar campos estáticos (temporada)
- Previsualización con navegación entre socios y botón "ver el nombre más largo"
- Validación con resumen de errores y avisos
- Descarga del PDF impuesto + CSV de rechazados

**Fase 2**
- ~~Reverso con doble cara~~ Hecho (§ Plantilla SVG, § Salida)
- Guardar/cargar configuración como JSON
- ~~Login + plantilla fuera del bundle~~ Hecho: Google + Firestore (§ Acceso y plantillas oficiales)

**Fase 3 (si hace falta)**
- Editor visual de posiciones
- Foto del socio, código QR con el número de federado
- Comparar con la temporada anterior para detectar socios nuevos

## Pendiente de decidir

- Formato que prefiere la copistería (tamaño, imposición, marcas de corte)
- Si el nombre llega en una columna o en dos ("Nom" + "Cognoms"). De momento se asume una

## Casos de prueba obligatorios

CSV de prueba con: acentos, ñ, ç y l·l; fichero en Latin-1; separador `;`; filas vacías;
números de federado duplicados; nombres muy largos
(p. ej. "Maria del Carme Puigdomènech i Sabaté", que no cabe a tamaño normal en la plantilla).

## Siguiente paso

Pipeline e interfaz del MVP hechos y probados en el navegador. Lo que falta, las decisiones pendientes
y cómo retomarlo están en [SIGUIENTES-PASOS.md](SIGUIENTES-PASOS.md).
