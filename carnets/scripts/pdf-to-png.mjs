// Rasteriza un PDF a PNG, una imagen por página, para revisar el resultado sin abrir un visor.
// Uso: node scripts/pdf-to-png.mjs entrada.pdf [ppp=150]
import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const [input, dpiArg = '150'] = process.argv.slice(2)
if (!input) {
  console.error('Uso: node scripts/pdf-to-png.mjs entrada.pdf [ppp]')
  process.exit(1)
}
const scale = Number(dpiArg) / 72
const pdf = await getDocument({ data: new Uint8Array(readFileSync(input)) }).promise
for (let n = 1; n <= pdf.numPages; n++) {
  const page = await pdf.getPage(n)
  const viewport = page.getViewport({ scale })
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvas, canvasContext: context, viewport }).promise
  const output = input.replace(/\.pdf$/i, '') + `-${n}.png`
  writeFileSync(output, canvas.toBuffer('image/png'))
  console.log(output)
}
