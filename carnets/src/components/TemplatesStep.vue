<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
    <div class="min-w-0 space-y-6">
      <StepSection :step="1" :title="t('gallery.title')">
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
          <p class="mb-4 text-sm text-slate-600">{{ t('gallery.help') }}</p>

          <p v-if="justApproved" class="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
            {{ t('publish.done', justApproved) }}
          </p>
          <p
            v-if="origin?.kind === 'season' && assignment && !assigned"
            class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="alert"
          >
            {{ t('template.missing', { season: assignment.season }) }}
          </p>

          <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <!-- Plantilla cargada desde fichero: se prueba aquí antes de guardarla en la biblioteca -->
            <li
              v-if="origin?.kind === 'file' && template"
              class="flex flex-col rounded-lg border border-blue-500 bg-white p-3 text-sm shadow-sm ring-2 ring-blue-500"
            >
              <CardCanvas :template="template" :card="sample" :font-files="fontFiles" front-only />
              <p class="mt-3 font-medium break-words text-slate-900">{{ origin.name }}</p>
              <p class="mt-1 flex flex-wrap gap-1">
                <span class="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">{{ t('gallery.inUse') }}</span>
                <span class="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">{{ t('gallery.unsaved') }}</span>
              </p>
            </li>

            <TemplateCard v-for="item in library" :key="item.id" :item="item" />

            <li>
              <FileDrop class="h-full min-h-40" :label="t('gallery.add')" accept=".svg,image/svg+xml" @file="loadTemplateFile" />
            </li>
          </ul>

          <p v-if="library.length === 0 && !template" class="mt-4 text-sm text-slate-600">{{ t('template.none') }}</p>

          <div v-if="templateError" class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <p class="font-semibold">{{ t('template.invalid') }}</p>
            <p class="mt-1 font-mono text-xs">{{ templateError }}</p>
          </div>

          <PublishTemplate v-if="origin?.kind === 'file' && template" :key="origin.name" :file-name="origin.name" />
        </template>
      </StepSection>

      <SeasonHistory v-if="libraryStatus === 'ready' && assignments.length > 0" />
    </div>

    <aside class="self-start lg:sticky lg:top-6">
      <StepSection :title="t('gallery.current')">
        <template v-if="template">
          <div class="mb-3 text-sm">
            <p class="font-medium text-slate-900">{{ title }}</p>
            <p v-if="origin?.kind === 'season' && assignment?.assignedAt" class="text-slate-500">
              {{ t('template.approved', { email: assignment.assignedBy, date: day(assignment.assignedAt) }) }}
            </p>
            <p class="text-slate-500">{{ t('template.fields', { list: fieldList }) }}</p>
          </div>
          <CardCanvas :template="template" :card="sample" :font-files="fontFiles" trim />
        </template>
        <p v-else class="text-sm text-slate-500">{{ t('gallery.noneSelected') }}</p>
      </StepSection>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sampleCard } from '../app/cards'
import { useCarnets } from '../app/useCarnets'
import { fieldLabel } from '../i18n'
import CardCanvas from './CardCanvas.vue'
import FileDrop from './FileDrop.vue'
import PublishTemplate from './PublishTemplate.vue'
import SeasonHistory from './SeasonHistory.vue'
import StepSection from './StepSection.vue'
import TemplateCard from './TemplateCard.vue'

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
  fontFiles,
  staticValues,
  loadLibrary,
  loadTemplateFile,
} = useCarnets()

/** La plantilla en uso con su texto de ejemplo y los campos estáticos ya configurados (la temporada). */
const sample = computed(() => (template.value ? sampleCard(template.value, staticValues.value) : undefined))

const day = (date: Date) => date.toLocaleDateString(locale.value)
const fieldList = computed(() => template.value?.fields.map((f) => fieldLabel(t, te, f.name)).join(', ') ?? '')

const title = computed(() => {
  const from = origin.value
  if (from?.kind === 'file') return t('template.custom', { name: from.name })
  if (from?.kind === 'library') return t('template.fromLibrary', { name: from.name })
  return t('template.official', { season: season.value, name: assigned.value?.name ?? '' })
})
</script>
