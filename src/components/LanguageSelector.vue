<template>
  <div class="relative">
    <!-- Botón selector de idioma -->
    <button
      ref="languageSelectorButton"
      @click="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="focusNext"
      @keydown.arrow-up.prevent="focusPrevious"
      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :aria-label="$t('accessibility.languageSelector')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      id="language-selector-button"
    >
      <span class="text-lg" role="img" :aria-label="`${currentLanguage.name} flag`">
        {{ currentLanguage.flag }}
      </span>
      <span class="hidden sm:block">{{ currentLanguage.name }}</span>
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- Dropdown de idiomas -->
    <div
      v-if="isOpen"
      ref="languageDropdown"
      class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
      role="menu"
      aria-labelledby="language-selector-button"
    >
      <div
        v-for="language in availableLocales"
        :key="language.code"
        ref="languageOptions"
      >
        <button
          @click="changeLanguage(language.code)"
          @keydown.escape="closeDropdown"
          @keydown.arrow-down.prevent="focusNext"
          @keydown.arrow-up.prevent="focusPrevious"
          @keydown.enter.prevent="changeLanguage(language.code)"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:bg-blue-50 focus:text-blue-600 flex items-center space-x-3"
          :class="{
            'bg-blue-50 text-blue-600 font-medium': currentLocale === language.code
          }"
          role="menuitem"
          :tabindex="isOpen ? 0 : -1"
          :aria-label="`${$t('accessibility.changeLanguageTo')} ${language.name}`"
        >
          <span class="text-lg" role="img" :aria-label="`${language.name} flag`">
            {{ language.flag }}
          </span>
          <span>{{ language.name }}</span>
          <svg
            v-if="currentLocale === language.code"
            class="w-4 h-4 ml-auto text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Overlay para cerrar dropdown -->
    <div
      v-if="isOpen"
      @click="closeDropdown"
      class="fixed inset-0 z-40"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, getCurrentLocale, availableLocales } from '../i18n'

// Composables
const { } = useI18n()

// Estado reactivo
const isOpen = ref(false)
const languageSelectorButton = ref<HTMLButtonElement>()
const languageDropdown = ref<HTMLDivElement>()
const languageOptions = ref<HTMLButtonElement[]>([])
const currentFocusIndex = ref(-1)

// Computed
const currentLocale = computed(() => getCurrentLocale())
const currentLanguage = computed(() => {
  return availableLocales.find(lang => lang.code === currentLocale.value) || availableLocales[0]
})

// Métodos
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      currentFocusIndex.value = availableLocales.findIndex(lang => lang.code === currentLocale.value)
      if (currentFocusIndex.value !== -1) {
        languageOptions.value[currentFocusIndex.value]?.focus()
      }
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
  currentFocusIndex.value = -1
  languageSelectorButton.value?.focus()
}

const changeLanguage = (languageCode: string) => {
  setLocale(languageCode)
  closeDropdown()

  // Anunciar el cambio para lectores de pantalla
  announceLanguageChange(languageCode)
}

const focusNext = () => {
  if (!isOpen.value) return

  currentFocusIndex.value = (currentFocusIndex.value + 1) % availableLocales.length
  languageOptions.value[currentFocusIndex.value]?.focus()
}

const focusPrevious = () => {
  if (!isOpen.value) return

  currentFocusIndex.value = currentFocusIndex.value <= 0
    ? availableLocales.length - 1
    : currentFocusIndex.value - 1
  languageOptions.value[currentFocusIndex.value]?.focus()
}

const announceLanguageChange = (languageCode: string) => {
  const language = availableLocales.find(lang => lang.code === languageCode)
  if (language) {
    // Crear anuncio para lectores de pantalla
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Language changed to ${language.name}`

    document.body.appendChild(announcement)

    // Remover el anuncio después de un momento
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (languageDropdown.value && !languageDropdown.value.contains(target) &&
      languageSelectorButton.value && !languageSelectorButton.value.contains(target)) {
    closeDropdown()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Clases utilitarias para accesibilidad */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
