<template>
  <label class="flex flex-col gap-1">
    <span class="font-medium text-slate-700">{{ t('publish.season') }}</span>
    <input
      v-model.trim="model"
      type="text"
      inputmode="numeric"
      placeholder="2026-27"
      class="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
      :aria-invalid="!isSeason(model)"
    />
  </label>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isSeason } from '../app/season'

/** Temporada a la que se aprueba una plantilla, en el formato "2026-27". */
const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
