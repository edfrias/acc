import fontkit from '@pdf-lib/fontkit'
import type { Font } from '@pdf-lib/fontkit'

/** Fuentes de la plantilla indexadas por peso (500, 600, 700…). */
export type FontSet = ReadonlyMap<number, Font>

export function loadFontSet(files: Record<number, Uint8Array>): FontSet {
  return new Map(Object.entries(files).map(([weight, bytes]) => [Number(weight), fontkit.create(bytes)]))
}

export function fontFor(fonts: FontSet, weight: number): Font {
  const font = fonts.get(weight)
  if (!font) throw new Error(`No hay fuente cargada para el peso ${weight}.`)
  return font
}

/**
 * Ancho del texto en mm a tamaño 1 mm, sin letter-spacing.
 * Suma los avances de los glifos sin kerning, igual que pdf-lib al dibujar,
 * para que lo que se valida sea lo que se imprime.
 */
export function unitWidth(font: Font, text: string): number {
  let total = 0
  for (const glyph of font.layout(text).glyphs) total += glyph.advanceWidth
  return total / font.unitsPerEm
}

/** Caracteres del texto que la fuente no puede dibujar, sin repetir. */
export function missingGlyphs(font: Font, text: string): string[] {
  const missing = new Set<string>()
  for (const char of text) {
    if (!/\s/.test(char) && !font.hasGlyphForCodePoint(char.codePointAt(0)!)) missing.add(char)
  }
  return [...missing]
}
