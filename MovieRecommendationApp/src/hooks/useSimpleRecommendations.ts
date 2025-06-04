import {useState, useEffect, useCallback} from 'react';
import {
  SimpleCategory,
  getSimpleRecommendations,
  hasUserPreferences,
  refreshSimpleRecommendations,
} from '../utils/simpleRecommendations';
import {useSafeAsync} from '../utils/memoryLeak';

interface UseSimpleRecommendationsReturn {
  categories: SimpleCategory[];
  hasPreferences: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

export const useSimpleRecommendations = (): UseSimpleRecommendationsReturn => {
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {safeAsync} = useSafeAsync();

  const loadData = useCallback(async () => {
    try {
      setError(null);

      const userHasPrefs = await safeAsync(() => hasUserPreferences());
      setHasPreferences(userHasPrefs || false);

      const recs = await safeAsync(() => getSimpleRecommendations());

      if (recs) {
        setCategories(recs);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load recommendations',
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [safeAsync]);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      await safeAsync(() => refreshSimpleRecommendations());

      const userHasPrefs = await safeAsync(() => hasUserPreferences());
      setHasPreferences(userHasPrefs || false);

      const recs = await safeAsync(() => getSimpleRecommendations());
      if (recs) {
        setCategories(recs);
      }
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to refresh recommendations',
      );
    }
  }, [safeAsync]);

  const reload = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    categories,
    hasPreferences,
    loading,
    error,
    refresh,
    reload,
  };
};
