import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildPdf, ImpositionError } from '../pipeline'
import type { CardData, PdfOptions } from '../pipeline'
import { useCarnets } from './useCarnets'

/** Texto apto para un nombre de fichero: sin caracteres que den problemas en Windows ni espacios. */
export function fileSafe(text: string): string {
  return text
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function saveFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Generar y descargar el PDF de unos carnets con las opciones del paso 3. Lo usan la descarga del paso 3 y la de
 * los socios seleccionados (o de uno solo) en la lista del paso 2.
 */
export function useDownload() {
  const { t } = useI18n()
  const { template, fontFiles, staticValues, pdfLayout, cropMarks, sideLayout } = useCarnets()
  const generating = ref(false)
  const error = ref<string | null>(null)

  /** Con anverso y reverso juntos, cada fila de la hoja lleva un carnet: caben 4 (1 × 4) en lugar de 8. */
  const options = computed<PdfOptions>(() => {
    const pairs = template.value?.sides === 2 && sideLayout.value === 'side-by-side'
    return {
      imposition: pdfLayout.value === 'grid' ? { kind: 'grid', cols: pairs ? 1 : 2, rows: 4 } : { kind: 'single' },
      cropMarks: cropMarks.value,
      sides: sideLayout.value,
    }
  })

  /** La temporada va en el nombre del fichero. */
  const season = computed(() => fileSafe(staticValues.value['temporada'] ?? '') || 'carnets')

  async function download(cards: CardData[], filename: string): Promise<void> {
    if (!template.value || !fontFiles.value || cards.length === 0) return
    generating.value = true
    error.value = null
    try {
      const bytes = await buildPdf(cards, template.value, options.value, fontFiles.value)
      saveFile(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), filename)
    } catch (e) {
      error.value =
        e instanceof ImpositionError
          ? t('download.doesNotFit', { cols: e.cols, rows: e.rows })
          : t('download.failed', { error: e instanceof Error ? e.message : String(e) })
    } finally {
      generating.value = false
    }
  }

  return { generating, error, season, download }
}
