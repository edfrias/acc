<template>
  <StepSection :step="1" :title="t('template.title')">
    <div v-if="template" class="flex flex-wrap items-start justify-between gap-3">
      <div class="text-sm">
        <p class="font-medium text-slate-900">
          {{ templateName ? t('template.custom', { name: templateName }) : t('template.official') }}
        </p>
        <p class="text-slate-500">{{ t('template.fields', { list: fieldList }) }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="templateName"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="useOfficialTemplate"
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
import StepSection from './StepSection.vue'

const { t, te } = useI18n()
const { template, templateName, templateError, useOfficialTemplate, loadTemplateFile } = useCarnets()

const fieldList = computed(() => template.value?.fields.map((f) => fieldLabel(t, te, f.name)).join(', ') ?? '')

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadTemplateFile(file)
  input.value = ''
}
</script>
