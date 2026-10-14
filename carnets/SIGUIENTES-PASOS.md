# Siguientes pasos · Generador de carnets

Punto de partida para retomar el trabajo. Actualizado el 2026-10-13.
Contexto completo del proyecto en [CLAUDE.md](CLAUDE.md).

## Dónde estamos

- `feat/carnets-skeleton` se fusionó en `main` el 2026-10-13 para poder probar el generador publicado
  (accesible solo para quien conozca la URL). El desarrollo sigue en la rama `feat/carnets`.
- Hecho y con tests (70): el pipeline entero (plantilla, CSV, validación, render, PDF impuesto, informe de rechazados)
  y la interfaz en catalán, castellano e inglés.
- Probado en Chrome de principio a fin con `fixtures/socios.csv`: validación, previsualización,
  cambio de idioma y descargas de PDF y CSV, sin errores en consola.
- Para probar en local: `pnpm dev:all` desde la raíz, abrir http://localhost:3000/carnets/ y cargar
  `fixtures/socios-ejemplo.csv` (30 socios válidos) o `fixtures/socios.csv` (casos límite con errores).

## 1. MVP publicado

Desde el 2026-10-13 en https://www.arquerscastelldefels.com/carnets/, dentro del sitio de Firebase Hosting de la web
(CLAUDE.md § Alojamiento). Se descartó el subdominio para no depender del proveedor del dominio (DNS).
Comprobado en producción: cabeceras (`noindex, nofollow` en `/carnets/**`), redirección de `/carnets` y el flujo
completo en Chrome con `socios-ejemplo.csv`.

Se despliega junto con la web con `pnpm run deploy` (pedir confirmación antes: es publicar). Para probar antes
sin tocar producción: `pnpm build:site` y `firebase hosting:channel:deploy preview --expires 7d`
(los canales de preview ponen `noindex` en todo el sitio, así que esa cabecera solo se puede comprobar en producción).

## 2. Decisiones pendientes (no son de código)

| Tema | Estado actual | A quién preguntar |
|---|---|---|
| Formato de la copistería | 2 × 4 por A4 con 3 mm de sangrado y marcas. **2 × 5 no cabe** en A4 con sangrado (300 mm de alto) | Copistería |
| Color | RGB. Si piden CMYK, hay que convertir en el render | Copistería |
| Reverso | No hay. Doble cara es fase 2 | Junta |
| Nombre en una o dos columnas | Se asume una. Si la exportación trae "Nom" + "Cognoms", el mapeo tiene que poder unirlas | Quien exporte el CSV |
| Textos en catalán de la interfaz | Redactados sin revisión nativa (`src/i18n/locales/ca.json`) | Junta |
| Tamaño del logo | 11 mm dentro de la banda azul; su texto interior queda por debajo de 1 mm. Se puede ampliar (solo el `transform` de `#logo`) | Junta |
| Umbral del aviso por reducción | 80 % del tamaño original (`REDUCTION_WARNING_RATIO`) | Junta, tras probar con datos reales |

## 3. Mejoras técnicas pendientes

- **Tamaño del bundle**: 720 kB comprimido, sobre todo por pdf.js. Cargar pdf.js con `import()` solo en la
  previsualización si la carga inicial resulta lenta.
- **`TemplateError`**: el detalle sale en castellano bajo un título traducido. Traducirlo con códigos, como las
  incidencias, si alguien de la junta va a diseñar plantillas.
- **vue-i18n**: carnets usa la 11 y la web la 9 (ya sin soporte). Valorar actualizar la web.
- **Skill para arrancar y probar la app**: la prueba en navegador se hizo con Playwright montado a mano en el
  directorio temporal. `/run-skill-generator` puede dejarla como skill del proyecto.
- **Imágenes en la plantilla**: `<image>` no está soportado. Solo hace falta si algún logo llega en PNG.

## 4. Fase 2 (CLAUDE.md § Fases)

- ~~Reverso con doble cara~~: hecho el 2026-10-14. Plantilla de dos caras (`data-sides="2"`, reverso debajo) y PDF con
  la hoja de reversos en espejo detrás de cada hoja de anversos. **Confirmar con la copistería** que imprimen a
  doble cara volteando por el lado largo y que el registro anverso/reverso les cuadra.
- Plantilla 2026-27 elegida por la junta: diseño "Escut" con franja tricolor (`templates/plantilla-carnet-2026-27.svg`),
  generada con `pnpm template escut 2026-27`. Para otra temporada: `pnpm template <diseño> <temporada>`;
  "Diana" (marino, diana) y "Fletxa" (blanco, franja vertical) quedan como alternativas.
  Antes de la tirada, una prueba impresa: el escudo de fondo está al 9 % de blanco sobre el azul y en papel puede
  quedar más apagado que en pantalla (subirlo al 11-12 % si casi no se ve).
- Guardar y cargar la configuración (mapeo, temporada, imposición) como JSON.
- ~~Login y plantilla fuera del bundle~~: en producción desde el 2026-10-14 (CLAUDE.md § Acceso y plantillas
  oficiales). Pantalla de OAuth en "Interna", reglas y app desplegadas; la junta confirmó que una cuenta de fuera
  no puede entrar y publicó la plantilla de 2026-27.
- ~~Biblioteca de plantillas~~: hecha el 2026-10-14, probada en local con los emuladores (publicar, sustituir,
  volver a una anterior, renombrar, eliminar, quitar la asignación e historial).
- ~~Asistente de tres pasos con galería de plantillas~~: hecho el 2026-10-14 (CLAUDE.md § Estructura).
- **En producción desde el 2026-10-14** (reglas y app). Falta hacerlo a mano en la app, con una cuenta del club:
  1. Comprobar que se entra y que la galería carga.
  2. En la galería de plantillas (paso 1): la plantilla publicada antes de la biblioteca sale con el nombre "2026-27".
     Renombrarla (p. ej. "Escut") y aprobarla para 2026-27. Hasta entonces ninguna temporada tiene plantilla oficial.
     No hay que volver a subirla ni borrar nada: el documento antiguo ya es esa entrada de la biblioteca.
  3. Añadir a la galería las propuestas "Diana" y "Fletxa" (`templates/propuestas/diana.svg` y `fletxa.svg`) con
     "Solo guardar en la biblioteca", sin aprobarlas. Valen para cualquier temporada (campo `temporada_corta`):
     hace falta desplegar antes la app que conoce ese campo. Si ya se subieron las de "2027-28", eliminarlas.

## Cómo verificar antes de dar algo por hecho

`pnpm test:carnets` y `pnpm build:carnets` sin errores (desde la raíz). Si el cambio afecta al render o a la plantilla,
generar un PDF y revisarlo a ojo con `node scripts/pdf-to-png.mjs fichero.pdf 150`.
