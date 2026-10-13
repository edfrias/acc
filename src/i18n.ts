import { createI18n } from 'vue-i18n'

import es from './locales/es.json'
import ca from './locales/ca.json'
import en from './locales/en.json'

type Locale = 'es' | 'ca' | 'en'

const isLocale = (value: string | null): value is Locale =>
  value !== null && ['es', 'ca', 'en'].includes(value)

// ?lang= manda: es la URL que anuncian los hreflang de index.html para cada idioma
const getDefaultLocale = (): Locale => {
  const urlLocale = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(urlLocale)) {
    return urlLocale
  }

  const savedLocale = localStorage.getItem('locale')
  if (isLocale(savedLocale)) {
    return savedLocale
  }

  const browserLocale = navigator.language.split('-')[0]
  if (isLocale(browserLocale)) {
    return browserLocale
  }

  return 'ca'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'es',
  messages: {
    es,
    ca,
    en
  },
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false
})

export const setLocale = (locale: string) => {
  if (isLocale(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('locale', locale)

    const url = new URL(window.location.href)
    url.searchParams.set('lang', locale)
    history.replaceState(history.state, '', url)

    updateDocumentLocale()
  }
}

// index.html trae el título y las meta etiquetas en catalán; se cambian al idioma activo
const updateDocumentLocale = () => {
  const title = i18n.global.t('seo.metaTitle')
  const description = i18n.global.t('seo.metaDescription')

  document.documentElement.setAttribute('lang', i18n.global.locale.value)
  document.title = title

  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', description)
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', title)
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', description)
  }

  const twitterTitle = document.querySelector('meta[name="twitter:title"]')
  if (twitterTitle) {
    twitterTitle.setAttribute('content', title)
  }

  const twitterDescription = document.querySelector('meta[name="twitter:description"]')
  if (twitterDescription) {
    twitterDescription.setAttribute('content', description)
  }
}

updateDocumentLocale()

export const getCurrentLocale = () => {
  return i18n.global.locale.value
}

export const availableLocales = [
  { code: 'ca', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default i18n
