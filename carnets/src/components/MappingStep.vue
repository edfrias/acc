<template>
  <StepSection :step="3" :title="t('mapping.title')">
    <p class="mb-4 text-sm text-slate-600">{{ t('mapping.help') }}</p>
    <div class="grid gap-4 sm:grid-cols-2">
      <label v-for="field in csvFields" :key="field.name" class="block text-sm">
        <span class="mb-1 block font-medium text-slate-700">{{ fieldLabel(t, te, field.name) }}</span>
        <select
          v-model="mapping[field.name]"
          :disabled="!csv"
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option :value="undefined" disabled>{{ t('mapping.choose') }}</option>
          <option v-for="header in csv?.headers ?? []" :key="header" :value="header">{{ header }}</option>
        </select>
      </label>

      <label v-for="field in staticFields" :key="field.name" class="block text-sm">
        <span class="mb-1 block font-medium text-slate-700">{{ fieldLabel(t, te, field.name) }}</span>
        <input
          v-model="staticValues[field.name]"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span v-if="field.name === 'temporada'" class="mt-1 block text-xs text-slate-500">{{ t('mapping.seasonHelp') }}</span>
      </label>
    </div>
  </StepSection>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import { fieldLabel } from '../i18n'
import StepSection from './StepSection.vue'

const { t, te } = useI18n()
const { csv, csvFields, staticFields, mapping, staticValues } = useCarnets()
</script>
