import {useState, useEffect, useCallback} from 'react';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  getUserPreferences,
  updateUserPreferences,
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from '../utils/storage';
import {FavoriteItem, UserPreferences} from '../types';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoritesData = await getFavorites();
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addFavorite = useCallback(
    async (item: FavoriteItem) => {
      try {
        await addToFavorites(item);
        await loadFavorites();
        return true;
      } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
      }
    },
    [loadFavorites],
  );

  const removeFavorite = useCallback(
    async (id: number, type: 'movie' | 'tv') => {
      try {
        await removeFromFavorites(id, type);
        await loadFavorites();
        return true;
      } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
      }
    },
    [loadFavorites],
  );

  const toggleFavoriteItem = useCallback(async (item: FavoriteItem) => {
    try {
      const updatedFavorites = await toggleFavorite(item);
      setFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }, []);

  const isFavorite = useCallback(
    (id: number, type: 'movie' | 'tv') => {
      return favorites.some(item => item.id === id && item.type === type);
    },
    [favorites],
  );

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite: toggleFavoriteItem,
    isFavorite,
    refresh: loadFavorites,
  };
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteGenres: [],
    preferredLanguage: 'en',
    adultContent: false,
    sortMethod: 'popularity',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const preferencesData = await getUserPreferences();
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      try {
        await updateUserPreferences(newPreferences);
        setPreferences(current => ({...current, ...newPreferences}));
        return true;
      } catch (error) {
        console.error('Error updating preferences:', error);
        return false;
      }
    },
    [],
  );

  const updateTheme = useCallback(
    async (theme: 'light' | 'dark') => {
      return await updatePreferences({theme});
    },
    [updatePreferences],
  );

  const updateSortMethod = useCallback(
    async (sortMethod: 'popularity' | 'rating' | 'release_date') => {
      return await updatePreferences({sortMethod});
    },
    [updatePreferences],
  );

  const toggleAdultContent = useCallback(async () => {
    return await updatePreferences({adultContent: !preferences.adultContent});
  }, [preferences.adultContent, updatePreferences]);

  const addFavoriteGenre = useCallback(
    async (genreId: number) => {
      const updatedGenres = [...preferences.favoriteGenres];
      if (!updatedGenres.includes(genreId)) {
        updatedGenres.push(genreId);
        return await updatePreferences({favoriteGenres: updatedGenres});
      }
      return true;
    },
    [preferences.favoriteGenres, updatePreferences],
  );

  const removeFavoriteGenre = useCallback(
    async (genreId: number) => {
      const updatedGenres = preferences.favoriteGenres.filter(
        id => id !== genreId,
      );
      return await updatePreferences({favoriteGenres: updatedGenres});
    },
    [preferences.favoriteGenres, updatePreferences],
  );

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    updateTheme,
    updateSortMethod,
    toggleAdultContent,
    addFavoriteGenre,
    removeFavoriteGenre,
    refresh: loadPreferences,
  };
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const historyData = await getSearchHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToHistory = useCallback(
    async (query: string) => {
      try {
        await addToSearchHistory(query);
        await loadHistory();
        return true;
      } catch (error) {
        console.error('Error adding to search history:', error);
        return false;
      }
    },
    [loadHistory],
  );

  const clearHistory = useCallback(async () => {
    try {
      await clearSearchHistory();
      setHistory([]);
      return true;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    addToHistory,
    clearHistory,
    refresh: loadHistory,
  };
};

export const useStorageStates = () => {
  const favorites = useFavorites();
  const preferences = useUserPreferences();
  const searchHistory = useSearchHistory();

  const loading =
    favorites.loading || preferences.loading || searchHistory.loading;

  const refreshAll = useCallback(async () => {
    await Promise.all([
      favorites.refresh(),
      preferences.refresh(),
      searchHistory.refresh(),
    ]);
  }, [favorites.refresh, preferences.refresh, searchHistory.refresh]);

  return {
    favorites,
    preferences,
    searchHistory,
    loading,
    refreshAll,
  };
};
