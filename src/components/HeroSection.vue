<template>
  <section class="hero-section relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 min-h-screen flex items-center justify-center">
    <div class="hero-overlay absolute inset-0 bg-black opacity-20"></div>
    <div
      class="absolute inset-0 bg-repeat transition-opacity duration-500"
      :class="{ 'opacity-100': showPattern, 'opacity-0': !showPattern }"
      style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
    ></div>

    <div class="hero-content relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="max-w-4xl mx-auto mt-16 md-h-750:mt-0 lg-h-750:mt-0">
        <h1 class="hero-title text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
          {{ t('hero.title') }}
          <span class="hero-subtitle block text-yellow-500">{{ t('hero.subtitle') }}</span>
        </h1>

        <p class="hero-description text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
          {{ t('hero.description') }}
        </p>

        <p class="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
          {{ t('hero.detailedDescription') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16" :class="{ 'opacity-90': !showFeatures }">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 8h.01"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ t('hero.features.courses.title') }}</h2>
            <p class="text-white/80">{{ t('hero.features.courses.description') }}</p>
          </div>

          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ t('hero.features.location.title') }}</h2>
            <p class="text-white/80">{{ t('hero.features.location.description') }}</p>
          </div>

          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mb-4">
              <svg class="text-gray-900" width="24" height="24" fill="#1f1f1f" viewBox="0 -960 960 960">
                <path d="M350-63q-46 0-82.5-24T211-153q-16 21-40.5 32.5T120-109q-51 0-85.5-35T0-229q0-43 28-77.5T99-346q-14-20-21.5-42.5T70-436q0-40 20.5-75t57.5-57q5 18 13.5 38.5T181-494q-14 11-22 26.5t-8 32.5q0 56 46 69t87 21l19 32q-11 32-19 54.5t-8 40.5q0 30 21.5 52.5T350-143q38 0 63-34t41-80q16-46 24.5-93t13.5-72l78 21q-9 45-22 103t-36.5 110.5Q488-135 449.5-99T350-63ZM120-189q17 0 28.5-11.5T160-229q0-17-11.5-28.5T120-269q-17 0-28.5 11.5T80-229q0 17 11.5 28.5T120-189Zm284-158q-46-41-83.5-76.5t-64.5-69q-27-33.5-41.5-67T200-629q0-65 44.5-109.5T354-783q4 0 7 .5t7 .5q-4-10-6-20t-2-21q0-50 35-85t85-35q50 0 85 35t35 85q0 11-2 20.5t-6 19.5h14q60 0 102 38.5t50 95.5q-18-3-40.5-3t-41.5 2q-7-23-25.5-38T606-703q-35 0-54.5 20.5T498-623h-37q-35-41-54.5-60.5T354-703q-32 0-53 21t-21 53q0 23 13 47.5t36.5 52q23.5 27.5 57 58.5t74.5 67l-57 57Zm76-436q17 0 28.5-11.5T520-823q0-17-11.5-28.5T480-863q-17 0-28.5 11.5T440-823q0 17 11.5 28.5T480-783ZM609-63q-22 0-43.5-6T524-88q11-14 22-33t20-35q11 7 22 10t22 3q32 0 53.5-22.5T685-219q0-19-8-41t-19-54l19-32q42-8 87.5-21t45.5-69q0-40-29.5-58T716-512q-42 0-98 16t-131 41l-21-78q78-25 139-42t112-17q69 0 121 41t52 115q0 25-7.5 47.5T861-346q43 5 71 39.5t28 77.5q0 50-34.5 85T840-109q-26 0-50.5-11.5T749-153q-20 42-56.5 66T609-63Zm232-126q17 0 28-11.5t11-28.5q0-17-11.5-29T840-270q-17 0-28.5 11.5T800-230q0 17 12 29t29 12Zm-721-40Zm360-594Zm360 593Z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-white mb-2">{{ t('hero.features.community.title') }}</h2>
            <p class="text-white/80">{{ t('hero.features.community.description') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
      <button
        @click="scrollToSection('sobre-nosotros')"
        class="animate-bounce text-white hover:text-yellow-500 transition-colors duration-200"
        :aria-label="t('accessibility.scrollDown')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const showPattern = ref(false);
const showFeatures = ref(true);
const { t } = useI18n()

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

onMounted(() => {
  setTimeout(() => {
    showPattern.value = true;
  }, 500);

  setTimeout(() => {
    showFeatures.value = true;
  }, 800);
});
</script>
