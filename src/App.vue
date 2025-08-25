<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main>
      <HeroSection />
      <AboutSection />
      <!-- Programs Section - Temporarily Hidden -->
      <!-- <ProgramsSection /> -->
      <ContactSection />
    </main>
    <FooterSection />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
// import ProgramsSection from './components/ProgramsSection.vue';
import ContactSection from './components/ContactSection.vue';
import FooterSection from './components/FooterSection.vue';
</script>
