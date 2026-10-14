# Arquers Club Castelldefels

Instrucciones para agentes que trabajen en este repositorio. El repo contiene dos proyectos independientes.

## Proyectos

| Carpeta | Qué es | Instrucciones |
|---|---|---|
| raíz (`src/`) | Web pública del club | Este fichero |
| `carnets/` | Generador de carnets de soci | [`carnets/CLAUDE.md`](carnets/CLAUDE.md), léelo antes de tocar nada ahí |

Es un workspace de pnpm (`pnpm-workspace.yaml`): la web es el paquete raíz y `carnets/` un miembro más.
Usa siempre `pnpm`, nunca `npm`: hay un único `pnpm-lock.yaml` en la raíz y un `pnpm install` desde la raíz
instala los dos proyectos. Cada uno conserva su propio `package.json` y sus dependencias, y se despliega por separado.

Desde la raíz:

- `pnpm dev:all`: levanta la web (puerto 3000) y los carnets (puerto 3001) a la vez. Como en producción,
  carnets se abre en http://localhost:3000/carnets/ (el servidor de la web lo redirige al de carnets)
- `pnpm build:site`: los dos builds y el sitio completo en `dist/` (carnets en `dist/carnets/`), tal como se publica
- `pnpm dev:carnets`, `pnpm build:carnets`, `pnpm test:carnets`: atajos a los scripts de `carnets/`
- `pnpm emulators`: emuladores de Firebase (Auth y Firestore) para carnets en local; necesitan Java 21.
  `pnpm test:rules`: tests de `firestore.rules` (arranca el emulador solo)

También puedes ejecutar `pnpm <script>` dentro de `carnets/`.

## Web del club

- Vue 3 + TypeScript + Vite 8 + Tailwind CSS 4 (plugin `@tailwindcss/vite`), cargado en `src/style.css`
  con `@import 'tailwindcss'`. No hay `tailwind.config.js`: en Tailwind 4 la personalización va en el propio CSS (`@theme`, `@custom-variant`).
- vue-i18n con catalán, castellano e inglés: `src/locales/{ca,es,en}.json`.
  Todo texto visible va en los tres idiomas.
- Componentes en `src/components/`.
- Alojada en Firebase Hosting (proyecto `arquers-club-castelldefels`). Se despliega con la CLI (`firebase-tools`,
  instalada aparte); la web no usa el SDK de Firebase. Cabeceras HTTP y caché en `firebase.json`.

Comandos (desde la raíz):

- `pnpm dev`: servidor de desarrollo en el puerto 3000
- `pnpm build`: comprobación de tipos (`vue-tsc`) + build de producción. Es la verificación de la web:
  no tiene tests.

## Reglas

- **Verifica antes de dar algo por terminado.** En la web, `pnpm build` sin errores.
  En carnets, `pnpm test:carnets` y `pnpm build:carnets` sin errores.
- **No despliegues sin permiso explícito.** `pnpm run deploy` publica en producción la web y el generador de carnets
  (`arquerscastelldefels.com/carnets/`): es un único sitio de Firebase, así que siempre van juntos.
  Ojo: con `run`. `pnpm deploy` a secas es un comando de pnpm que no tiene nada que ver.
  Las reglas de Firestore (`firestore.rules`, del login de carnets) van aparte: `pnpm deploy:rules`, también con permiso.
- **Datos de socios:** nunca subas CSV reales ni datos personales al repo ni a servicios externos.
  Los ficheros de prueba de `carnets/fixtures/` usan datos inventados.
- **Commits** con Conventional Commits (`feat:`, `fix:`, `chore:`…), como el historial existente.
