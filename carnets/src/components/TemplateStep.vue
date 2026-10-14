<template>
  <StepSection :step="1" :title="t('template.title')">
    <p v-if="libraryStatus === 'loading' || libraryStatus === 'idle'" class="text-sm text-slate-500">{{ t('loading') }}</p>

    <div
      v-else-if="libraryStatus === 'error'"
      class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      role="alert"
    >
      <p>{{ t('template.loadFailed') }}</p>
      <button
        type="button"
        class="rounded-md px-3 py-1.5 font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="loadLibrary()"
      >
        {{ t('template.retry') }}
      </button>
    </div>

    <template v-else>
      <p v-if="justApproved" class="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
        {{ t('publish.done', justApproved) }}
      </p>

      <label v-if="assignments.length > 0" class="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-slate-700">{{ t('template.season') }}</span>
        <select
          :value="origin?.kind === 'season' || !template ? season : ''"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="choose(($event.target as HTMLSelectElement).value)"
        >
          <option v-if="origin && origin.kind !== 'season'" value="" disabled>{{ t('template.notSeason') }}</option>
          <option v-for="a in assignments" :key="a.season" :value="a.season">{{ a.season }}</option>
        </select>
      </label>
      <p v-else-if="!template" class="mb-4 text-sm text-slate-600">{{ t('template.none') }}</p>

      <p
        v-if="origin?.kind !== 'file' && origin?.kind !== 'library' && assignment && !assigned"
        class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        role="alert"
      >
        {{ t('template.missing', { season: assignment.season }) }}
      </p>

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div v-if="template" class="text-sm">
          <p class="font-medium text-slate-900">{{ title }}</p>
          <p v-if="origin?.kind === 'season' && assignment?.assignedAt" class="text-slate-500">
            {{ t('template.approved', { email: assignment.assignedBy, date: day(assignment.assignedAt) }) }}
          </p>
          <p class="text-slate-500">{{ t('template.fields', { list: fieldList }) }}</p>
          <p v-if="template.sides === 2" class="text-slate-500">{{ t('template.duplex') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="origin && origin.kind !== 'season' && assignments.length > 0"
            type="button"
            :class="linkButton"
            @click="choose(season ?? assignments[0]!.season)"
          >
            {{ t('template.restore') }}
          </button>
          <label :class="[outlineButton, 'cursor-pointer focus-within:ring-2 focus-within:ring-blue-500']">
            {{ t('template.change') }}
            <input class="sr-only" type="file" accept=".svg,image/svg+xml" @change="onChange" />
          </label>
          <button v-if="library.length > 0" type="button" :class="outlineButton" :aria-expanded="managing" @click="managing = !managing">
            {{ managing ? t('library.close') : t('library.open') }}
          </button>
        </div>
      </div>

      <PublishTemplate v-if="origin?.kind === 'file' && template" :file-name="origin.name" />
      <TemplateLibrary v-if="managing" class="mt-4" />
    </template>

    <div v-if="templateError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
      <p class="font-semibold">{{ t('template.invalid') }}</p>
      <p class="mt-1 font-mono text-xs">{{ templateError }}</p>
    </div>
  </StepSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import { fieldLabel } from '../i18n'
import PublishTemplate from './PublishTemplate.vue'
import StepSection from './StepSection.vue'
import TemplateLibrary from './TemplateLibrary.vue'

const { t, te, locale } = useI18n()
const {
  library,
  assignments,
  libraryStatus,
  season,
  assignment,
  assigned,
  justApproved,
  template,
  origin,
  templateError,
  loadLibrary,
  useSeason,
  loadTemplateFile,
} = useCarnets()

const managing = ref(false)

const outlineButton =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
const linkButton =
  'rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'

const day = (date: Date) => date.toLocaleDateString(locale.value)
const fieldList = computed(() => template.value?.fields.map((f) => fieldLabel(t, te, f.name)).join(', ') ?? '')

const title = computed(() => {
  const from = origin.value
  if (from?.kind === 'file') return t('template.custom', { name: from.name })
  if (from?.kind === 'library') return t('template.fromLibrary', { name: from.name })
  return t('template.official', { season: season.value, name: assigned.value?.name ?? '' })
})

function choose(chosen: string) {
  useSeason(chosen)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadTemplateFile(file)
  input.value = ''
}
</script>
