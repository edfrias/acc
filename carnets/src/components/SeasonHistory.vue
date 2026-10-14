<template>
  <StepSection :title="t('seasons.title')">
    <label class="flex flex-wrap items-center gap-2 text-sm">
      <span class="font-medium text-slate-700">{{ t('template.season') }}</span>
      <select
        v-model="viewed"
        class="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="a in assignments" :key="a.season" :value="a.season">{{ a.season }}</option>
      </select>
    </label>

    <template v-if="current">
      <p class="mt-3 text-sm text-slate-700">
        <template v-if="currentName">{{ t('seasons.official', { name: currentName }) }}</template>
        <span v-else class="text-amber-800">{{ t('template.missing', { season: current.season }) }}</span>
      </p>

      <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ t('library.history', { season: current.season }) }}</h3>
      <ol v-if="history.length > 0" class="mt-2 space-y-1 text-sm text-slate-700">
        <li v-for="(entry, i) in history" :key="i">
          <span class="tabular-nums text-slate-500">{{ entry.assignedAt ? day(entry.assignedAt) : '—' }}</span>
          · <span class="font-medium">{{ entry.name }}</span>
          · <span class="text-slate-500">{{ entry.assignedBy }}</span>
          <span v-if="i === 0" class="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">{{ t('library.current') }}</span>
        </li>
      </ol>
      <p v-else class="mt-2 text-sm text-slate-500">{{ t('library.noHistory') }}</p>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <template v-if="confirmUnassign">
          <span class="text-red-800">{{ t('library.confirmUnassign', { season: current.season }) }}</span>
          <button type="button" :class="dangerButton" :disabled="busy" @click="unassign(current.season)">
            {{ t('library.unassign', { season: current.season }) }}
          </button>
          <button type="button" :class="smallButton" @click="confirmUnassign = false">{{ t('library.cancel') }}</button>
        </template>
        <button v-else type="button" :class="[smallButton, 'text-red-700 hover:bg-red-50']" @click="confirmUnassign = true">
          {{ t('library.unassign', { season: current.season }) }}
        </button>
      </div>
    </template>

    <p v-if="failed" class="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">{{ t('library.failed') }}</p>
  </StepSection>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HistoryEntry } from '../app/templateLibrary'
import { useCarnets } from '../app/useCarnets'
import StepSection from './StepSection.vue'

const { t, locale } = useI18n()
const { library, assignments, season, unassignSeason, loadHistory } = useCarnets()

const smallButton =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
const dangerButton =
  'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50'

/** Temporada que se consulta aquí. Mirarla no cambia la plantilla en uso. */
const viewed = ref(season.value ?? assignments.value[0]?.season ?? '')
const current = computed(() => assignments.value.find((a) => a.season === viewed.value) ?? assignments.value[0])
const currentName = computed(() => library.value.find((t) => t.id === current.value?.template)?.name)

const confirmUnassign = ref(false)
const busy = ref(false)
const failed = ref(false)
const history = ref<HistoryEntry[]>([])

const day = (date: Date) => date.toLocaleDateString(locale.value)

// Al usar o aprobar una plantilla para otra temporada, se pasa a mirar esa
watch(season, (value) => {
  if (value) viewed.value = value
})

async function unassign(target: string) {
  busy.value = true
  failed.value = false
  try {
    await unassignSeason(target)
    confirmUnassign.value = false
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

// El historial se vuelve a leer al cambiar de temporada o tras aprobar una plantilla (cambia la asignación)
watch(
  current,
  async (assignment) => {
    history.value = []
    confirmUnassign.value = false
    if (!assignment) return
    try {
      history.value = await loadHistory(assignment.season)
    } catch {
      failed.value = true
    }
  },
  { immediate: true },
)
</script>
