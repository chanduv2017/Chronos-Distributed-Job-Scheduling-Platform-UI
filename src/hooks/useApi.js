import { useState, useEffect, useCallback } from 'react';

/**
 * Data-fetching hook with loading/error state and auto-refresh.
 *
 * @param {Function} fetchFn - Async function that returns data
 * @param {object} options - { deps, refreshInterval, enabled }
 */
export function useApi(fetchFn, options = {}) {
  const { deps = [], refreshInterval = null, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading((prev) => prev || !data); // only show spinner on first load
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled]);

  useEffect(() => {
    execute();
  }, [execute, ...deps]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const id = setInterval(execute, refreshInterval);
    return () => clearInterval(id);
  }, [execute, refreshInterval, enabled]);

  return { data, loading, error, refetch: execute };
}
