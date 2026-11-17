<template>
  <StepSection :title="t('download.title')">
    <fieldset v-if="template?.sides === 2" class="mb-4 space-y-2 text-sm">
      <legend class="mb-1 font-medium text-slate-700">{{ t('download.sides') }}</legend>
      <label class="flex items-center gap-2">
        <input v-model="sideLayout" type="radio" value="separate" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ t('download.separate') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="sideLayout" type="radio" value="side-by-side" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ t('download.sideBySide') }}
      </label>
    </fieldset>
    <fieldset class="space-y-2 text-sm">
      <legend class="mb-1 font-medium text-slate-700">{{ t('download.layout') }}</legend>
      <label class="flex items-center gap-2">
        <input v-model="pdfLayout" type="radio" value="grid" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ pairs ? t('download.gridPairs') : t('download.grid') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="pdfLayout" type="radio" value="single" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        {{ t('download.single') }}
      </label>
      <label class="flex items-center gap-2 pt-2">
        <input v-model="cropMarks" type="checkbox" class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
        {{ t('download.cropMarks') }}
      </label>
    </fieldset>
    <p v-if="template?.sides === 2" class="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
      {{ pairs ? t('download.sideBySideHelp') : t('download.duplexHelp') }}
    </p>

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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveFile, useDownload } from '../app/download'
import { useCarnets } from '../app/useCarnets'
import { describeIssue } from '../i18n'
import { buildReport } from '../pipeline'
import StepSection from './StepSection.vue'

const { t, te } = useI18n()
const { template, fontFiles, csv, result, pdfLayout, cropMarks, sideLayout } = useCarnets()
const { generating, error, season, download } = useDownload()

const pairs = computed(() => template.value?.sides === 2 && sideLayout.value === 'side-by-side')
const canDownload = computed(() => Boolean(template.value && fontFiles.value && result.value && result.value.valid.length > 0))

function downloadPdf() {
  if (result.value) void download(result.value.valid, t('download.pdfFile', { season: season.value }))
}

function downloadReport() {
  if (!result.value || !csv.value) return
  const report = buildReport(result.value.rejected, csv.value.headers, {
    row: t('report.row'),
    reason: t('report.reason'),
    describe: (issue) => describeIssue(t, te, issue),
  })
  saveFile(new Blob([report], { type: 'text/csv;charset=utf-8' }), t('download.reportFile', { season: season.value }))
}
</script>
