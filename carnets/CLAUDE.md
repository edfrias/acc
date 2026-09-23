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

- `src/pipeline/types.ts`: tipos compartidos del pipeline
- `src/pipeline/index.ts`: funciones del pipeline
- `templates/`: plantilla de referencia (fuera de `public/`, no se publica)
- `fixtures/`: CSV de prueba
- `tests/`: tests de Vitest (`*.test.ts`)

## Pipeline (funciones puras)

```ts
parseTemplate(svg)                → Template                          // campos + SVG sin #guides ni <metadata>
parseCsv(file)                    → ParsedCsv                         // detección de separador y codificación
validate(rows, template, config)  → { valid, warnings, rejected }     // config: mapeo de columnas + campos estáticos
renderCard(page, card, template, origin) → dibuja un carnet en una página PDF
buildPdf(valid, template, options) → Uint8Array                       // imposición, sangrado, marcas de corte
buildReport(rejected)             → string (CSV)
```

La previsualización es `buildPdf([valid[i]], template)` con imposición de un solo carnet.

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
- `#logo`: actualmente un marcador genérico; se sustituirá por el logotipo oficial.
- Formato alternativo futuro: fondo PNG/PDF + posiciones de campos en JSON, para quien diseñe en herramientas sin buen soporte SVG.

## CSV

Columnas: nombre completo y número de federado. Posibles cabeceras en catalán ("Nom", "Llicència"),
así que hay mapeo de columnas en la UI.

- Detectar separador (`;` o `,`).
- Leer como UTF-8; si aparecen caracteres de reemplazo (`�`) o mojibake (`Ã©`), reintentar como Windows-1252 antes de rechazar.
- Vista previa en tabla tras la carga.

## Validación

**Errores (el carnet no se genera):**
- Codificación irrecuperable
- Caracteres sin glifo en la fuente incrustada (comprobar con fontkit)
- Campos vacíos o número de federado con formato inválido
- Número de federado duplicado
- Nombre que no cabe ni con el tamaño mínimo

**Avisos (se genera, pero se señala):** p. ej. nombre reducido mucho respecto al tamaño original.

La UI muestra un resumen ("48 válidos, 2 con avisos, 3 excluidos") con la tabla de incidencias antes de generar.

## Salida

- **PDF para la copistería**: solo carnets. Nunca incluye páginas de errores.
  - Imposición: por defecto 10 carnets por A4 (2 × 5). Alternativa: un carnet por página.
    Pendiente de confirmar con la copistería.
  - Sangrado de 3 mm y marcas de corte.
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
- Formato válido del número de federado
- Si el nombre llega en una columna o en dos ("Nom" + "Cognoms")

## Casos de prueba obligatorios

CSV de prueba con: acentos, ñ, ç y l·l; fichero en Latin-1; separador `;`; filas vacías;
números de federado duplicados; nombres muy largos
(p. ej. "Maria del Carme Puigdomènech i Sabaté", que no cabe a tamaño normal en la plantilla).

## Siguiente paso

El esqueleto ya está montado; las funciones del pipeline todavía no están implementadas.
Falta generar los CSV de prueba en `fixtures/` con un script (el de Latin-1 hay que escribirlo como bytes),
implementar `parseTemplate`, `parseCsv` y `validate` y escribir sus tests.
