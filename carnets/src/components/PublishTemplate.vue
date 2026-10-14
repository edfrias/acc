<template>
  <form class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm" @submit.prevent="publish">
    <p class="font-semibold text-slate-900">{{ t('publish.title') }}</p>
    <p class="mt-1 text-slate-600">{{ t('publish.help') }}</p>

    <div class="mt-3 flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1">
        <span class="font-medium text-slate-700">{{ t('publish.season') }}</span>
        <input
          v-model.trim="target"
          type="text"
          inputmode="numeric"
          placeholder="2026-27"
          class="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-invalid="!valid"
        />
      </label>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!valid || busy"
      >
        {{ busy ? t('publish.publishing') : exists ? t('publish.replace', { season: target }) : t('publish.publish', { season: target }) }}
      </button>
    </div>

    <p v-if="!valid" class="mt-2 text-red-700">{{ t('publish.badSeason') }}</p>
    <p v-else-if="exists" class="mt-2 text-amber-800">{{ t('publish.replaceWarning', { season: target }) }}</p>
    <p v-if="failed" class="mt-2 text-red-700" role="alert">{{ t('publish.failed') }}</p>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentSeason, isSeason, suggestedSeason } from '../app/season'
import { useCarnets } from '../app/useCarnets'
import { useSession } from '../app/useSession'

const { t } = useI18n()
const { officialTemplates, publishTemplate } = useCarnets()
const { email } = useSession()

const target = ref(
  suggestedSeason(
    officialTemplates.value.map((o) => o.season),
    currentSeason(new Date()),
  ),
)
const busy = ref(false)
const failed = ref(false)

const valid = computed(() => isSeason(target.value))
const exists = computed(() => officialTemplates.value.some((o) => o.season === target.value))

async function publish() {
  if (!valid.value || !email.value) return
  busy.value = true
  failed.value = false
  try {
    await publishTemplate(target.value, email.value)
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>
