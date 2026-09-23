<template>
  <StepSection :step="5" :title="t('download.title')">
    <fieldset class="space-y-2 text-sm">
      <legend class="mb-1 font-medium text-slate-700">{{ t('download.layout') }}</legend>
      <label class="flex items-center gap-2">
        <input v-model="layout" type="radio" value="grid" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ t('download.grid') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="layout" type="radio" value="single" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ t('download.single') }}
      </label>
      <label class="flex items-center gap-2 pt-2">
        <input v-model="cropMarks" type="checkbox" class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
        {{ t('download.cropMarks') }}
      </label>
    </fieldset>

    <button
      type="button"
      class="mt-4 w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
      :disabled="!canDownload || generating"
      @click="downloadPdf"
    >
      {{ generating ? t('download.generating') : t('download.pdf', { count: result?.valid.length ?? 0 }) }}
    </button>
    <p v-if="error" class="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
      {{ error }}
    </p>

    <template v-if="result && result.rejected.length > 0">
      <button
        type="button"
        class="mt-3 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="downloadReport"
      >
        {{ t('download.report', { count: result.rejected.length }) }}
      </button>
      <p class="mt-1 text-xs text-slate-500">{{ t('download.reportHelp') }}</p>
    </template>
  </StepSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import { describeIssue } from '../i18n'
import { buildPdf, buildReport, ImpositionError } from '../pipeline'
import type { PdfOptions } from '../pipeline'
import StepSection from './StepSection.vue'

const { t, te } = useI18n()
const { template, fontFiles, csv, result, staticValues } = useCarnets()

const layout = ref<'grid' | 'single'>('grid')
const cropMarks = ref(true)
const generating = ref(false)
const error = ref<string | null>(null)

const canDownload = computed(() => Boolean(template.value && fontFiles.value && result.value && result.value.valid.length > 0))
/** La temporada va en el nombre del fichero: sin caracteres que den problemas en Windows. */
const season = computed(() => (staticValues.value['temporada'] ?? '').trim().replace(/[\\/:*?"<>|\s]+/g, '-') || 'carnets')

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadPdf() {
  if (!template.value || !fontFiles.value || !result.value) return
  const options: PdfOptions = {
    imposition: layout.value === 'grid' ? { kind: 'grid', cols: 2, rows: 4 } : { kind: 'single' },
    cropMarks: cropMarks.value,
  }
  generating.value = true
  error.value = null
  try {
    const bytes = await buildPdf(result.value.valid, template.value, options, fontFiles.value)
    save(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), t('download.pdfFile', { season: season.value }))
  } catch (e) {
    error.value =
      e instanceof ImpositionError
        ? t('download.doesNotFit', { cols: e.cols, rows: e.rows })
        : t('download.failed', { error: e instanceof Error ? e.message : String(e) })
  } finally {
    generating.value = false
  }
}

function downloadReport() {
  if (!result.value || !csv.value) return
  const report = buildReport(result.value.rejected, csv.value.headers, {
    row: t('report.row'),
    reason: t('report.reason'),
    describe: (issue) => describeIssue(t, te, issue),
  })
  save(new Blob([report], { type: 'text/csv;charset=utf-8' }), t('download.reportFile', { season: season.value }))
}
</script>
