<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content -->
    <main>
      <!-- Hero Section -->
      <HeroSection />

      <!-- About Section -->
      <AboutSection />

      <!-- Programs Section - Temporarily Hidden -->
      <!-- <ProgramsSection /> -->

      <!-- Contact Section -->
      <ContactSection />
    </main>

    <!-- Footer -->
    <FooterSection />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './assets/components/AboutSection.vue';
// import ProgramsSection from './assets/components/ProgramsSection.vue';
import ContactSection from './components/ContactSection.vue';
import FooterSection from './components/FooterSection.vue';
</script>
