# Arquers Club Castelldefels

Instrucciones para agentes que trabajen en este repositorio. El repo contiene dos proyectos independientes.

## Proyectos

| Carpeta | Qué es | Instrucciones |
|---|---|---|
| raíz (`src/`) | Web pública del club | Este fichero |
| `carnets/` | Generador de carnets de soci | [`carnets/CLAUDE.md`](carnets/CLAUDE.md), léelo antes de tocar nada ahí |

Cada proyecto tiene su propio `package.json` y `node_modules`. Ejecuta los comandos desde la carpeta
del proyecto en el que trabajes.

## Web del club

- Vue 3 + TypeScript + Vite 7 + Tailwind CSS 4, cargado en `src/style.css` con `@import 'tailwindcss'`.
  `tailwind.config.js` es un resto de la v3: no se carga (no hay `@config`), así que cambiarlo no tiene efecto.
- vue-i18n con catalán, castellano e inglés: `src/locales/{ca,es,en}.json`.
  Todo texto visible va en los tres idiomas.
- Componentes en `src/components/`; configuración de Firebase en `src/firebase/config.ts`, leída de `.env`
  (plantilla en `.env.example`, nunca subas `.env`).
- Alojada en Firebase Hosting (proyecto `arquers-club-castelldefels`).

Comandos (desde la raíz):

- `npm run dev`: servidor de desarrollo en el puerto 3000
- `npm run build`: comprobación de tipos (`vue-tsc`) + build de producción. Es la verificación de la web:
  no tiene tests.

## Reglas

- **Verifica antes de dar algo por terminado.** En la web, `npm run build` sin errores.
  En `carnets/`, `npm test` y `npm run build` sin errores.
- **No despliegues sin permiso explícito.** `npm run deploy` publica la web en producción.
- **Datos de socios:** nunca subas CSV reales ni datos personales al repo ni a servicios externos.
  Los ficheros de prueba de `carnets/fixtures/` usan datos inventados.
- **Commits** con Conventional Commits (`feat:`, `fix:`, `chore:`…), como el historial existente.
