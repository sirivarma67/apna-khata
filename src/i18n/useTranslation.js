import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { speechLocales, translate } from './translations.js';

export default function useTranslation(languageOverride) {
  const { user } = useAuth();
  const selected = languageOverride || user?.preferredLanguage || localStorage.getItem('apna-khata-language') || 'en';
  const language = ['en', 'te', 'hi'].includes(selected) ? selected : 'en';
  const t = useCallback((key, values) => translate(language, key, values), [language]);
  return { language, locale: speechLocales[language] || speechLocales.en, t };
}
