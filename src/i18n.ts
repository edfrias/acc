import { createI18n } from 'vue-i18n'

// Importar archivos de traducción
import es from './locales/es.json'
import ca from './locales/ca.json'
import en from './locales/en.json'

// Detectar idioma preferido del usuario
const getDefaultLocale = (): string => {
  // Primero verificar si hay un idioma guardado en localStorage
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['es', 'ca', 'en'].includes(savedLocale)) {
    return savedLocale
  }

  // Detectar idioma del navegador
  const browserLocale = navigator.language.split('-')[0]

  // Mapear algunos códigos de idioma comunes
  const localeMap: { [key: string]: string } = {
    'es': 'es',
    'ca': 'ca',
    'en': 'en',
    'es-ES': 'es',
    'ca-ES': 'ca',
    'en-US': 'en',
    'en-GB': 'en'
  }

  // Si el idioma del navegador está soportado, usarlo
  if (localeMap[browserLocale]) {
    return localeMap[browserLocale]
  }

  // Por defecto usar catalán (idioma local)
  return 'ca'
}

// Configuración de i18n
const i18n = createI18n({
  legacy: false, // Usar Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'es', // Si una traducción no existe, usar español
  messages: {
    es,
    ca,
    en
  },
  // Configuración para SEO
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
})

// Función para cambiar idioma y actualizar localStorage
export const setLocale = (locale: string) => {
  if (['es', 'ca', 'en'].includes(locale)) {
    i18n.global.locale.value = locale as 'es' | 'ca' | 'en'
    localStorage.setItem('locale', locale)

    // Actualizar el atributo lang del HTML para accesibilidad y SEO
    document.documentElement.setAttribute('lang', locale)

    // Actualizar meta tags SEO
    updateSEOMetaTags(locale)
  }
}

// Función para actualizar meta tags según el idioma
const updateSEOMetaTags = (locale: string) => {
  const title = i18n.global.t('seo.metaTitle')
  const description = i18n.global.t('seo.metaDescription')

  // Actualizar title
  document.title = title

  // Actualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', description)
  }

  // Actualizar Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', title)
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', description)
  }

  // Actualizar Twitter Cards
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')
  if (twitterTitle) {
    twitterTitle.setAttribute('content', title)
  }

  const twitterDescription = document.querySelector('meta[name="twitter:description"]')
  if (twitterDescription) {
    twitterDescription.setAttribute('content', description)
  }

  // Actualizar hreflang para idiomas alternativos
  updateHrefLangTags(locale)
}

// Función para actualizar hreflang tags para SEO multiidioma
const updateHrefLangTags = (_currentLocale: string) => {
  // Remover hreflang existentes
  const existingHrefLangs = document.querySelectorAll('link[hreflang]')
  existingHrefLangs.forEach(link => link.remove())

  // Crear nuevos hreflang
  const baseUrl = window.location.origin
  const languages = [
    { code: 'es', region: 'es-ES' },
    { code: 'ca', region: 'ca-ES' },
    { code: 'en', region: 'en' }
  ]

  languages.forEach(lang => {
    const link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = lang.region
    link.href = `${baseUrl}/?lang=${lang.code}`
    document.head.appendChild(link)
  })

  // Agregar x-default para idioma por defecto
  const defaultLink = document.createElement('link')
  defaultLink.rel = 'alternate'
  defaultLink.hreflang = 'x-default'
  defaultLink.href = baseUrl
  document.head.appendChild(defaultLink)
}

// Función para obtener idioma actual
export const getCurrentLocale = () => {
  return i18n.global.locale.value
}

// Lista de idiomas disponibles para el selector
export const availableLocales = [
  { code: 'ca', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default i18n
