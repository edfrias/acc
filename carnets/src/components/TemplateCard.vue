<template>
  <li
    class="flex flex-col rounded-lg border bg-white p-3 text-sm shadow-sm"
    :class="inUse ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'"
  >
    <button
      type="button"
      class="block w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :aria-label="t('gallery.useNamed', { name: item.name })"
      @click="selectTemplate(item.id)"
    >
      <CardCanvas v-if="parsed" :template="parsed" :card="sample" :font-files="fontFiles" front-only />
      <div v-else class="flex aspect-[91.6/60] items-center justify-center rounded-md bg-slate-100 p-2 text-xs text-slate-500">
        {{ t('gallery.unreadable') }}
      </div>
    </button>

    <div class="mt-3 min-w-0 flex-1">
      <p class="font-medium break-words text-slate-900">{{ item.name }}</p>
      <p class="text-xs text-slate-500">
        {{ item.uploadedAt ? t('library.uploaded', { email: item.uploadedBy, date: day(item.uploadedAt) }) : item.uploadedBy }}
      </p>
      <p v-if="inUse || seasons.length > 0 || parsed?.sides === 2" class="mt-1 flex flex-wrap gap-1">
        <span v-if="inUse" class="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">{{ t('gallery.inUse') }}</span>
        <span v-for="s in seasons" :key="s" class="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
          {{ t('library.officialFor', { season: s }) }}
        </span>
        <span v-if="parsed?.sides === 2" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
          {{ t('gallery.duplex') }}
        </span>
      </p>
    </div>

    <div class="mt-3 flex flex-wrap gap-1">
      <button v-if="!inUse" type="button" :class="primarySmall" :disabled="!parsed" @click="selectTemplate(item.id)">
        {{ t('gallery.use') }}
      </button>
      <button type="button" :class="smallButton" @click="open('approve')">{{ t('library.approve') }}</button>
      <button type="button" :class="smallButton" @click="open('rename', item.name)">{{ t('library.rename') }}</button>
      <button
        type="button"
        :class="[smallButton, 'text-red-700 hover:bg-red-50']"
        :disabled="seasons.length > 0"
        :title="seasons.length > 0 ? t('library.cannotDelete') : undefined"
        @click="open('delete')"
      >
        {{ t('library.delete') }}
      </button>
    </div>

    <form v-if="editing === 'approve'" class="mt-3 flex flex-wrap items-end gap-2" @submit.prevent="approve">
      <SeasonField v-model="seasonInput" />
      <button type="submit" :class="primaryButton" :disabled="busy || !isSeason(seasonInput)">
        {{ t('library.approveFor', { season: seasonInput }) }}
      </button>
      <button type="button" :class="smallButton" @click="editing = null">{{ t('library.cancel') }}</button>
      <p v-if="replaced" class="w-full text-xs text-amber-800">
        {{ t('publish.replaceWarning', { season: seasonInput, name: replaced }) }}
      </p>
    </form>

    <form v-if="editing === 'rename'" class="mt-3 flex flex-wrap items-end gap-2" @submit.prevent="rename">
      <label class="flex min-w-40 flex-1 flex-col gap-1">
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

    <div v-if="editing === 'delete'" class="mt-3 flex flex-wrap items-center gap-2" role="alert">
      <span class="w-full text-red-800">{{ t('library.confirmDelete', { name: item.name }) }}</span>
      <button type="button" :class="dangerButton" :disabled="busy" @click="remove">{{ t('library.deleteForever') }}</button>
      <button type="button" :class="smallButton" @click="editing = null">{{ t('library.cancel') }}</button>
    </div>

    <p v-if="failed" class="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-red-800" role="alert">{{ t('library.failed') }}</p>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sampleCard } from '../app/cards'
import { currentSeason, isSeason } from '../app/season'
import { cleanName, NAME_MAX_LENGTH, seasonsOf } from '../app/templateLibrary'
import type { LibraryTemplate } from '../app/templateLibrary'
import { useCarnets } from '../app/useCarnets'
import { useSession } from '../app/useSession'
import { parseTemplate } from '../pipeline'
import type { Template } from '../pipeline'
import CardCanvas from './CardCanvas.vue'
import SeasonField from './SeasonField.vue'

const props = defineProps<{ item: LibraryTemplate }>()

const { t, locale } = useI18n()
const { library, assignments, season, templateId, fontFiles, selectTemplate, approveTemplate, renameTemplate, deleteTemplate } =
  useCarnets()
const { email } = useSession()

const smallButton =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40'
const primarySmall =
  'rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton =
  'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
const dangerButton =
  'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50'

/** Plantilla compilada para la miniatura; `null` si no se puede leer (no debería pasar: se comprobó al publicarla). */
const parsed = computed<Template | null>(() => {
  try {
    return parseTemplate(props.item.svg)
  } catch {
    return null
  }
})
/** La miniatura muestra el texto de ejemplo de la plantilla. */
const sample = computed(() => (parsed.value ? sampleCard(parsed.value, {}) : undefined))
const seasons = computed(() => seasonsOf(props.item.id, assignments.value))
const inUse = computed(() => templateId.value === props.item.id)

/** Acción abierta en esta plantilla: solo una a la vez. */
const editing = ref<'approve' | 'rename' | 'delete' | null>(null)
const seasonInput = ref('')
const nameInput = ref('')
const busy = ref(false)
const failed = ref(false)

/** Plantilla a la que sustituiría la aprobación para la temporada escrita, si es otra. */
const replaced = computed(() => {
  const id = assignments.value.find((a) => a.season === seasonInput.value)?.template
  if (!id || id === props.item.id) return null
  return library.value.find((t) => t.id === id)?.name ?? id
})

const day = (date: Date) => date.toLocaleDateString(locale.value)

function open(mode: 'approve' | 'rename' | 'delete', name = '') {
  editing.value = mode
  seasonInput.value = season.value ?? currentSeason(new Date())
  nameInput.value = name
  failed.value = false
}

/** Ejecuta una acción sobre la biblioteca y, si va bien, cierra el formulario abierto. */
async function run(action: () => Promise<void>) {
  busy.value = true
  failed.value = false
  try {
    await action()
    editing.value = null
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

const approve = () =>
  run(async () => {
    if (email.value && isSeason(seasonInput.value)) await approveTemplate(props.item.id, seasonInput.value, email.value)
  })
const rename = () =>
  run(async () => {
    const clean = cleanName(nameInput.value)
    if (clean) await renameTemplate(props.item.id, clean)
  })
const remove = () => run(() => deleteTemplate(props.item.id))
</script>
