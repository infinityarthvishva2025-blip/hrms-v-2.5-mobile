import { useState, useCallback, useEffect, useRef } from 'react';

export const useFetch = (apiFunc, initialData = null, immediate = true) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const apiFuncRef = useRef(apiFunc);
  useEffect(() => {
    apiFuncRef.current = apiFunc;
  }, [apiFunc]);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFuncRef.current(...args);
      const result = response.data?.data || response.data;
      setData(result);
      return result;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Stable execute

  useEffect(() => {
    if (immediate) {
      execute().catch(e => console.log('useFetch error', e));
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
};
