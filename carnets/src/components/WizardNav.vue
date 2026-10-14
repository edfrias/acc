<template>
  <nav :aria-label="t('wizard.label')">
    <ol class="grid gap-2 sm:grid-cols-3">
      <li v-for="item in items" :key="item.step">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="step === item.step ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
          :aria-current="step === item.step ? 'step' : undefined"
          @click="step = item.step"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="step === item.step ? 'bg-blue-600 text-white' : item.done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
            aria-hidden="true"
          >
            <svg v-if="item.done && step !== item.step" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="m5 13 4 4L19 7" />
            </svg>
            <template v-else>{{ item.step }}</template>
          </span>
          <span class="min-w-0">
            <span class="block font-semibold text-slate-900">{{ item.title }}</span>
            <span class="block truncate text-xs" :class="item.warn ? 'text-amber-700' : 'text-slate-500'">{{ item.summary }}</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import type { WizardStep } from '../app/useCarnets'

const { t } = useI18n()
const { step, template, templateName, csv, result } = useCarnets()

const items = computed<{ step: WizardStep; title: string; summary: string; done: boolean; warn: boolean }[]>(() => {
  const r = result.value
  return [
    {
      step: 1,
      title: t('wizard.templates'),
      summary: template.value ? (templateName.value ?? t('wizard.templateChosen')) : t('wizard.noTemplate'),
      done: Boolean(template.value),
      warn: !template.value,
    },
    {
      step: 2,
      title: t('wizard.members'),
      summary: !csv.value
        ? t('wizard.noMembers')
        : r
          ? t('wizard.membersSummary', { valid: r.valid.length, rejected: r.rejected.length })
          : t('wizard.membersLoaded', { count: csv.value.rows.length }),
      done: Boolean(r && r.valid.length > 0),
      warn: Boolean(csv.value && (!r || r.rejected.length > 0)),
    },
    {
      step: 3,
      title: t('wizard.card'),
      summary: r && r.valid.length > 0 ? t('wizard.ready', { count: r.valid.length }) : t('wizard.cardHint'),
      done: false,
      warn: false,
    },
  ]
})
</script>
