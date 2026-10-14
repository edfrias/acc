<template>
  <StepSection :step="1" :title="t('template.title')">
    <p v-if="officialStatus === 'loading' || officialStatus === 'idle'" class="text-sm text-slate-500">{{ t('loading') }}</p>

    <div
      v-else-if="officialStatus === 'error'"
      class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      role="alert"
    >
      <p>{{ t('template.loadFailed') }}</p>
      <button
        type="button"
        class="rounded-md px-3 py-1.5 font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="loadOfficialTemplates()"
      >
        {{ t('template.retry') }}
      </button>
    </div>

    <template v-else>
      <p v-if="justPublished" class="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
        {{ t('publish.done', { season: justPublished }) }}
      </p>

      <label v-if="officialTemplates.length > 0" class="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-slate-700">{{ t('template.season') }}</span>
        <select
          :value="templateName === null ? season : ''"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="choose(($event.target as HTMLSelectElement).value)"
        >
          <option v-if="templateName !== null" value="" disabled>{{ t('template.fromFile') }}</option>
          <option v-for="official in officialTemplates" :key="official.season" :value="official.season">
            {{ official.season }}
          </option>
        </select>
      </label>
      <p v-else-if="!template" class="mb-4 text-sm text-slate-600">{{ t('template.none') }}</p>

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div v-if="template" class="text-sm">
          <p class="font-medium text-slate-900">
            {{ templateName ? t('template.custom', { name: templateName }) : t('template.official', { season }) }}
          </p>
          <p v-if="!templateName && current?.uploadedAt" class="text-slate-500">
            {{ t('template.uploaded', { email: current.uploadedBy, date: current.uploadedAt.toLocaleDateString(locale) }) }}
          </p>
          <p class="text-slate-500">{{ t('template.fields', { list: fieldList }) }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="templateName && officialTemplates.length > 0"
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="choose(season ?? officialTemplates[0]!.season)"
          >
            {{ t('template.restore') }}
          </button>
          <label
            class="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500"
          >
            {{ t('template.change') }}
            <input class="sr-only" type="file" accept=".svg,image/svg+xml" @change="onChange" />
          </label>
        </div>
      </div>

      <PublishTemplate v-if="templateName && template" />
    </template>

    <div v-if="templateError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
      <p class="font-semibold">{{ t('template.invalid') }}</p>
      <p class="mt-1 font-mono text-xs">{{ templateError }}</p>
    </div>
  </StepSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import { fieldLabel } from '../i18n'
import PublishTemplate from './PublishTemplate.vue'
import StepSection from './StepSection.vue'

const { t, te, locale } = useI18n()
const {
  officialTemplates,
  officialStatus,
  season,
  justPublished,
  template,
  templateName,
  templateError,
  loadOfficialTemplates,
  useOfficialTemplate,
  loadTemplateFile,
} = useCarnets()

const current = computed(() => officialTemplates.value.find((o) => o.season === season.value))
const fieldList = computed(() => template.value?.fields.map((f) => fieldLabel(t, te, f.name)).join(', ') ?? '')

function choose(chosen: string) {
  justPublished.value = null
  useOfficialTemplate(chosen)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    justPublished.value = null
    loadTemplateFile(file)
  }
  input.value = ''
}
</script>
