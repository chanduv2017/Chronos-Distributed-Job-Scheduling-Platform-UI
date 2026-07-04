import { useState, useEffect, useCallback } from "react";

export function useApi<T = unknown>(
  fetchFn: () => Promise<T>,
  options: { deps?: unknown[]; refreshInterval?: number | null; enabled?: boolean } = {}
) {
  const { deps = [], refreshInterval = null, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) return;
    try {
      if (!data) setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, enabled]);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...deps]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const id = setInterval(execute, refreshInterval);
    return () => clearInterval(id);
  }, [execute, refreshInterval, enabled]);

  return { data, loading, error, refetch: execute };
}
