<template>
  <StepSection :step="2" :title="t('csv.title')">
    <FileDrop :label="csv ? t('csv.replace') : t('csv.drop')" accept=".csv,text/csv" @file="loadCsvFile" />

    <p v-if="csvError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
      {{ t(`csv.${csvError}`) }}
    </p>

    <div v-if="csv" class="mt-4 space-y-3">
      <div class="text-sm">
        <p class="font-medium text-slate-900">{{ t('csv.loaded', { name: csvName, count: csv.rows.length }) }}</p>
        <p class="text-slate-500">
          {{ t('csv.details', { encoding: csv.encoding.toUpperCase(), delimiter: csv.delimiter }) }}
        </p>
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="min-w-full text-left text-sm">
          <caption class="sr-only">{{ t('csv.preview', { shown: shown.length, total: csv.rows.length }) }}</caption>
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" class="px-3 py-2 font-semibold">{{ t('csv.row') }}</th>
              <th v-for="header in csv.headers" :key="header" scope="col" class="px-3 py-2 font-semibold">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in shown" :key="row.rowNumber">
              <td class="px-3 py-1.5 tabular-nums text-slate-400">{{ row.rowNumber }}</td>
              <td v-for="header in csv.headers" :key="header" class="whitespace-nowrap px-3 py-1.5">
                {{ row.data[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="csv.rows.length > shown.length" class="text-xs text-slate-500">
        {{ t('csv.preview', { shown: shown.length, total: csv.rows.length }) }}
      </p>
    </div>
  </StepSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import FileDrop from './FileDrop.vue'
import StepSection from './StepSection.vue'

const PREVIEW_ROWS = 5

const { t } = useI18n()
const { csv, csvName, csvError, loadCsvFile } = useCarnets()

const shown = computed(() => csv.value?.rows.slice(0, PREVIEW_ROWS) ?? [])
</script>
