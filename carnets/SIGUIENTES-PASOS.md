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

## 1. Lo que falta para cerrar el MVP: Firebase Hosting

Objetivo (CLAUDE.md § Alojamiento): publicar en `arquerscastelldefels.com/carnets/`, dentro del sitio de la web.
Se descartó el subdominio para no depender del proveedor del dominio (DNS).

Hecho: `base: '/carnets/'`, `pnpm build:site` monta el sitio completo, `firebase.json` sirve `/carnets/**` con `noindex`
y caché por tipo de fichero, y `pnpm run deploy` publica las dos apps. Probado con el emulador de Firebase Hosting.

Pendiente:

1. Desplegar (pedir confirmación antes: es publicar), abrir `https://www.arquerscastelldefels.com/carnets/`
   y repetir la prueba con `socios-ejemplo.csv`. Comprobar las cabeceras con `curl -I`
   (el emulador local no las aplica).

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

- Reverso con doble cara (hoja de reverso con columnas espejadas).
- Guardar y cargar la configuración (mapeo, temporada, imposición) como JSON.
- Login con Firebase Auth (Google) y lista de correos de la junta; plantilla oficial servida desde Storage
  con reglas de acceso en lugar de ir en el bundle (`officialTemplateSvg` en `src/app/useCarnets.ts`).

## Cómo verificar antes de dar algo por hecho

`pnpm test:carnets` y `pnpm build:carnets` sin errores (desde la raíz). Si el cambio afecta al render o a la plantilla,
generar un PDF y revisarlo a ojo con `node scripts/pdf-to-png.mjs fichero.pdf 150`.
