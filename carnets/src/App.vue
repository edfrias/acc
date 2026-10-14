<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Misma cabecera que la web del club (NavBar.vue), para que no parezcan dos webs distintas -->
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <h1 class="flex min-w-0 items-center gap-2">
          <img :src="logo" alt="" class="h-8 w-8 shrink-0 rounded-lg object-cover" />
          <span class="min-w-0">
            <span class="font-display text-base font-bold text-gray-900 sm:text-xl">{{ t('app.club') }}</span>
            <span class="block font-display text-sm font-semibold text-gray-600 sm:ml-2 sm:inline">{{ t('app.title') }}</span>
          </span>
        </h1>
        <div class="flex items-center gap-3">
          <div v-if="status === 'signed-in'" class="flex items-center gap-2 text-sm">
            <span class="hidden text-gray-600 md:inline">{{ email }}</span>
            <button
              type="button"
              class="rounded-md px-2 py-1 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :title="email ?? undefined"
              @click="signOut"
            >
              {{ t('auth.signOut') }}
            </button>
          </div>
          <LanguageSelect />
        </div>
      </div>
    </header>

    <SignIn v-if="status !== 'signed-in'" />

    <template v-else>
      <p class="mx-auto flex max-w-7xl items-start gap-2 px-4 pt-4 sm:px-6 lg:px-8 text-sm text-slate-600">
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

      <main class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from './app/useCarnets'
import { useSession } from './app/useSession'
import logo from './assets/logotipo-acc.svg'
import CardPreview from './components/CardPreview.vue'
import CsvStep from './components/CsvStep.vue'
import DownloadStep from './components/DownloadStep.vue'
import LanguageSelect from './components/LanguageSelect.vue'
import MappingStep from './components/MappingStep.vue'
import SignIn from './components/SignIn.vue'
import TemplateStep from './components/TemplateStep.vue'
import ValidationStep from './components/ValidationStep.vue'

const { t } = useI18n()
const { status, email, signOut } = useSession()

// Las plantillas solo se pueden leer con la sesión iniciada (firestore.rules)
let initialized = false
watch(
  status,
  (value) => {
    if (value !== 'signed-in' || initialized) return
    initialized = true
    void useCarnets().init()
  },
  { immediate: true },
)
</script>
