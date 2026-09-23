<template>
  <div>
    <h3 class="mb-2 text-sm font-semibold" :class="tone === 'red' ? 'text-red-800' : 'text-amber-800'">{{ title }}</h3>
    <div class="overflow-x-auto rounded-lg border" :class="tone === 'red' ? 'border-red-200' : 'border-amber-200'">
      <table class="min-w-full text-left text-sm">
        <thead class="text-xs uppercase tracking-wide" :class="tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'">
          <tr>
            <th scope="col" class="px-3 py-2 font-semibold">{{ t('validation.row') }}</th>
            <th scope="col" class="px-3 py-2 font-semibold">{{ t('validation.issue') }}</th>
            <th v-if="showable" scope="col" class="px-3 py-2"><span class="sr-only">{{ t('validation.show') }}</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(issue, index) in issues" :key="index">
            <td class="px-3 py-1.5 align-top tabular-nums text-slate-500">{{ issue.rowNumber }}</td>
            <td class="px-3 py-1.5">{{ describeIssue(t, te, issue) }}</td>
            <td v-if="showable" class="px-3 py-1.5 text-right">
              <button
                type="button"
                class="rounded px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="emit('show', issue.rowNumber)"
              >
                {{ t('validation.show') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { describeIssue } from '../i18n'
import type { ValidationIssue } from '../pipeline'

defineProps<{ title: string; issues: ValidationIssue[]; tone: 'red' | 'amber'; showable?: boolean }>()
const emit = defineEmits<{ show: [rowNumber: number] }>()

const { t, te } = useI18n()
</script>
