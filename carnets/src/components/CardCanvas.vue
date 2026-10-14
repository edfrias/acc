<template>
  <div>
    <figure v-for="side in shown" :key="side" :class="side > 0 ? 'mt-3' : ''">
      <figcaption v-if="shown.length > 1" class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ side === 0 ? t('preview.front') : t('preview.back') }}
      </figcaption>
      <div
        :ref="(el) => (frames[side] = el as HTMLDivElement)"
        class="relative w-full overflow-hidden rounded-md bg-slate-100 shadow-inner"
        :style="{ aspectRatio }"
      >
        <canvas
          :ref="(el) => (canvases[side] = el as HTMLCanvasElement)"
          class="block h-full w-full"
          role="img"
          :aria-label="side === 0 ? t('preview.alt') : t('preview.altBack')"
        />
        <!-- Línea de corte: lo que queda fuera es sangrado y se recorta. -->
        <div
          v-if="trim && template"
          class="pointer-events-none absolute border border-dashed border-slate-500/70"
          :style="trimStyle"
          aria-hidden="true"
        />
        <p v-if="!fontFiles" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          {{ t('loading') }}
        </p>
      </div>
    </figure>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDocument, GlobalWorkerOptions, RenderingCancelledException } from 'pdfjs-dist'
import type { RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { buildPdf } from '../pipeline'
import type { CardData, FontFiles, Template } from '../pipeline'

GlobalWorkerOptions.workerSrc = workerUrl

const props = defineProps<{
  template: Template | null
  card: CardData | undefined
  fontFiles: FontFiles | null
  /** Solo la cara, aunque la plantilla tenga reverso (miniaturas de la galería). */
  frontOnly?: boolean
  /** Dibuja la línea de corte encima. */
  trim?: boolean
}>()

const { t } = useI18n()

/** Un lienzo por cara: la cara (0) y, si la plantilla tiene dos caras, el reverso (1). */
const shown = computed(() => (props.template?.sides === 2 && !props.frontOnly ? [0, 1] : [0]))
const frames: HTMLDivElement[] = []
const canvases: HTMLCanvasElement[] = []

const aspectRatio = computed(() => (props.template ? `${props.template.width} / ${props.template.height}` : '91.6 / 60'))
const trimStyle = computed(() => {
  const tpl = props.template
  if (!tpl) return {}
  const x = (tpl.bleed / tpl.width) * 100
  const y = (tpl.bleed / tpl.height) * 100
  return { left: `${x}%`, right: `${x}%`, top: `${y}%`, bottom: `${y}%`, borderRadius: '6%/9%' }
})

const tasks: (RenderTask | null)[] = []
let generation = 0

/**
 * Genera el PDF de un carnet y lo dibuja: la previsualización es exactamente lo que se imprimirá.
 * Con dos caras, el PDF tiene dos páginas: la cara y el reverso.
 */
async function draw() {
  const current = ++generation
  await nextTick()
  const { template, card, fontFiles } = props
  if (!template || !fontFiles || !card) return

  const bytes = await buildPdf([card], template, { imposition: { kind: 'single' }, cropMarks: false }, fontFiles)
  if (current !== generation) return
  const loading = getDocument({ data: bytes })
  try {
    const pdf = await loading.promise
    for (const side of shown.value) {
      const frame = frames[side]
      const canvas = canvases[side]
      if (!frame || !canvas) continue
      const page = await pdf.getPage(side + 1)
      if (current !== generation) return
      const scale = (frame.clientWidth / page.getViewport({ scale: 1 }).width) * window.devicePixelRatio
      const viewport = page.getViewport({ scale })
      tasks[side]?.cancel()
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      tasks[side] = page.render({ canvas, viewport })
      await tasks[side].promise
    }
  } catch (error) {
    if (!(error instanceof RenderingCancelledException)) throw error
  } finally {
    await loading.destroy()
  }
}

watch(() => [props.card, props.template, props.fontFiles, shown.value], draw)

let resize: ResizeObserver | null = null
onMounted(() => {
  // Todas las caras tienen el mismo ancho: basta con observar la primera
  resize = new ResizeObserver(() => draw())
  if (frames[0]) resize.observe(frames[0])
  draw()
})
onBeforeUnmount(() => {
  generation++
  resize?.disconnect()
})
</script>
