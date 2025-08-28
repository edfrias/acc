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
              <svg width="16" height="16" fill="currentColor" class="bi bi-whatsapp w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
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

const logoACC = '/assets/svg/logotipo-acc.svg';
const currentYear = computed(() => new Date().getFullYear());
const { t } = useI18n()
</script>
