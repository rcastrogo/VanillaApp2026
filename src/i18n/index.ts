import en from './en';
import es from './es';
import { useState } from '../core/state.utils';
import { getValue, interpolate } from '../core/template';

export type Language = 'es' | 'en';

interface TranslationSchema{
  [key: string]: string | TranslationSchema;
};

const translations: Record<string, TranslationSchema> = { es, en };
const i18nState = useState({ lng: 'es' as Language });

export const i18nService = {
  setLng(newLng: Language) {
    if (translations[newLng]) i18nState.put('lng', newLng);
  },

  get currentLng() {
    return i18nState.strore.lng;
  },

  t(key: string, ctx: unknown ): string {
    const lang = i18nState.strore.lng;
    const text = getValue(key, translations[lang]);
    if (!text) return key;
    if (text.includes('{')) return interpolate(text, ctx);
    return text;
  }
};


// const savedLang = localStorage.getItem('lang') || 'es';
// //   (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Ejemplo de uso manual en código:
// const mensaje = APP_CONFIG.i18n.t('ui.actions.interpolate', 5, 'USR-01', 'Admin');
