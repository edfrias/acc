<template>
  <StepSection :title="t('preview.title')">
    <figure v-for="side in sides" :key="side" :class="side > 0 ? 'mt-3' : ''">
      <figcaption v-if="sides.length > 1" class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          v-if="template"
          class="pointer-events-none absolute border border-dashed border-slate-500/70"
          :style="trimStyle"
          aria-hidden="true"
        />
        <p v-if="!fontFiles" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          {{ t('loading') }}
        </p>
      </div>
    </figure>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p class="text-slate-600" aria-live="polite">
        <template v-if="cards.length > 0">
          {{ t('preview.position', { current: selected + 1, total: cards.length, row: card?.rowNumber }) }}
        </template>
        <template v-else>{{ t('preview.sample') }}</template>
      </p>
      <div v-if="cards.length > 0" class="flex gap-1">
        <button type="button" :class="buttonClass" :disabled="selected === 0" @click="selected--">
          {{ t('preview.previous') }}
        </button>
        <button type="button" :class="buttonClass" :disabled="selected >= cards.length - 1" @click="selected++">
          {{ t('preview.next') }}
        </button>
      </div>
    </div>
    <button
      v-if="cards.length > 1"
      type="button"
      class="mt-2 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @click="showWidest"
    >
      {{ t('preview.widest') }}
    </button>
  </StepSection>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDocument, GlobalWorkerOptions, RenderingCancelledException } from 'pdfjs-dist'
import type { RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { sampleCard, widestCard } from '../app/cards'
import { useCarnets } from '../app/useCarnets'
import { buildPdf } from '../pipeline'
import StepSection from './StepSection.vue'

GlobalWorkerOptions.workerSrc = workerUrl

const { t } = useI18n()
const { template, fontFiles, fonts, result, selected, staticValues } = useCarnets()

/** Un lienzo por cara: la cara (0) y, si la plantilla tiene dos caras, el reverso (1). */
const sides = computed(() => (template.value?.sides === 2 ? [0, 1] : [0]))
const frames: HTMLDivElement[] = []
const canvases: HTMLCanvasElement[] = []

const cards = computed(() => result.value?.valid ?? [])
/** Sin socios cargados se enseña la plantilla con su texto de ejemplo. */
const card = computed(() => {
  if (cards.value.length > 0) return cards.value[selected.value]
  return template.value ? sampleCard(template.value, staticValues.value) : undefined
})

const aspectRatio = computed(() => (template.value ? `${template.value.width} / ${template.value.height}` : '91.6 / 60'))
const trimStyle = computed(() => {
  const tpl = template.value
  if (!tpl) return {}
  const x = (tpl.bleed / tpl.width) * 100
  const y = (tpl.bleed / tpl.height) * 100
  return { left: `${x}%`, right: `${x}%`, top: `${y}%`, bottom: `${y}%`, borderRadius: '6%/9%' }
})

const buttonClass =
  'rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40'

function showWidest() {
  if (!template.value || !fonts.value) return
  const index = widestCard(cards.value, template.value, fonts.value, 'nombre')
  if (index >= 0) selected.value = index
}

const tasks: (RenderTask | null)[] = []
let generation = 0

/**
 * Genera el PDF de un carnet y lo dibuja: la previsualización es exactamente lo que se imprimirá.
 * Con dos caras, el PDF tiene dos páginas: la cara y el reverso.
 */
async function draw() {
  const current = ++generation
  await nextTick()
  if (!template.value || !fontFiles.value || !card.value) return

  const bytes = await buildPdf([card.value], template.value, { imposition: { kind: 'single' }, cropMarks: false }, fontFiles.value)
  const loading = getDocument({ data: bytes })
  try {
    const pdf = await loading.promise
    for (const side of sides.value) {
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

watch([card, template, fontFiles], draw)

let resize: ResizeObserver | null = null
onMounted(() => {
  // Todas las caras tienen el mismo ancho: basta con observar la primera
  resize = new ResizeObserver(() => draw())
  if (frames[0]) resize.observe(frames[0])
  draw()
})
onBeforeUnmount(() => resize?.disconnect())
</script>
