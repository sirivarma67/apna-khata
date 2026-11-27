import { useEffect, useState } from 'react';
import { api, getApiError } from '../services/api.js';
import useTranslation from '../i18n/useTranslation.js';

export default function useApiData(path, fallback = null) {
  const { language } = useTranslation();
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRequestError(null);
    api.get(path)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) setRequestError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [path, revision]);

  return {
    data,
    setData,
    loading,
    error: requestError ? getApiError(requestError, language) : '',
    refetch: () => setRevision((value) => value + 1),
  };
}
