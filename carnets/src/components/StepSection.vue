<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" :aria-labelledby="headingId">
    <h2 :id="headingId" class="mb-4 flex items-center gap-3 text-lg font-semibold text-slate-900">
      <span
        v-if="step"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
        aria-hidden="true"
        >{{ step }}</span
      >
      {{ title }}
    </h2>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ step?: number; title: string }>()

const headingId = useId()
</script>
