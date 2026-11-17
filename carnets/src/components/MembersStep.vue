<template>
  <StepSection :step="2" :title="t('members.title')">
    <FileDrop :label="csv ? t('csv.replace') : t('csv.drop')" :accept="ACCEPT" @file="loadCsvFile" />

    <p v-if="csvError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
      {{ t(`csv.${csvError}`) }}
    </p>

    <template v-if="csv">
      <div class="mt-4 text-sm">
        <p class="font-medium text-slate-900">{{ t('csv.loaded', { name: csvName, count: csv.rows.length }) }}</p>
        <p class="text-slate-500">{{ details }}</p>
      </div>

      <div v-if="!template" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p>{{ t('members.needTemplate') }}</p>
        <button type="button" :class="linkButton" @click="step = 1">{{ t('members.goTemplates') }}</button>
      </div>

      <fieldset v-else-if="csvFields.length > 0" class="mt-5">
        <legend class="text-sm font-semibold text-slate-900">{{ t('members.columns') }}</legend>
        <p class="mb-3 text-sm text-slate-600">{{ t('mapping.help') }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <template v-for="field in csvFields" :key="field.name">
            <!-- El nombre puede venir en una columna o en varias (nombre + apellidos) -->
            <div v-if="field.name === NAME_FIELD" class="text-sm sm:col-span-2">
              <span class="mb-1 block font-medium text-slate-700">{{ fieldLabel(t, te, field.name) }}</span>
              <div class="mb-2 flex flex-wrap gap-x-5 gap-y-1" role="radiogroup" :aria-label="t('mapping.nameMode')">
                <label class="flex items-center gap-2">
                  <input type="radio" :checked="!nameSplit" class="h-4 w-4 text-blue-600 focus:ring-blue-500" @change="nameSplit = false" />
                  {{ t('mapping.nameFull') }}
                </label>
                <label class="flex items-center gap-2">
                  <input type="radio" :checked="nameSplit" class="h-4 w-4 text-blue-600 focus:ring-blue-500" @change="nameSplit = true" />
                  {{ t('mapping.nameSplit') }}
                </label>
              </div>
              <div v-if="nameSplit" class="grid gap-3 sm:grid-cols-3">
                <label v-for="(part, i) in nameParts" :key="part" class="block">
                  <span class="mb-1 block text-xs font-medium text-slate-600">{{ t(`mapping.${part}`) }}</span>
                  <select :value="namePart(i)" :class="selectClass" @change="setNamePart(i, ($event.target as HTMLSelectElement).value)">
                    <option value="" :disabled="i < 2">{{ i < 2 ? t('mapping.choose') : t('mapping.none') }}</option>
                    <option v-for="header in csv.headers" :key="header" :value="header">{{ header }}</option>
                  </select>
                </label>
              </div>
              <select v-else v-model="mapping[field.name]" :class="selectClass" :aria-label="fieldLabel(t, te, field.name)">
                <option :value="undefined" disabled>{{ t('mapping.choose') }}</option>
                <option v-for="header in csv.headers" :key="header" :value="header">{{ header }}</option>
              </select>
            </div>
            <label v-else class="block text-sm">
              <span class="mb-1 block font-medium text-slate-700">{{ fieldLabel(t, te, field.name) }}</span>
              <select v-model="mapping[field.name]" :class="selectClass">
                <option :value="undefined" disabled>{{ t('mapping.choose') }}</option>
                <option v-for="header in csv.headers" :key="header" :value="header">{{ header }}</option>
              </select>
            </label>
          </template>
        </div>
      </fieldset>

      <template v-if="result">
        <!-- El resumen hace de filtro de la lista -->
        <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" :aria-label="t('members.filterLabel')">
          <button
            v-for="option in filters"
            :key="option.value"
            type="button"
            class="rounded-lg border p-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="[option.tone, filter === option.value ? 'ring-2 ring-blue-500' : 'border-transparent']"
            :aria-pressed="filter === option.value"
            @click="filter = option.value"
          >
            <span class="block text-2xl font-bold tabular-nums">{{ option.count }}</span>
            <span class="block text-xs font-medium">{{ option.label }}</span>
          </button>
        </div>
        <p v-if="result.rejected.length === 0 && result.warnings.length === 0" class="mt-3 text-sm text-green-700">
          {{ t('validation.allGood') }}
        </p>
      </template>
      <p v-else-if="template" class="mt-4 text-sm text-slate-500">{{ t('validation.waiting') }}</p>

      <div
        v-if="result && chosenCards.length > 0"
        class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"
      >
        <span class="font-medium">{{ t('members.chosen', { count: chosenCards.length }) }}</span>
        <button
          type="button"
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300"
          :disabled="generating"
          @click="downloadChosen"
        >
          {{ generating ? t('download.generating') : t('members.downloadChosen') }}
        </button>
        <button type="button" :class="linkButton" @click="chosenRows = new Set()">{{ t('members.clearChosen') }}</button>
        <span class="text-xs text-blue-800/80">{{ t('members.downloadHelp') }}</span>
      </div>
      <p v-if="downloadError" class="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
        {{ downloadError }}
      </p>

      <div class="mt-4 max-h-[32rem] overflow-auto rounded-lg border border-slate-200">
        <table class="min-w-full text-left text-sm">
          <caption class="sr-only">{{ t('members.title') }}</caption>
          <thead class="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th v-if="result" scope="col" class="w-8 py-2 pr-1 pl-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                  :checked="allShownChosen"
                  :indeterminate="someShownChosen && !allShownChosen"
                  :disabled="selectable.length === 0"
                  :aria-label="t('members.selectAll')"
                  :title="t('members.selectAll')"
                  @change="toggleAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">{{ t('csv.row') }}</th>
              <th v-if="result" scope="col" class="px-3 py-2 font-semibold">{{ t('members.status') }}</th>
              <th v-for="header in columns" :key="header" scope="col" class="px-3 py-2 font-semibold">{{ header }}</th>
              <th v-if="result" scope="col" class="px-3 py-2 font-semibold">{{ t('validation.issue') }}</th>
              <th v-if="result" scope="col" class="px-3 py-2"><span class="sr-only">{{ t('members.seeCard') }}</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="member in shown"
              :key="member.row.rowNumber"
              :class="member.status === 'rejected' ? 'bg-red-50/50' : chosenRows.has(member.row.rowNumber) ? 'bg-blue-50/60' : ''"
            >
              <td v-if="result" class="w-8 py-1.5 pr-1 pl-3 align-top">
                <input
                  v-if="member.card !== null"
                  type="checkbox"
                  class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  :checked="chosenRows.has(member.row.rowNumber)"
                  :aria-label="t('members.selectRow', { row: member.row.rowNumber })"
                  @change="toggle(member.row.rowNumber, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td class="px-3 py-1.5 align-top tabular-nums text-slate-400">{{ member.row.rowNumber }}</td>
              <td v-if="result" class="px-3 py-1.5 align-top">
                <span class="rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap" :class="badge[member.status!]">
                  {{ t(`members.${member.status}`) }}
                </span>
              </td>
              <td v-for="header in columns" :key="header" class="px-3 py-1.5 align-top whitespace-nowrap">
                {{ member.row.data[header] }}
              </td>
              <td v-if="result" class="px-3 py-1.5 align-top">
                <ul>
                  <li v-for="(issue, i) in member.issues" :key="i" :class="member.status === 'rejected' ? 'text-red-800' : 'text-amber-800'">
                    {{ describeIssue(t, te, issue) }}
                  </li>
                </ul>
              </td>
              <td v-if="result" class="px-3 py-1.5 text-right align-top whitespace-nowrap">
                <template v-if="member.card !== null">
                  <button type="button" :class="rowButton" @click="showCard(member.card)">{{ t('members.seeCard') }}</button>
                  <button type="button" :class="rowButton" :disabled="generating" @click="downloadOne(member.card)">
                    {{ t('members.downloadOne') }}
                  </button>
                </template>
              </td>
            </tr>
            <tr v-if="shown.length === 0">
              <td :colspan="columns.length + 5" class="px-3 py-4 text-center text-slate-500">{{ t('members.noneInFilter') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </StepSection>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fileSafe, useDownload } from '../app/download'
import { mappedColumns, NAME_FIELD } from '../app/mapping'
import { listMembers } from '../app/members'
import type { Member, MemberStatus } from '../app/members'
import { useCarnets } from '../app/useCarnets'
import { describeIssue, fieldLabel } from '../i18n'
import { LICENSE_FIELD } from '../pipeline'
import FileDrop from './FileDrop.vue'
import StepSection from './StepSection.vue'

type Filter = 'all' | MemberStatus

const { t, te } = useI18n()
const { step, template, csv, csvName, csvError, csvFields, mapping, mappingComplete, result, selected, chosenRows, chosenCards, loadCsvFile } =
  useCarnets()
const { generating, error: downloadError, season, download } = useDownload()

/** CSV y Excel (.xlsx, y el .xls que en realidad es una tabla HTML). */
const ACCEPT = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

const details = computed(() => {
  const file = csv.value
  if (!file) return ''
  if (file.format === 'xlsx') return t('csv.detailsExcel', { sheet: file.sheet })
  if (file.format === 'html') return t('csv.detailsHtml', { encoding: file.encoding?.toUpperCase() })
  return t('csv.details', { encoding: file.encoding?.toUpperCase(), delimiter: file.delimiter })
})

const selectClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const rowButton =
  'rounded px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:text-slate-400'

// Nombre en varias columnas: nombre de pila, apellidos y, si van aparte, el segundo apellido
const nameParts = ['firstName', 'surname', 'surname2'] as const
const nameSplit = computed({
  get: () => Array.isArray(mapping.value[NAME_FIELD]),
  set(split: boolean) {
    if (split) mapping.value[NAME_FIELD] = ['', '']
    else delete mapping.value[NAME_FIELD]
  },
})
const namePart = (i: number) => {
  const columns = mapping.value[NAME_FIELD]
  return Array.isArray(columns) ? (columns[i] ?? '') : ''
}
function setNamePart(i: number, header: string) {
  const columns = mapping.value[NAME_FIELD]
  const parts = Array.isArray(columns) ? [...columns] : []
  parts[i] = header
  mapping.value[NAME_FIELD] = Array.from({ length: Math.max(parts.length, 2) }, (_, n) => parts[n] ?? '')
}

const linkButton =
  'rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const badge: Record<MemberStatus, string> = {
  valid: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
}

const filter = ref<Filter>('all')
// Con un fichero nuevo se vuelve a ver la lista entera
watch(csv, () => (filter.value = 'all'))

/** Sin validación (falta la plantilla o alguna columna), la lista es el CSV tal cual, sin estado. */
const members = computed<(Omit<Member, 'status'> & { status?: MemberStatus })[]>(() => {
  if (!csv.value) return []
  if (result.value) return listMembers(csv.value.rows, result.value)
  return csv.value.rows.map((row) => ({ row, issues: [], card: null }))
})
const shown = computed(() => (filter.value === 'all' ? members.value : members.value.filter((m) => m.status === filter.value)))

/** Con las columnas asignadas solo se muestran esas (el CSV puede traer muchas más); si no, todas. */
const columns = computed(() => {
  if (!csv.value) return []
  if (!template.value || !mappingComplete.value) return csv.value.headers
  return [...new Set(csvFields.value.flatMap((f) => mappedColumns(mapping.value[f.name])))]
})

const count = (status: MemberStatus) => members.value.filter((m) => m.status === status).length
const filters = computed(() => [
  { value: 'all' as const, label: t('members.all'), count: members.value.length, tone: 'bg-slate-50 text-slate-700' },
  { value: 'valid' as const, label: t('members.validPlural'), count: count('valid'), tone: 'bg-green-50 text-green-800' },
  { value: 'warning' as const, label: t('validation.warnings'), count: count('warning'), tone: 'bg-amber-50 text-amber-800' },
  { value: 'rejected' as const, label: t('validation.rejected'), count: count('rejected'), tone: 'bg-red-50 text-red-800' },
])

// Selección: solo los socios con carnet (correctos o con aviso). "Todos" marca o desmarca los de la lista filtrada.
const selectable = computed(() => shown.value.filter((m) => m.card !== null).map((m) => m.row.rowNumber))
const allShownChosen = computed(() => selectable.value.length > 0 && selectable.value.every((row) => chosenRows.value.has(row)))
const someShownChosen = computed(() => selectable.value.some((row) => chosenRows.value.has(row)))

function toggle(row: number, on: boolean) {
  const next = new Set(chosenRows.value)
  if (on) next.add(row)
  else next.delete(row)
  chosenRows.value = next
}

function toggleAll(on: boolean) {
  const next = new Set(chosenRows.value)
  for (const row of selectable.value) {
    if (on) next.add(row)
    else next.delete(row)
  }
  chosenRows.value = next
}

function downloadChosen() {
  void download(chosenCards.value, t('download.chosenFile', { season: season.value }))
}

function downloadOne(index: number) {
  const card = result.value?.valid[index]
  if (!card) return
  const name = fileSafe([card.values[NAME_FIELD], card.values[LICENSE_FIELD]].filter(Boolean).join(' ')) || String(card.rowNumber)
  void download([card], t('download.oneFile', { name }))
}

function showCard(index: number) {
  selected.value = index
  step.value = 3
}
</script>
