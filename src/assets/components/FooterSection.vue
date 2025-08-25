<template>
  <footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Club Info -->
        <div class="col-span-1 lg:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <img
              :src="logoACC"
              alt="Logo Arquers Club Castelldefels"
              class="w-8 h-8 rounded-lg object-cover"
            />
            <span class="font-display font-bold text-xl">Arquers Club Castelldefels</span>
          </div>
          <p class="text-gray-300 mb-6 max-w-md">
            Comunidad catalana apasionada por el tiro con arco en Castelldefels.
            Realizamos actividades y cursos de formación para arqueros de todos los niveles.
          </p>

          <!-- Social Links -->
          <div class="flex space-x-4">
            <a
              href="https://instagram.com/arquersclubc"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-yellow-600 transition-colors duration-200"
              aria-label="Seguir en Instagram @arquersclubc"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.748-.948-.748-2.122 0-3.07.749-.948 1.9-1.559 3.197-1.559s2.448.611 3.197 1.559c.748.948.748 2.122 0 3.07-.749.948-1.9 1.559-3.197 1.559zm7.138 0c-1.297 0-2.448-.611-3.197-1.559-.748-.948-.748-2.122 0-3.07.749-.948 1.9-1.559 3.197-1.559s2.448.611 3.197 1.559c.748.948.748 2.122 0 3.07-.749.948-1.9 1.559-3.197 1.559z"/>
              </svg>
            </a>
            <div class="flex items-center text-gray-300 text-sm">
              @arquersclubc
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div>
          <h2 class="font-semibold text-lg mb-4">Contacto</h2>
          <ul class="space-y-3">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-gray-300 text-sm">
                Arquers Club Castelldefels<br>
                Castelldefels, Cataluña
              </span>
            </li>
            <li class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="text-gray-300 text-sm">secretaria@arquerscastelldefels.com</span>
            </li>
            <li class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="text-gray-300 text-sm">junta@arquerscastelldefels.com</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-gray-800 mt-12 pt-8">
        <div class="text-center">
          <p class="text-white text-sm">
            &copy; {{ currentYear }} Arquers Club Castelldefels. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const logoACC = '/assets/images/logo_acc.jpg';
const currentYear = computed(() => new Date().getFullYear());
</script>
