// Monta el sitio completo para Firebase Hosting: copia el build de carnets en dist/carnets/,
// donde se sirve como arquerscastelldefels.com/carnets/. Se ejecuta tras los builds de las dos apps
// (pnpm build:site); por separado, cada build solo escribe en su propio dist/.
import { cpSync, existsSync, rmSync } from 'node:fs'

const from = 'carnets/dist'
const to = 'dist/carnets'

if (!existsSync('dist/index.html') || !existsSync(`${from}/index.html`)) {
  console.error('Faltan los builds: ejecuta pnpm build:site (o pnpm build y pnpm build:carnets antes).')
  process.exit(1)
}

rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })
console.log(`${from} → ${to}`)
