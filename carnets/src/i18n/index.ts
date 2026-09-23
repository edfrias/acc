import { createI18n } from 'vue-i18n'
import type { ValidationIssue } from '../pipeline'
import ca from './locales/ca.json'
import en from './locales/en.json'
import es from './locales/es.json'

export type Locale = 'ca' | 'es' | 'en'

export const availableLocales: { code: Locale; name: string }[] = [
  { code: 'ca', name: 'Català' },
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
]

const STORAGE_KEY = 'locale'

function isLocale(value: string | null): value is Locale {
  return availableLocales.some((locale) => locale.code === value)
}

/** Idioma guardado, si no el del navegador, y si no catalán. Como en la web del club. */
function initialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (isLocale(saved)) return saved
  const browser = navigator.language.split('-')[0]
  return isLocale(browser) ? browser : 'ca'
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'es',
  messages: { ca, es, en },
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  syncDocument()
}

/** `lang` y título de la pestaña en el idioma actual. */
export function syncDocument(): void {
  document.documentElement.lang = i18n.global.locale.value
  document.title = `${i18n.global.t('app.title')} · ${i18n.global.t('app.club')}`
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/** Nombre visible de un campo de la plantilla; si no está traducido, su nombre técnico. */
export function fieldLabel(t: Translate, te: (key: string) => boolean, field: string): string {
  return te(`fields.${field}`) ? t(`fields.${field}`) : field
}

/** Texto de una incidencia de validación en el idioma actual. */
export function describeIssue(t: Translate, te: (key: string) => boolean, issue: ValidationIssue): string {
  const field = fieldLabel(t, te, issue.field)
  switch (issue.code) {
    case 'missing-glyph':
      return t('issues.missing-glyph', { field, chars: issue.chars.join(' ') })
    case 'duplicate':
      return t('issues.duplicate', { field, value: issue.value, rows: issue.otherRows.join(', ') })
    case 'font-reduced':
      return t('issues.font-reduced', { field, value: issue.value, percent: issue.percent })
    case 'encoding':
    case 'invalid-format':
    case 'does-not-fit':
      return t(`issues.${issue.code}`, { field, value: issue.value })
    case 'empty-field':
    case 'missing-static':
      return t(`issues.${issue.code}`, { field })
  }
}

export default i18n
