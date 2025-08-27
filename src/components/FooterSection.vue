<template>
  <footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="col-span-1 lg:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <img
              :src="logoACC"
              :alt="t('club.name') + ' Logo'"
              class="w-8 h-8 rounded-lg object-cover"
            />
            <span class="font-display font-bold text-xl">{{ t('club.name') }}</span>
          </div>
          <p class="text-gray-300 mb-6 max-w-md">
            {{ t('footer.description') }}
          </p>
        </div>

        <div>
          <h2 class="font-semibold text-lg mb-4">{{ t('footer.contact') }}</h2>
          <ul class="space-y-3">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-gray-300 text-sm">
                {{ t('club.fullName') }}<br>
                {{ t('club.location') }}
              </span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <div class="text-gray-300 text-sm" style="display: flex; flex-direction: column; gap: 16px;">
                <a
                  :href="'mailto:' + getRawTranslation('club.emails.secretaria')"
                  class="email-link text-gray-300 hover:text-white underline block"
                  :aria-label="t('contact.info.email') + ': ' + getRawTranslation('club.emails.secretaria')"
                >
                  {{ getRawTranslation('club.emails.secretaria') }}
                </a>
                <a
                  :href="'mailto:' + getRawTranslation('club.emails.junta')"
                  class="email-link text-gray-300 hover:text-white underline block"
                  :aria-label="t('contact.info.email') + ': ' + getRawTranslation('club.emails.junta')"
                >
                  {{ getRawTranslation('club.emails.junta') }}
                </a>
              </div>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8c0-1.104-.896-2-2-2H9C7.896 6 7 6.896 7 8v8c0 1.104.896 2 2 2h6c1.104 0 2-.896 2-2V8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <div class="text-gray-300 text-sm">
                <div class="mb-1">{{ t('contact.info.whatsapp') }}</div>
                <div class="font-semibold">+34 606 75 06 39</div>
                <div class="font-semibold">+34 666 94 18 45</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-12 pt-8">
        <div class="text-center">
          <p class="text-white text-sm">
            &copy; {{ currentYear }} {{ t('club.name') }}. {{ t('footer.rights') }}.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getRawTranslation } from '../i18n';
import { useI18n } from 'vue-i18n';

const logoACC = '/assets/images/logo_acc.jpg';
const currentYear = computed(() => new Date().getFullYear());
const { t } = useI18n()
</script>
