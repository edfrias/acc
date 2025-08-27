<template>
  <section id="programas" class="py-16 lg:py-24 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
          {{ t('programs.title') }}
        </h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto">
          {{ t('programs.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div class="p-6">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ t('programs.courses.beginner.title') }}</h2>
            <p class="text-gray-600 mb-4">
              {{ t('programs.courses.beginner.description') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-2 mb-6">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.beginner.duration') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.beginner.modalities') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.beginner.includes') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.beginner.certificate') }}
              </li>
            </ul>
            <div class="flex items-center justify-end">
              <span class="text-2xl font-bold text-blue-600">200€</span>
            </div>
          </div>
        </article>
        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div class="p-6">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg class="text-green-600" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                <path d="M480-40q-23 0-46-3t-46-8Q300 14 194.5-4.5T33-117q-45-74-29-159t77-143v-3Q19-479 4-562.5T32-720q37-63 102-95.5T271-838q32-57 87.5-89.5T480-960q66 0 121.5 32.5T689-838q72-10 137 22.5T928-720q43 74 28 157.5T879-422v3q61 58 77 143t-29 159Q871-23 765.5-4.5T572-51q-23 5-46 8t-46 3ZM288-90q-32-18-61-41.5T174-183q-24-28-42.5-60.5T101-311q-20 36-20 76.5t21 75.5q29 48 81.5 68.5T288-90Zm384 0q52 20 104.5-.5T858-159q21-35 21-75.5T859-311q-12 35-30.5 67.5T786-183q-24 28-52.5 51.5T672-90Zm-192-30q134 0 227-93t93-227q0-29-4.5-55.5T782-547q-29 20-64 31t-73 11q-102 0-173.5-71.5T400-750q-104 26-172 112t-68 198q0 134 93 227t227 93ZM360-350q-21 0-35.5-14.5T310-400q0-21 14.5-35.5T360-450q21 0 35.5 14.5T410-400q0 21-14.5 35.5T360-350Zm240 0q-21 0-35.5-14.5T550-400q0-21 14.5-35.5T600-450q21 0 35.5 14.5T650-400q0 21-14.5 35.5T600-350ZM94-544q9-33 23-63.5t33-57.5q19-27 41.5-51t48.5-44q-43 0-79.5 21T102-681q-20 32-22 67t14 70Zm772 0q16-35 14-70t-22-67q-22-37-58.5-58T720-760q26 20 48.5 44t41.5 51q19 27 33 57.5t23 63.5Zm-221-41q29 0 54-9t46-25q-21-32-50-57.5T632-721q-34-19-72-29t-80-10v10q0 69 48 117t117 48Zm-54-239q-20-26-49-41t-62-15q-33 0-62 15t-49 41q26-8 54-12t57-4q29 0 57 4t54 12ZM150-665Zm660 0Zm-330-85Zm0-90ZM174-183Zm612 0Z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ t('programs.courses.junior.title') }}</h2>
            <p class="text-gray-600 mb-4">
              {{ t('programs.courses.junior.description') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-2 mb-6">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.junior.ages') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.junior.duration') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.junior.includes') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ t('programs.courses.junior.certificate') }}
              </li>
            </ul>
            <div class="flex items-center justify-end">
              <span class="text-2xl font-bold text-blue-600">150€</span>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-16 bg-blue-50 rounded-xl p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ t('programs.freeClass.title') }}</h3>
        <p class="text-lg text-gray-800 mb-6 max-w-2xl mx-auto">
          {{ t('programs.freeClass.description') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
</script>
