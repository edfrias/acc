<template>
  <section id="sobre-nosotros" class="py-16 lg:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
        <!-- Content -->
        <div class="mb-12 lg:mb-0">
          <h2 class="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-6">
            Sobre el Arques Club Castelldefels
          </h2>
          <p class="text-lg text-gray-600 mb-6 leading-relaxed">
            El Arques Club Castelldefels es una comunidad apasionada de arqueros ubicada en el corazón de Cataluña.
            Nos dedicamos a preservar y promover el noble arte del tiro con arco, ofreciendo un ambiente
            acogedor y profesional para arqueros de todas las edades y niveles de experiencia en Castelldefels.
          </p>
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Realizamos diversas actividades y cursos de formación en tiro con arco, contamos con instructores
            certificados y una comunidad vibrante que comparte la pasión por la precisión, la disciplina y la tradición catalana del tiro con arco.
          </p>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">300+</div>
              <div class="text-sm text-gray-600 font-medium">Miembros Activos</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">26</div>
              <div class="text-sm text-gray-600 font-medium">Años de Historia</div>
            </div>
            <div class="text-center col-span-2 md:col-span-1">
              <div class="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div class="text-sm text-gray-600 font-medium">Torneos Ganados</div>
            </div>
          </div>

          <!-- Features -->
          <div class="space-y-4">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">Instructores Certificados</h2>
                <p class="text-gray-600">Entrenadores con certificación internacional y años de experiencia</p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">Todas las Modalidades</h2>
                <p class="text-gray-600">Arco recurvo, compuesto, tradicional y tiro de campo</p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h2 class="font-semibold text-gray-900">Competiciones Regulares</h2>
                <p class="text-gray-600">Torneos locales, regionales e internacionales</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Image/Visual -->
        <div class="relative">
          <div class="aspect-w-4 aspect-h-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
            <!-- Club logo image -->
            <img
              :src="logoAcc"
              alt="Arques Club Castelldefels Logo"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>

          <!-- Decorative Elements -->
          <div class="absolute -top-4 -right-4 w-24 h-24 bg-yellow-500 rounded-full opacity-20"></div>
          <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500 rounded-full opacity-30"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Component logic can be added here if needed
const logoAcc = '/assets/images/logo_acc.jpg';
</script>
