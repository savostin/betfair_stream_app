import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enMarkets from './locales/en/markets.json'
import enSettings from './locales/en/settings.json'
import enErrors from './locales/en/errors.json'

import esCommon from './locales/es/common.json'
import esAuth from './locales/es/auth.json'
import esMarkets from './locales/es/markets.json'
import esSettings from './locales/es/settings.json'
import esErrors from './locales/es/errors.json'

// NOTE: This module intentionally performs one-time i18n initialization as a side-effect.
// Import it once (e.g. in main.tsx) before rendering.

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'markets', 'settings', 'errors'],
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        markets: enMarkets,
        settings: enSettings,
        errors: enErrors,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        markets: esMarkets,
        settings: esSettings,
        errors: esErrors,
      },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app.language',
    },
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
    returnNull: false,
  })

export default i18n
