<template>
  <form class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm" @submit.prevent="publish">
    <p class="font-semibold text-slate-900">{{ t('publish.title') }}</p>
    <p class="mt-1 text-slate-600">{{ t('publish.help') }}</p>

    <div class="mt-3 flex flex-wrap items-end gap-3">
      <label class="flex min-w-48 flex-1 flex-col gap-1">
        <span class="font-medium text-slate-700">{{ t('publish.name') }}</span>
        <input
          v-model="name"
          type="text"
          :maxlength="NAME_MAX_LENGTH"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-invalid="!cleanName(name)"
        />
      </label>
      <SeasonField v-model="target" />
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!valid || busy"
      >
        {{ busy ? t('publish.publishing') : current ? t('publish.replace', { season: target }) : t('publish.publish', { season: target }) }}
      </button>
    </div>

    <p v-if="!isSeason(target)" class="mt-2 text-red-700">{{ t('publish.badSeason') }}</p>
    <p v-else-if="!cleanName(name)" class="mt-2 text-red-700">{{ t('publish.badName') }}</p>
    <p v-else-if="current" class="mt-2 text-amber-800">{{ t('publish.replaceWarning', { season: target, name: current }) }}</p>
    <p v-if="failed" class="mt-2 text-red-700" role="alert">{{ t('publish.failed') }}</p>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentSeason, isSeason, suggestedSeason } from '../app/season'
import { cleanName, NAME_MAX_LENGTH, nameFromFile } from '../app/templateLibrary'
import { useCarnets } from '../app/useCarnets'
import { useSession } from '../app/useSession'
import SeasonField from './SeasonField.vue'

const props = defineProps<{ fileName: string }>()

const { t } = useI18n()
const { library, assignments, publishTemplate } = useCarnets()
const { email } = useSession()

const name = ref(nameFromFile(props.fileName))
const target = ref(
  suggestedSeason(
    assignments.value.map((a) => a.season),
    currentSeason(new Date()),
  ),
)
const busy = ref(false)
const failed = ref(false)

const valid = computed(() => isSeason(target.value) && cleanName(name.value) !== null)
/** Nombre de la plantilla que tiene ahora la temporada elegida, si tiene. */
const current = computed(() => {
  const id = assignments.value.find((a) => a.season === target.value)?.template
  return id ? (library.value.find((t) => t.id === id)?.name ?? id) : null
})

async function publish() {
  const clean = cleanName(name.value)
  if (!clean || !isSeason(target.value) || !email.value) return
  busy.value = true
  failed.value = false
  try {
    await publishTemplate(clean, target.value, email.value)
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>
