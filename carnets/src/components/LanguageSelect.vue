<template>
  <label class="flex items-center gap-2 text-sm">
    <span class="sr-only">{{ t('language.label') }}</span>
    <svg class="hidden h-4 w-4 text-gray-500 sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
      />
    </svg>
    <select
      :value="locale"
      class="rounded-md border border-gray-300 bg-white px-2 py-1 font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @change="setLocale(($event.target as HTMLSelectElement).value as Locale)"
    >
      <option v-for="language in availableLocales" :key="language.code" :value="language.code">
        {{ language.name }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { availableLocales, setLocale } from '../i18n'
import type { Locale } from '../i18n'

const { t, locale } = useI18n()
</script>
