import { createI18n } from 'vue-i18n'

import es from './locales/es.json'
import ca from './locales/ca.json'
import en from './locales/en.json'

const getDefaultLocale = (): string => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['es', 'ca', 'en'].includes(savedLocale)) {
    return savedLocale
  }

  const browserLocale = navigator.language.split('-')[0]

  const localeMap: { [key: string]: string } = {
    'es': 'es',
    'ca': 'ca',
    'en': 'en',
    'es-ES': 'es',
    'ca-ES': 'ca',
    'en-US': 'en',
    'en-GB': 'en'
  }

  if (localeMap[browserLocale]) {
    return localeMap[browserLocale]
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
  if (['es', 'ca', 'en'].includes(locale)) {
    i18n.global.locale.value = locale as 'es' | 'ca' | 'en'
    localStorage.setItem('locale', locale)

    document.documentElement.setAttribute('lang', locale)

    updateSEOMetaTags(locale)
  }
}

const updateSEOMetaTags = (locale: string) => {
  const title = i18n.global.t('seo.metaTitle')
  const description = i18n.global.t('seo.metaDescription')

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

  updateHrefLangTags(locale)
}


const updateHrefLangTags = (_currentLocale: string) => {
  const existingHrefLangs = document.querySelectorAll('link[hreflang]')
  existingHrefLangs.forEach(link => link.remove())

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

  const defaultLink = document.createElement('link')
  defaultLink.rel = 'alternate'
  defaultLink.hreflang = 'x-default'
  defaultLink.href = baseUrl
  document.head.appendChild(defaultLink)
}

export const getCurrentLocale = () => {
  return i18n.global.locale.value
}

export const availableLocales = [
  { code: 'ca', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default i18n
