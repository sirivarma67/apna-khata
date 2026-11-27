import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../services/api.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'apna-khata-token';
const LANGUAGE_KEY = 'apna-khata-language';

function saveLanguage(language) {
  localStorage.setItem(LANGUAGE_KEY, ['en', 'te', 'hi'].includes(language) ? language : 'en');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    api.get('/auth/me')
      .then(({ data }) => {
        if (active) {
          setUser(data.user);
          saveLanguage(data.user.preferredLanguage);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        localStorage.removeItem(TOKEN_KEY);
        setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const requestOtp = useCallback(async (phone) => {
    setError('');
    const { data } = await api.post('/auth/request-otp', { phone });
    return data;
  }, []);

  const verifyOtp = useCallback(async (details) => {
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', details);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      saveLanguage(data.user.preferredLanguage);
      return data.user;
    } catch (requestError) {
      setError(getApiError(requestError));
      throw requestError;
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const previousUser = user;
    if (updates.preferredLanguage) {
      setUser((current) => ({ ...current, preferredLanguage: updates.preferredLanguage }));
      saveLanguage(updates.preferredLanguage);
    }
    try {
      const { data } = await api.patch('/auth/profile', updates);
      setUser(data.user);
      saveLanguage(data.user.preferredLanguage);
      return data.user;
    } catch (requestError) {
      if (updates.preferredLanguage) {
        setUser(previousUser);
        saveLanguage(previousUser?.preferredLanguage);
      }
      throw requestError;
    }
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError('');
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    requestOtp,
    verifyOtp,
    updateProfile,
    logout,
    clearError: () => setError(''),
  }), [user, loading, error, requestOtp, verifyOtp, updateProfile, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
