<template>
  <section id="sobre-nosotros" class="py-16 lg:py-24 bg-white content-visibility-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div class="mb-12 lg:mb-0">
          <h2 class="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-6">
            {{ $t('about.title') }}
            <span class="block text-xl font-normal text-gray-600 mt-2">{{ $t('about.subtitle') }}</span>
          </h2>
          <p class="text-lg text-gray-600 mb-6 leading-relaxed">
            {{ $t('about.description1') }}
          </p>
          <p class="text-lg text-gray-600 mb-6 leading-relaxed">
            {{ $t('about.description2') }}
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div class="text-sm text-gray-600 font-medium">{{ $t('about.stats.members') }}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">26+</div>
              <div class="text-sm text-gray-600 font-medium">{{ $t('about.stats.years') }}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div class="text-sm text-gray-600 font-medium">{{ $t('about.stats.medals') }}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">16</div>
              <div class="text-sm text-gray-600 font-medium">{{ $t('about.stats.records') }}</div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">{{ $t('about.features.certified') }}</h2>
                <p class="text-gray-600">{{ $t('about.features.certifiedDescription') }}</p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">{{ $t('about.features.facilities') }}</h2>
                <p class="text-gray-600">{{ $t('about.features.facilitiesDescription') }}</p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">{{ $t('about.features.competition') }}</h2>
                <p class="text-gray-600">{{ $t('about.features.competitionDescription') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="aspect-w-4 aspect-h-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
            <img
              :src="logoAcc"
              :alt="$t('club.name') + ' Logo'"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const logoAcc = '/assets/images/logo_acc.jpg';
</script>
