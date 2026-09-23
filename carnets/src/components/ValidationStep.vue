<template>
  <StepSection :step="4" :title="t('validation.title')">
    <p v-if="!result" class="text-sm text-slate-500">{{ t('validation.waiting') }}</p>

    <template v-else>
      <dl class="grid grid-cols-3 gap-3 text-center" aria-live="polite">
        <div class="rounded-lg bg-green-50 p-3">
          <dt class="text-xs font-medium text-green-800">{{ t('validation.valid') }}</dt>
          <dd class="text-2xl font-bold tabular-nums text-green-700">{{ result.valid.length }}</dd>
        </div>
        <div class="rounded-lg bg-amber-50 p-3">
          <dt class="text-xs font-medium text-amber-800">{{ t('validation.warnings') }}</dt>
          <dd class="text-2xl font-bold tabular-nums text-amber-700">{{ warnedRows }}</dd>
        </div>
        <div class="rounded-lg bg-red-50 p-3">
          <dt class="text-xs font-medium text-red-800">{{ t('validation.rejected') }}</dt>
          <dd class="text-2xl font-bold tabular-nums text-red-700">{{ result.rejected.length }}</dd>
        </div>
      </dl>

      <p v-if="result.rejected.length === 0 && result.warnings.length === 0" class="mt-4 text-sm text-green-700">
        {{ t('validation.allGood') }}
      </p>

      <IssueTable
        v-if="rejectedIssues.length > 0"
        class="mt-5"
        tone="red"
        :title="t('validation.rejectedTitle')"
        :issues="rejectedIssues"
      />
      <IssueTable
        v-if="result.warnings.length > 0"
        class="mt-5"
        tone="amber"
        :title="t('validation.warningsTitle')"
        :issues="result.warnings"
        showable
        @show="show"
      />
    </template>
  </StepSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCarnets } from '../app/useCarnets'
import IssueTable from './IssueTable.vue'
import StepSection from './StepSection.vue'

const { t } = useI18n()
const { result, selected } = useCarnets()

const rejectedIssues = computed(() => result.value?.rejected.flatMap((r) => r.reasons) ?? [])
/** Carnets con algún aviso (un carnet puede tener varios). */
const warnedRows = computed(() => new Set(result.value?.warnings.map((w) => w.rowNumber)).size)

function show(rowNumber: number) {
  const index = result.value?.valid.findIndex((card) => card.rowNumber === rowNumber) ?? -1
  if (index >= 0) selected.value = index
}
</script>
