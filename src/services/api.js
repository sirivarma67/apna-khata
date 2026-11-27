import axios from 'axios';
import { localizeApiError } from '../i18n/translations.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apna-khata-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error, language = 'en') {
  return localizeApiError(error, language);
}
