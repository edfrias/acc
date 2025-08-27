<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex-shrink-0">
          <a
            href="#"
            class="flex items-center space-x-2"
            :aria-label="t('nav.home')"
          >
            <img
              :src="logoACC"
              :alt="t('club.name') + ' Logo'"
              class="w-8 h-8 rounded-lg object-cover"
            />
            <span class="font-display font-bold text-xl text-gray-900">
              <span class="sr-only">{{ t('nav.clubName') }} - </span>{{ t('nav.clubName') }}
              <span class="hidden lg:inline ml-1 text-sm font-normal text-gray-600">{{ t('nav.clubTagline') }}</span>
            </span>
          </a>
        </div>

        <div class="hidden md:block">
          <div class="ml-10 flex items-center space-x-8">
            <a
              href="#sobre-nosotros"
              @click="scrollToSection('sobre-nosotros')"
              class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              {{ t('nav.about') }}
            </a>
            <a
              href="#programas"
              @click="scrollToSection('programas')"
              class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              {{ t('nav.programs') }}
            </a>
            <a
              href="#inscripcion"
              @click="scrollToSection('inscripcion')"
              class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              {{ t('nav.contact') }}
            </a>

            <LanguageSelector />
          </div>
        </div>

        <div class="md:hidden">
          <button
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-expanded="false"
            :aria-label="t('accessibility.openMenu')"
          >
            <svg
              v-if="!isMobileMenuOpen"
              class="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              v-else
              class="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white border-t border-gray-200"
    >
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <a
          href="#sobre-nosotros"
          @click="handleMobileMenuClick('sobre-nosotros')"
          class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
        >
          {{ t('nav.about') }}
        </a>
        <a
          href="#programas"
          @click="handleMobileMenuClick('programas')"
          class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
        >
          {{ t('nav.programs') }}
        </a>
        <a
          href="#inscripcion"
          @click="handleMobileMenuClick('inscripcion')"
          class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
        >
          {{ t('nav.contact') }}
        </a>

        <div class="px-3 py-2">
          <LanguageSelector />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LanguageSelector from './LanguageSelector.vue'
import { useI18n } from 'vue-i18n';

const logoACC = '/assets/images/logo_acc.jpg';
const isMobileMenuOpen = ref(false);
const { t } = useI18n()

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const handleMobileMenuClick = (sectionId: string) => {
  scrollToSection(sectionId);
  isMobileMenuOpen.value = false;
};
</script>
