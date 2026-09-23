<template>
  <label
    class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
    :class="dragging ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-slate-50'"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      />
    </svg>
    <span class="font-medium">{{ label }}</span>
    <input class="sr-only" type="file" :accept="accept" @change="onChange" />
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ label: string; accept: string }>()
const emit = defineEmits<{ file: [file: File] }>()

const dragging = ref(false)

function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) emit('file', file)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('file', file)
  // Permite volver a elegir el mismo fichero después de corregirlo.
  input.value = ''
}
</script>
