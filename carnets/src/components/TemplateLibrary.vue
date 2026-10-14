<template>
  <section class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" aria-labelledby="library-title">
    <h3 id="library-title" class="font-semibold text-slate-900">{{ t('library.title') }}</h3>
    <p class="mt-1 text-slate-600">{{ t('library.help') }}</p>

    <ul class="mt-3 divide-y divide-slate-200">
      <li v-for="item in library" :key="item.id" class="py-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-medium break-words text-slate-900">{{ item.name }}</p>
            <p class="text-xs text-slate-500">
              {{ item.uploadedAt ? t('library.uploaded', { email: item.uploadedBy, date: day(item.uploadedAt) }) : item.uploadedBy }}
            </p>
            <p v-if="seasonsOf(item.id, assignments).length > 0" class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="s in seasonsOf(item.id, assignments)"
                :key="s"
                class="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ t('library.officialFor', { season: s }) }}
              </span>
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <button type="button" :class="smallButton" @click="previewTemplate(item.id)">{{ t('library.preview') }}</button>
            <button type="button" :class="smallButton" @click="open(item.id, 'approve')">{{ t('library.approve') }}</button>
            <button type="button" :class="smallButton" @click="open(item.id, 'rename', item.name)">{{ t('library.rename') }}</button>
            <button
              type="button"
              :class="[smallButton, 'text-red-700 hover:bg-red-50']"
              :disabled="seasonsOf(item.id, assignments).length > 0"
              :title="seasonsOf(item.id, assignments).length > 0 ? t('library.cannotDelete') : undefined"
              @click="open(item.id, 'delete')"
            >
              {{ t('library.delete') }}
            </button>
          </div>
        </div>

        <form v-if="editing?.id === item.id && editing.mode === 'approve'" class="mt-2 flex flex-wrap items-end gap-2" @submit.prevent="approve(item.id)">
          <SeasonField v-model="seasonInput" />
          <button type="submit" :class="primaryButton" :disabled="busy || !isSeason(seasonInput)">
            {{ t('library.approveFor', { season: seasonInput }) }}
          </button>
          <button type="button" :class="smallButton" @click="editing = null">{{ t('library.cancel') }}</button>
        </form>

        <form v-if="editing?.id === item.id && editing.mode === 'rename'" class="mt-2 flex flex-wrap items-end gap-2" @submit.prevent="rename(item.id)">
          <label class="flex min-w-48 flex-1 flex-col gap-1">
            <span class="font-medium text-slate-700">{{ t('publish.name') }}</span>
            <input
              v-model="nameInput"
              type="text"
              :maxlength="NAME_MAX_LENGTH"
              class="rounded-md border border-slate-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :aria-invalid="!cleanName(nameInput)"
            />
          </label>
          <button type="submit" :class="primaryButton" :disabled="busy || !cleanName(nameInput)">{{ t('library.save') }}</button>
          <button type="button" :class="smallButton" @click="editing = null">{{ t('library.cancel') }}</button>
        </form>

        <div v-if="editing?.id === item.id && editing.mode === 'delete'" class="mt-2 flex flex-wrap items-center gap-2" role="alert">
          <span class="text-red-800">{{ t('library.confirmDelete', { name: item.name }) }}</span>
          <button type="button" :class="dangerButton" :disabled="busy" @click="remove(item.id)">{{ t('library.deleteForever') }}</button>
          <button type="button" :class="smallButton" @click="editing = null">{{ t('library.cancel') }}</button>
        </div>
      </li>
    </ul>

    <div v-if="assignment" class="mt-4 border-t border-slate-200 pt-4">
      <h4 class="font-semibold text-slate-900">{{ t('library.history', { season: assignment.season }) }}</h4>
      <ol v-if="history.length > 0" class="mt-2 space-y-1 text-slate-700">
        <li v-for="(entry, i) in history" :key="i">
          <span class="tabular-nums text-slate-500">{{ entry.assignedAt ? day(entry.assignedAt) : '—' }}</span>
          · <span class="font-medium">{{ entry.name }}</span>
          · <span class="text-slate-500">{{ entry.assignedBy }}</span>
          <span v-if="i === 0" class="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">{{ t('library.current') }}</span>
        </li>
      </ol>
      <p v-else class="mt-2 text-slate-500">{{ t('library.noHistory') }}</p>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <template v-if="confirmUnassign">
          <span class="text-red-800">{{ t('library.confirmUnassign', { season: assignment.season }) }}</span>
          <button type="button" :class="dangerButton" :disabled="busy" @click="unassign(assignment.season)">
            {{ t('library.unassign', { season: assignment.season }) }}
          </button>
          <button type="button" :class="smallButton" @click="confirmUnassign = false">{{ t('library.cancel') }}</button>
        </template>
        <button v-else type="button" :class="[smallButton, 'text-red-700 hover:bg-red-50']" @click="confirmUnassign = true">
          {{ t('library.unassign', { season: assignment.season }) }}
        </button>
      </div>
    </div>

    <p v-if="failed" class="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-red-800" role="alert">{{ t('library.failed') }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentSeason, isSeason } from '../app/season'
import { cleanName, NAME_MAX_LENGTH, seasonsOf } from '../app/templateLibrary'
import type { HistoryEntry } from '../app/templateLibrary'
import { useCarnets } from '../app/useCarnets'
import { useSession } from '../app/useSession'
import SeasonField from './SeasonField.vue'

const { t, locale } = useI18n()
const { library, assignments, assignment, season, previewTemplate, approveTemplate, renameTemplate, deleteTemplate, unassignSeason, loadHistory } =
  useCarnets()
const { email } = useSession()

const smallButton =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40'
const primaryButton =
  'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
const dangerButton =
  'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50'

/** Acción abierta en una plantilla: solo una a la vez. */
const editing = ref<{ id: string; mode: 'approve' | 'rename' | 'delete' } | null>(null)
const seasonInput = ref('')
const nameInput = ref('')
const confirmUnassign = ref(false)
const busy = ref(false)
const failed = ref(false)
const history = ref<HistoryEntry[]>([])

const day = (date: Date) => date.toLocaleDateString(locale.value)

function open(id: string, mode: 'approve' | 'rename' | 'delete', name = '') {
  editing.value = { id, mode }
  seasonInput.value = season.value ?? currentSeason(new Date())
  nameInput.value = name
}

/** Ejecuta una acción sobre la biblioteca y, si va bien, cierra el formulario abierto. */
async function run(action: () => Promise<void>) {
  busy.value = true
  failed.value = false
  try {
    await action()
    editing.value = null
    confirmUnassign.value = false
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

const approve = (id: string) =>
  run(async () => {
    if (email.value && isSeason(seasonInput.value)) await approveTemplate(id, seasonInput.value, email.value)
  })
const rename = (id: string) =>
  run(async () => {
    const clean = cleanName(nameInput.value)
    if (clean) await renameTemplate(id, clean)
  })
const remove = (id: string) => run(() => deleteTemplate(id))
const unassign = (target: string) => run(() => unassignSeason(target))

// El historial de la temporada elegida: se vuelve a leer al cambiar de temporada o tras aprobar una plantilla
watch(
  assignment,
  async (current) => {
    history.value = []
    if (!current) return
    try {
      history.value = await loadHistory(current.season)
    } catch {
      failed.value = true
    }
  },
  { immediate: true },
)
</script>
