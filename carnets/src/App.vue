<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b-4 border-yellow-400 bg-blue-600 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p class="text-sm text-blue-100">{{ t('app.club') }}</p>
          <h1 class="text-xl font-bold sm:text-2xl">{{ t('app.title') }}</h1>
        </div>
        <LanguageSelect />
      </div>
    </header>

    <p class="mx-auto flex max-w-6xl items-start gap-2 px-4 pt-4 text-sm text-slate-600">
      <svg class="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4"
        />
      </svg>
      {{ t('app.privacy') }}
    </p>

    <main class="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div class="min-w-0 space-y-6">
        <TemplateStep />
        <CsvStep />
        <MappingStep />
        <ValidationStep />
      </div>
      <aside class="space-y-6 self-start lg:sticky lg:top-6">
        <CardPreview />
        <DownloadStep />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from './app/useCarnets'
import CardPreview from './components/CardPreview.vue'
import CsvStep from './components/CsvStep.vue'
import DownloadStep from './components/DownloadStep.vue'
import LanguageSelect from './components/LanguageSelect.vue'
import MappingStep from './components/MappingStep.vue'
import TemplateStep from './components/TemplateStep.vue'
import ValidationStep from './components/ValidationStep.vue'

const { t } = useI18n()

onMounted(() => useCarnets().init())
</script>
