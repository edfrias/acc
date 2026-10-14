<template>
  <div class="text-sm">
    <label class="flex flex-wrap items-center gap-2">
      <span class="font-medium text-slate-700">{{ t('cardSeason.label') }}</span>
      <input
        v-model.trim="cardSeason"
        type="text"
        inputmode="numeric"
        placeholder="2026-27"
        class="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
        :aria-invalid="!valid"
      />
    </label>
    <p v-if="!valid" class="mt-1 text-red-700">{{ t('publish.badSeason') }}</p>
    <p v-else-if="printed" class="mt-1 text-xs text-slate-500">{{ t('cardSeason.printed', { list: printed }) }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isSeason, SEASON_FIELDS } from '../app/season'
import { useCarnets } from '../app/useCarnets'

const { t } = useI18n()
const { cardSeason, staticValues, template } = useCarnets()

const valid = computed(() => isSeason(cardSeason.value))
/** Cómo sale la temporada en esta plantilla: "2027-2028 · 27-28". */
const printed = computed(() => {
  const used = new Set(template.value?.fields.map((f) => f.name))
  return Object.keys(SEASON_FIELDS)
    .filter((name) => used.has(name))
    .map((name) => staticValues.value[name])
    .join(' · ')
})
</script>
