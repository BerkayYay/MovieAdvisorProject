import {useState, useEffect, useCallback} from 'react';
import {Genre} from '../types';
import {
  getGenrePreferences,
  setGenrePreferences,
  addGenrePreference,
  removeGenrePreference,
  getGenrePreferenceStats,
  getGenreCompletionStatus,
  validateGenrePreferences,
  getGenreMatchScore,
  filterContentByGenrePreferences,
  sortContentByGenrePreferences,
} from '../utils/genreStorage';
import {useSafeAsync} from '../utils/memoryLeak';

export const useGenrePreferences = () => {
  const [preferences, setPreferencesState] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {safeAsync} = useSafeAsync();

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await safeAsync(() => getGenrePreferences());
      setPreferencesState(prefs || []);
    } catch (err) {
      console.error('Error loading genre preferences:', err);
      setError('Failed to load genre preferences');
    } finally {
      setLoading(false);
    }
  }, [safeAsync]);

  const savePreferences = useCallback(
    async (newPreferences: number[]) => {
      try {
        setError(null);
        const success = await safeAsync(() =>
          setGenrePreferences(newPreferences),
        );
        if (success) {
          setPreferencesState(newPreferences);
          return true;
        } else {
          setError('Failed to save preferences');
          return false;
        }
      } catch (err) {
        console.error('Error saving genre preferences:', err);
        setError('Failed to save preferences');
        return false;
      }
    },
    [safeAsync],
  );

  const addGenre = useCallback(
    async (genreId: number) => {
      try {
        setError(null);
        const success = await safeAsync(() => addGenrePreference(genreId));
        if (success) {
          await loadPreferences();
          return true;
        } else {
          setError('Failed to add genre preference');
          return false;
        }
      } catch (err) {
        console.error('Error adding genre preference:', err);
        setError('Failed to add genre preference');
        return false;
      }
    },
    [safeAsync, loadPreferences],
  );

  const removeGenre = useCallback(
    async (genreId: number) => {
      try {
        setError(null);
        const success = await safeAsync(() => removeGenrePreference(genreId));
        if (success) {
          await loadPreferences();
          return true;
        } else {
          setError('Failed to remove genre preference');
          return false;
        }
      } catch (err) {
        console.error('Error removing genre preference:', err);
        setError('Failed to remove genre preference');
        return false;
      }
    },
    [safeAsync, loadPreferences],
  );

  const toggleGenre = useCallback(
    async (genreId: number) => {
      if (preferences.includes(genreId)) {
        return await removeGenre(genreId);
      } else {
        return await addGenre(genreId);
      }
    },
    [preferences, addGenre, removeGenre],
  );

  const isPreferred = useCallback(
    (genreId: number) => {
      return preferences.includes(genreId);
    },
    [preferences],
  );

  useEffect(() => {
    loadPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    addGenre,
    removeGenre,
    toggleGenre,
    isPreferred,
    reload: loadPreferences,
  };
};

// Hook for genre statistics and analytics
export const useGenreStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {safeAsync} = useSafeAsync();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResult, completionResult, validationResult] =
        await Promise.all([
          safeAsync(() => getGenrePreferenceStats()),
          safeAsync(() => getGenreCompletionStatus()),
          safeAsync(() => validateGenrePreferences()),
        ]);

      setStats(statsResult);
      setCompletion(completionResult);
      setValidation(validationResult);
    } catch (err) {
      console.error('Error loading genre stats:', err);
      setError('Failed to load genre statistics');
    } finally {
      setLoading(false);
    }
  }, [safeAsync]);

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    completion,
    validation,
    loading,
    error,
    reload: loadStats,
  };
};

export const useGenreFiltering = () => {
  const {safeAsync} = useSafeAsync();

  const getMatchScore = useCallback(
    async (contentGenreIds: number[]): Promise<number> => {
      try {
        const score = await safeAsync(() =>
          getGenreMatchScore(contentGenreIds),
        );
        return score ?? 0;
      } catch (err) {
        console.error('Error getting match score:', err);
        return 0;
      }
    },
    [safeAsync],
  );

  const filterContent = useCallback(
    async <T extends {genre_ids: number[]}>(
      content: T[],
      minScore: number = 0.2,
    ): Promise<T[]> => {
      try {
        const filtered = await safeAsync(() =>
          filterContentByGenrePreferences(content as any, minScore),
        );
        return (filtered as unknown as T[]) ?? content;
      } catch (err) {
        console.error('Error filtering content:', err);
        return content;
      }
    },
    [safeAsync],
  );

  const sortContent = useCallback(
    async <T extends {genre_ids: number[]}>(content: T[]): Promise<T[]> => {
      try {
        const sorted = await safeAsync(() =>
          sortContentByGenrePreferences(content as any),
        );
        return (sorted as unknown as T[]) ?? content;
      } catch (err) {
        console.error('Error sorting content:', err);
        return content;
      }
    },
    [safeAsync],
  );

  return {
    getMatchScore,
    filterContent,
    sortContent,
  };
};

export const useGenres = () => {
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        setError(null);

        const {tmdbService} = await import('../services');

        if (tmdbService.isConfigured()) {
          console.log('🎭 Fetching real genres from TMDb API...');
          const realGenres = await tmdbService.genres.getAllGenres();
          console.log('🎭 Fetched real genres:', realGenres.length);
          setAllGenres(realGenres);
        } else {
          console.log('🎭 TMDb not configured, using mock genres');
          const {getAllGenres} = await import('../data');
          const mockGenres = getAllGenres();
          setAllGenres(mockGenres);
        }
      } catch (err) {
        console.error('Error loading genres:', err);
        setError(err instanceof Error ? err.message : 'Failed to load genres');

        try {
          const {getAllGenres} = await import('../data');
          const mockGenres = getAllGenres();
          setAllGenres(mockGenres);
        } catch (fallbackErr) {
          console.error('Error loading fallback genres:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const getGenreById = useCallback(
    (id: number): Genre | undefined => {
      return allGenres.find(genre => genre.id === id);
    },
    [allGenres],
  );

  const getGenresByIds = useCallback(
    (ids: number[]): Genre[] => {
      return ids
        .map(id => allGenres.find(genre => genre.id === id))
        .filter(Boolean) as Genre[];
    },
    [allGenres],
  );

  const searchGenres = useCallback(
    (query: string): Genre[] => {
      if (!query.trim()) return allGenres;
      const lowercaseQuery = query.toLowerCase();
      return allGenres.filter(genre =>
        genre.name.toLowerCase().includes(lowercaseQuery),
      );
    },
    [allGenres],
  );

  return {
    allGenres,
    loading,
    error,
    getGenreById,
    getGenresByIds,
    searchGenres,
  };
};

export const useGenrePreferenceManager = () => {
  const preferences = useGenrePreferences();
  const stats = useGenreStats();
  const filtering = useGenreFiltering();
  const genres = useGenres();

  const refreshAll = useCallback(async () => {
    await Promise.all([preferences.reload(), stats.reload()]);
  }, [preferences.reload, stats.reload]);

  return {
    preferences,
    stats,
    filtering,
    genres,
    refreshAll,
    isPreferred: preferences.isPreferred,
    toggleGenre: preferences.toggleGenre,
    getGenreById: genres.getGenreById,
    getGenresByIds: genres.getGenresByIds,
  };
};
