<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main>
      <HeroSection />
      <div v-show="showSections">
        <AboutSection />
        <ProgramsSection />
        <ContactSection />
      </div>
      <div v-if="!showSections" class="flex items-center justify-center py-20">
        <div class="loading-spinner"></div>
        <span class="ml-3 text-gray-600">Carregant contingut...</span>
      </div>
    </main>
    <FooterSection />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from './components/NavBar.vue';
import HeroSection from './components/HeroSection.vue';
import FooterSection from './components/FooterSection.vue';
import AboutSection from './components/AboutSection.vue';
import ProgramsSection from './components/ProgramsSection.vue';
import ContactSection from './components/ContactSection.vue';

const showSections = ref(false);

onMounted(() => {
  setTimeout(() => {
    showSections.value = true;
  }, 200);
});
</script>
