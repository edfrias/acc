# Siguientes pasos · Generador de carnets

Punto de partida para retomar el trabajo. Actualizado el 2026-09-23.
Contexto completo del proyecto en [CLAUDE.md](CLAUDE.md).

## Dónde estamos

- Rama `feat/carnets-skeleton`. Se fusiona con `main` solo cuando el MVP esté completo.
- Hecho y con tests (70): el pipeline entero (plantilla, CSV, validación, render, PDF impuesto, informe de rechazados)
  y la interfaz en catalán, castellano e inglés.
- Probado en Chrome de principio a fin con `fixtures/socios.csv`: validación, previsualización,
  cambio de idioma y descargas de PDF y CSV, sin errores en consola.
- Para probar en local: `cd carnets && npm run dev`, abrir http://localhost:3001 y cargar
  `fixtures/socios-ejemplo.csv` (30 socios válidos) o `fixtures/socios.csv` (casos límite con errores).

## 1. Lo que falta para cerrar el MVP: Firebase Hosting

Objetivo (CLAUDE.md § Alojamiento): segundo sitio en el proyecto `arquers-club-castelldefels`,
en `carnets.arquerscastelldefels.com`, con despliegue independiente de la web.

1. **Crear el sitio** (requiere acceso a la consola de Firebase):
   `firebase hosting:sites:create <id-del-sitio>`. El id es global en Firebase: probar `arquers-carnets` o similar.
2. **Asignar targets** desde la raíz del repo:
   ```bash
   firebase target:apply hosting web arquers-club-castelldefels
   firebase target:apply hosting carnets <id-del-sitio>
   ```
   Esto escribe en `.firebaserc`, que **está en `.gitignore`**. Decidir si sacarlo de ahí: no tiene secretos
   (solo el id del proyecto y de los sitios) y así la configuración de despliegue queda en el repo.
3. **`firebase.json`**: pasar `hosting` de objeto a array con dos entradas:
   - `target: "web"`: la configuración actual, sin cambios.
   - `target: "carnets"`: `public: "carnets/dist"`, cabecera `X-Robots-Tag: noindex, nofollow` para todo,
     caché larga para `assets/**` (los nombres llevan hash) y `no-cache` para `index.html`.
4. **Cuidado con `npm run deploy` de la web**: hoy ejecuta `firebase deploy`, que con dos sitios desplegaría
   también carnets. Cambiarlo a `firebase deploy --only hosting:web`.
5. **Script de despliegue en `carnets/package.json`**: `"deploy": "npm run build && firebase deploy --only hosting:carnets"`.
   La CLI busca `firebase.json` en los directorios superiores, así que funciona desde `carnets/`.
6. **`carnets/public/robots.txt`** con `Disallow: /`, además de la cabecera.
7. **Dominio**: añadir `carnets.arquerscastelldefels.com` al sitio en la consola y crear los registros DNS que indique.
8. Desplegar (pedir confirmación antes: es publicar), abrir la URL y repetir la prueba con `socios-ejemplo.csv`.
9. Fusionar `feat/carnets-skeleton` en `main`.

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

## Fuera de carnets, visto de paso

- `public/_headers` de la web tiene formato Netlify/Cloudflare: Firebase Hosting lo ignora.
  Esas cabeceras habría que moverlas a `firebase.json` si se quieren de verdad.
- `tailwind.config.js` de la web es un resto de Tailwind 3 y no se carga (ver AGENTS.md).

## Cómo verificar antes de dar algo por hecho

Desde `carnets/`: `npm test` y `npm run build` sin errores. Si el cambio afecta al render o a la plantilla,
generar un PDF y revisarlo a ojo con `node scripts/pdf-to-png.mjs fichero.pdf 150`.
