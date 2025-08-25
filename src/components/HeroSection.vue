<template>
  <section class="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 min-h-screen flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-20"></div>
    <div
      class="absolute inset-0 bg-repeat"
      style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
    ></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-10 rounded-full mb-6 p-2">
            <img
              :src="logoACC"
              :alt="$t('club.name') + ' Logo'"
              class="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
          {{ $t('hero.title') }}
          <span class="block text-yellow-500">{{ $t('hero.subtitle') }}</span>
        </h1>

        <p class="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
          {{ $t('hero.description') }}
        </p>

        <p class="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
          {{ $t('hero.detailedDescription') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 8h.01"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ $t('hero.features.courses.title') }}</h2>
            <p class="text-white/80">{{ $t('hero.features.courses.description') }}</p>
          </div>

          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ $t('hero.features.location.title') }}</h2>
            <p class="text-white/80">{{ $t('hero.features.location.description') }}</p>
          </div>

          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ $t('hero.features.community.title') }}</h2>
            <p class="text-white/80">{{ $t('hero.features.community.description') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
      <button
        @click="scrollToSection('sobre-nosotros')"
        class="animate-bounce text-white hover:text-yellow-500 transition-colors duration-200"
        :aria-label="$t('accessibility.scrollDown')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
const logoACC = '/assets/images/logo_acc.jpg';

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>
