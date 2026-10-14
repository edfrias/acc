<template>
  <StepSection :title="t('preview.title')">
    <CardCanvas :template="template" :card="card" :font-files="fontFiles" trim />

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p class="text-slate-600" aria-live="polite">
        <template v-if="cards.length > 0">
          {{ t('preview.position', { current: selected + 1, total: cards.length, row: card?.rowNumber }) }}
        </template>
        <template v-else>{{ t('preview.sample') }}</template>
      </p>
      <div v-if="cards.length > 0" class="flex gap-1">
        <button type="button" :class="buttonClass" :disabled="selected === 0" @click="selected--">
          {{ t('preview.previous') }}
        </button>
        <button type="button" :class="buttonClass" :disabled="selected >= cards.length - 1" @click="selected++">
          {{ t('preview.next') }}
        </button>
      </div>
    </div>
    <button
      v-if="cards.length > 1"
      type="button"
      class="mt-2 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @click="showWidest"
    >
      {{ t('preview.widest') }}
    </button>
  </StepSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sampleCard, widestCard } from '../app/cards'
import { useCarnets } from '../app/useCarnets'
import CardCanvas from './CardCanvas.vue'
import StepSection from './StepSection.vue'

const { t } = useI18n()
const { template, fontFiles, fonts, result, selected, staticValues } = useCarnets()

const cards = computed(() => result.value?.valid ?? [])
/** Sin socios cargados se enseña la plantilla con su texto de ejemplo. */
const card = computed(() => {
  if (cards.value.length > 0) return cards.value[selected.value]
  return template.value ? sampleCard(template.value, staticValues.value) : undefined
})

const buttonClass =
  'rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40'

function showWidest() {
  if (!template.value || !fonts.value) return
  const index = widestCard(cards.value, template.value, fonts.value, 'nombre')
  if (index >= 0) selected.value = index
}
</script>
