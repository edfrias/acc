<template>
  <!-- Desktop: Compact indicator with tooltip -->
  <div
    v-if="!isMobile"
    class="relative inline-block"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <button
      v-if="hasApiKey"
      class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200 rounded-md hover:bg-gray-50"
      :aria-label="t('weather.compactLabel')"
    >
      <img
        v-if="weather"
        :src="weatherIconUrl"
        :alt="weatherDescription"
        class="w-5 h-5"
      />
      <span v-if="weather" class="font-medium">{{ Math.round(weather.temp) }}°C</span>
      <span v-else class="text-gray-400">--°C</span>
    </button>

    <!-- Tooltip -->
    <div
      v-if="showTooltip && weather"
      class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 class="font-semibold text-gray-900">{{ t('weather.title') }}</h4>
            <p class="text-sm text-gray-600">{{ weatherDescription }}</p>
          </div>
          <img
            :src="weatherIconUrl"
            :alt="weatherDescription"
            class="w-8 h-8"
          />
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex flex-col">
            <span class="font-medium text-gray-700">{{ t('weather.temperature') }}</span>
            <span class="text-lg font-bold text-gray-900">{{ Math.round(weather.temp) }}°C</span>
          </div>

          <div class="flex flex-col">
            <span class="font-medium text-gray-700">{{ t('weather.humidity') }}</span>
            <span class="text-lg font-bold text-gray-900">{{ weather.humidity }}%</span>
          </div>

          <div class="flex flex-col col-span-2">
            <span class="font-medium text-gray-700">{{ t('weather.uvIndex') }}</span>
            <span :class="['text-lg font-bold', uvSeverityClass]">{{ weather.uvi }}</span>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            @click="fetchWeather"
            :disabled="loading"
            class="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ t('weather.refresh') }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile: Compact indicator with modal trigger -->
  <div v-else class="inline-block">
    <button
      v-if="hasApiKey"
      @click="showModal = true"
      class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200 rounded-md hover:bg-gray-50"
      :aria-label="t('weather.compactLabel')"
    >
      <img
        v-if="weather"
        :src="weatherIconUrl"
        :alt="weatherDescription"
        class="w-5 h-5"
      />
      <span v-if="weather" class="font-medium">{{ Math.round(weather.temp) }}°C</span>
      <span v-else class="text-gray-400">--°C</span>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
          <div class="p-6">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ t('weather.title') }}</h3>
                <p class="text-sm text-gray-600">{{ weatherDescription }}</p>
              </div>
              <button
                @click="showModal = false"
                class="text-gray-400 hover:text-gray-600"
                :aria-label="t('accessibility.closeMenu')"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="!hasApiKey" class="text-sm text-gray-600 mb-4">
              {{ t('weather.noApiKey') }}
            </div>

            <div v-else-if="loading" class="text-sm text-gray-600 mb-4">
              {{ t('weather.loading') }}
            </div>

            <div v-else-if="error" class="text-sm text-red-600 mb-4">
              {{ error }}
            </div>

            <div v-else-if="weather" class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div class="flex flex-col">
                <span class="font-medium text-gray-700">{{ t('weather.temperature') }}</span>
                <span class="text-2xl font-bold text-gray-900">{{ Math.round(weather.temp) }}°C</span>
              </div>

              <div class="flex flex-col">
                <span class="font-medium text-gray-700">{{ t('weather.humidity') }}</span>
                <span class="text-2xl font-bold text-gray-900">{{ weather.humidity }}%</span>
              </div>

              <div class="flex flex-col col-span-2">
                <span class="font-medium text-gray-700">{{ t('weather.uvIndex') }}</span>
                <span :class="['text-2xl font-bold', uvSeverityClass]">{{ weather.uvi }}</span>
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="fetchWeather"
                :disabled="loading"
                class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('weather.refresh') }}
              </button>
              <button
                @click="showModal = false"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                {{ t('weather.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Teleport } from 'vue';

type WeatherData = {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
  uvi: number;
  weatherCode: number;
};

const { t, locale } = useI18n();

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const LAT = 41.279;
const LON = 1.9735;

const loading = ref(false);
const error = ref<string | null>(null);
const weather = ref<WeatherData | null>(null);
const showTooltip = ref(false);
const showModal = ref(false);

const hasApiKey = true; // Open-Meteo no requiere API key

// Mobile detection
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768; // md breakpoint
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  if (hasApiKey) fetchWeather();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const weatherIconUrl = computed(() => {
  if (!weather.value?.icon) return '';
  return `https://openweathermap.org/img/wn/${weather.value.icon}@2x.png`;
});

const weatherDescription = computed(() => {
  if (!weather.value) return '';
  const langCode = locale.value?.split('-')[0] ?? 'en';
  return getWeatherDescription(weather.value.weatherCode, langCode);
});

const uvSeverityClass = computed(() => {
  const uvi = weather.value?.uvi ?? 0;
  if (uvi >= 11) return 'text-purple-600';
  if (uvi >= 8) return 'text-red-600';
  if (uvi >= 6) return 'text-orange-600';
  if (uvi >= 3) return 'text-yellow-600';
  return 'text-green-600';
});

const fetchWeather = async () => {
  loading.value = true;
  error.value = null;

  try {
    const langCode = locale.value?.split('-')[0] ?? 'en';
    const url = `${API_BASE_URL}?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index&timezone=auto&lang=${langCode}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${t('weather.failed')} (${response.status})`);
    }

    const data = await response.json();

    // Map WMO weather codes to descriptions
    const weatherCode = data?.current?.weather_code ?? 0;
    const weatherDescription = getWeatherDescription(weatherCode, langCode);

    weather.value = {
      temp: data?.current?.temperature_2m ?? 0,
      humidity: data?.current?.relative_humidity_2m ?? 0,
      description: weatherDescription,
      icon: getWeatherIcon(weatherCode),
      uvi: data?.current?.uv_index ?? 0,
      weatherCode: weatherCode
    };
  } catch (err: any) {
    error.value = err?.message ?? t('weather.failed');
  } finally {
    loading.value = false;
  }
};

// WMO Weather Code mappings
const getWeatherDescription = (code: number, lang: string): string => {
  const descriptions: Record<string, Record<number, string>> = {
    en: {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    },
    es: {
      0: 'Cielo despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla con escarcha',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna densa',
      56: 'Llovizna helada ligera',
      57: 'Llovizna helada densa',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia intensa',
      66: 'Lluvia helada ligera',
      67: 'Lluvia helada intensa',
      71: 'Nevada ligera',
      73: 'Nevada moderada',
      75: 'Nevada intensa',
      77: 'Granos de nieve',
      80: 'Chubascos ligeros',
      81: 'Chubascos moderados',
      82: 'Chubascos violentos',
      85: 'Chubascos de nieve ligeros',
      86: 'Chubascos de nieve intensos',
      95: 'Tormenta',
      96: 'Tormenta con granizo ligero',
      99: 'Tormenta con granizo intenso'
    },
    ca: {
      0: 'Cel clar',
      1: 'Principalment clar',
      2: 'Parcialment ennuvolat',
      3: 'Ennuvolat',
      45: 'Boira',
      48: 'Boira amb gebre',
      51: 'Plugim lleuger',
      53: 'Plugim moderat',
      55: 'Plugim dens',
      56: 'Plugim gelat lleuger',
      57: 'Plugim gelat dens',
      61: 'Pluja lleugera',
      63: 'Pluja moderada',
      65: 'Pluja intensa',
      66: 'Pluja gelada lleugera',
      67: 'Pluja gelada intensa',
      71: 'Nevada lleugera',
      73: 'Nevada moderada',
      75: 'Nevada intensa',
      77: 'Grans de neu',
      80: 'Ruixats lleugers',
      81: 'Ruixats moderats',
      82: 'Ruixats violents',
      85: 'Ruixats de neu lleugers',
      86: 'Ruixats de neu intensos',
      95: 'Tempesta',
      96: 'Tempesta amb calamarsa lleugera',
      99: 'Tempesta amb calamarsa intensa'
    }
  };

  return descriptions[lang]?.[code] ?? descriptions.en[code] ?? 'Unknown';
};

const getWeatherIcon = (code: number): string => {
  // Map WMO codes to OpenWeatherMap icon codes for compatibility
  const iconMap: Record<number, string> = {
    0: '01d', // Clear sky
    1: '02d', // Mainly clear
    2: '03d', // Partly cloudy
    3: '04d', // Overcast
    45: '50d', // Fog
    48: '50d', // Depositing rime fog
    51: '09d', // Light drizzle
    53: '09d', // Moderate drizzle
    55: '09d', // Dense drizzle
    56: '09d', // Light freezing drizzle
    57: '09d', // Dense freezing drizzle
    61: '10d', // Slight rain
    63: '10d', // Moderate rain
    65: '10d', // Heavy rain
    66: '10d', // Light freezing rain
    67: '10d', // Heavy freezing rain
    71: '13d', // Slight snow fall
    73: '13d', // Moderate snow fall
    75: '13d', // Heavy snow fall
    77: '13d', // Snow grains
    80: '09d', // Slight rain showers
    81: '09d', // Moderate rain showers
    82: '09d', // Violent rain showers
    85: '13d', // Slight snow showers
    86: '13d', // Heavy snow showers
    95: '11d', // Thunderstorm
    96: '11d', // Thunderstorm with slight hail
    99: '11d'  // Thunderstorm with heavy hail
  };

  return iconMap[code] ?? '01d';
};
</script>
