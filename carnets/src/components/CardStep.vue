<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
    <div class="min-w-0 space-y-6">
      <StepSection :step="3" :title="t('card.title')">
        <div v-if="!template" class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{{ t('card.needTemplate') }}</p>
          <button type="button" :class="linkButton" @click="step = 1">{{ t('members.goTemplates') }}</button>
        </div>

        <template v-else>
          <div
            v-if="!result"
            class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <p>{{ csv ? t('card.needColumns') : t('card.needMembers') }}</p>
            <button type="button" :class="linkButton" @click="step = 2">{{ t('card.goMembers') }}</button>
          </div>

          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div v-for="field in csvFields" :key="field.name">
              <dt class="mb-1 font-medium text-slate-700">{{ fieldLabel(t, te, field.name) }}</dt>
              <dd class="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-600">
                <span>{{ mapping[field.name] ? t('card.fromColumn', { column: mapping[field.name] }) : t('card.noColumn') }}</span>
                <button type="button" class="text-xs font-medium text-blue-700 underline hover:text-blue-900" @click="step = 2">
                  {{ t('card.change') }}
                </button>
              </dd>
            </div>
            <div v-for="field in staticFields" :key="field.name">
              <dt class="mb-1 font-medium text-slate-700">
                <label :for="`static-${field.name}`">{{ fieldLabel(t, te, field.name) }}</label>
              </dt>
              <dd>
                <input
                  :id="`static-${field.name}`"
                  v-model="staticValues[field.name]"
                  type="text"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span v-if="field.name === 'temporada'" class="mt-1 block text-xs text-slate-500">{{ t('mapping.seasonHelp') }}</span>
              </dd>
            </div>
          </dl>

          <p v-if="result" class="mt-4 text-sm text-slate-600">
            {{ t('card.summary', { valid: result.valid.length, rejected: result.rejected.length }) }}
            <button
              v-if="result.rejected.length > 0 || result.warnings.length > 0"
              type="button"
              class="font-medium text-blue-700 underline hover:text-blue-900"
              @click="step = 2"
            >
              {{ t('card.review') }}
            </button>
          </p>
        </template>
      </StepSection>

      <DownloadStep v-if="template" />
    </div>

    <aside class="self-start lg:sticky lg:top-6">
      <CardPreview />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import { fieldLabel } from '../i18n'
import CardPreview from './CardPreview.vue'
import DownloadStep from './DownloadStep.vue'
import StepSection from './StepSection.vue'

const { t, te } = useI18n()
const { step, template, csv, csvFields, staticFields, mapping, staticValues, result } = useCarnets()

const linkButton =
  'rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
</script>
