import { useCallback } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import Backend from 'i18next-http-backend';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import config from '../../config';

const preferenceKey = 'daily-ledger-language';
let language = config.defaultLanguage;
try {
  const saved = localStorage.getItem(preferenceKey);
  if (config.allowedLanguages.includes(saved)) language = saved;
} catch {
  // Language switching also works when persistent storage is unavailable.
}

const applyLanguage = lng => {
  dayjs.locale(lng);
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(preferenceKey, lng);
  } catch {
    // Retain the choice for this page even when storage is unavailable.
  }
};
i18n.on('languageChanged', applyLanguage);
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: language,
    fallbackLng: config.defaultLanguage,
    supportedLngs: config.allowedLanguages,
    ns: ['common', 'core', 'diary'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    interpolation: { escapeValue: false }
  });

export const useDiary = () => {
  const { t: translate, i18n: instance } = useTranslation('diary');
  const t = useCallback(
    (text, options) => translate(text, { keySeparator: false, nsSeparator: false, ...options }),
    [translate]
  );
  return { t, i18n: instance };
};

export default i18n;
