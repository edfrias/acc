<template>
  <img
    v-if="flagSrc"
    :src="flagSrc"
    :alt="getAriaLabel(country)"
    class="w-full h-full object-cover"
    loading="lazy"
  />

  <!-- Fallback para códigos no reconocidos -->
  <div
    v-else
    class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium rounded"
  >
    {{ country.toUpperCase() }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  country: string
}

const props = defineProps<Props>()

const flagSrc = computed(() => {
  const flagMap: { [key: string]: string } = {
    'es': '/assets/svg/spain_flag.svg',
    'ca': '/assets/svg/catalan_flag.svg',
    'en': '/assets/svg/uk_flag.svg'
  }
  return flagMap[props.country] || null
})

const getAriaLabel = (countryCode: string): string => {
  const labels: { [key: string]: string } = {
    'es': 'Bandera de España',
    'ca': 'Bandera de Catalunya',
    'en': 'Bandera del Reino Unido'
  }
  return labels[countryCode] || `Bandera de ${countryCode}`
}
</script>

<style scoped>
img {
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

div {
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>