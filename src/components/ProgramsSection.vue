<template>
  <section id="programas" class="py-16 lg:py-24 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
          {{ $t('programs.title') }}
        </h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto">
          {{ $t('programs.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div class="p-6">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('programs.courses.beginner.title') }}</h2>
            <p class="text-gray-600 mb-4">
              {{ $t('programs.courses.beginner.description') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-2 mb-6">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.beginner.duration') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.beginner.equipment') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.beginner.certificate') }}
              </li>
            </ul>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-blue-600">€120</span>
              <button
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                :aria-label="$t('programs.courses.beginner.enrollAriaLabel')"
              >
                {{ $t('programs.cta.enroll') }}
              </button>
            </div>
          </div>
        </article>

        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div class="p-6">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-4">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('programs.courses.intermediate.title') }}</h2>
            <p class="text-gray-600 mb-4">
              {{ $t('programs.courses.intermediate.description') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-2 mb-6">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.intermediate.technique') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.intermediate.competition') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.intermediate.coaching') }}
              </li>
            </ul>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-blue-600">€200</span>
              <button
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                :aria-label="$t('programs.courses.intermediate.enrollAriaLabel')"
              >
                {{ $t('programs.cta.enroll') }}
              </button>
            </div>
          </div>
        </article>

        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div class="p-6">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a2 2 0 002-2V7a2 2 0 00-2-2H9m12 0h-1a2 2 0 00-2 2v1a2 2 0 002 2h1m0 0V9a2 2 0 00-2-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('programs.courses.youth.title') }}</h2>
            <p class="text-gray-600 mb-4">
              {{ $t('programs.courses.youth.description') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-2 mb-6">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.youth.ages') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.youth.safety') }}
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ $t('programs.courses.youth.fun') }}
              </li>
            </ul>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-blue-600">€80</span>
              <button
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                :aria-label="$t('programs.courses.youth.enrollAriaLabel')"
              >
                {{ $t('programs.cta.enroll') }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="text-center mt-12">
        <p class="text-lg text-gray-600 mb-6">
          {{ $t('programs.cta.notFound') }}
        </p>
        <button class="btn-secondary">
          {{ $t('programs.cta.custom') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
