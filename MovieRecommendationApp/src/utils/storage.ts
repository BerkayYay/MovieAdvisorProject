import AsyncStorage from '@react-native-async-storage/async-storage';
import {FavoriteItem, UserPreferences} from '../types';

// Storage keys
export const STORAGE_KEYS = {
  FAVORITES: '@MovieApp:favorites',
  USER_PREFERENCES: '@MovieApp:preferences',
  SEARCH_HISTORY: '@MovieApp:searchHistory',
  ONBOARDING_COMPLETED: '@MovieApp:onboardingCompleted',
  STORAGE_VERSION: '@MovieApp:storageVersion',
  MIGRATION_STATUS: '@MovieApp:migrationStatus',
} as const;

const CURRENT_STORAGE_VERSION = '1.0.0';

export class StorageError extends Error {
  constructor(message: string, public operation: string, public key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export const setStorageItem = async <T>(
  key: string,
  value: T,
): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
    throw new StorageError(`Failed to save ${key}`, 'SET', key);
  }
};

export const getStorageItem = async <T>(
  key: string,
  defaultValue: T,
): Promise<T> => {
  try {
    const item = await AsyncStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return defaultValue;
  }
};

export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
    throw new StorageError(`Failed to remove ${key}`, 'REMOVE', key);
  }
};

export const getStorageVersion = async (): Promise<string | null> => {
  return await getStorageItem(STORAGE_KEYS.STORAGE_VERSION, null);
};

export const setStorageVersion = async (version: string): Promise<void> => {
  await setStorageItem(STORAGE_KEYS.STORAGE_VERSION, version);
};

export const migrateStorageIfNeeded = async (): Promise<boolean> => {
  try {
    const currentVersion = await getStorageVersion();

    if (!currentVersion) {
      await setStorageVersion(CURRENT_STORAGE_VERSION);
      return true;
    }

    if (currentVersion !== CURRENT_STORAGE_VERSION) {
      const migrated = await performStorageMigration(
        currentVersion,
        CURRENT_STORAGE_VERSION,
      );
      if (migrated) {
        await setStorageVersion(CURRENT_STORAGE_VERSION);
      }
      return migrated;
    }

    return true;
  } catch (error) {
    console.error('Error during storage migration:', error);
    return false;
  }
};

const performStorageMigration = async (
  fromVersion: string,
  toVersion: string,
): Promise<boolean> => {
  try {
    console.log(`Migrating storage from ${fromVersion} to ${toVersion}`);

    if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
      const oldFavorites = await AsyncStorage.getItem('@MovieApp:oldFavorites');
      if (oldFavorites) {
        const parsedFavorites = JSON.parse(oldFavorites);
        const newFavorites = parsedFavorites.map((item: any) => ({
          ...item,
          addedAt: item.dateAdded || new Date().toISOString(),
        }));
        await setStorageItem(STORAGE_KEYS.FAVORITES, newFavorites);
        await AsyncStorage.removeItem('@MovieApp:oldFavorites');
      }
    }

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

export const initializeStorage = async (): Promise<boolean> => {
  try {
    console.log('Initializing storage...');
    const migrationSuccess = await migrateStorageIfNeeded();
    if (!migrationSuccess) {
      console.warn('Storage migration failed, but continuing...');
    }
    return true;
  } catch (error) {
    console.error('Storage initialization failed:', error);
    return false;
  }
};

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  return await getStorageItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, []);
};

export const addToFavorites = async (
  item: FavoriteItem,
): Promise<FavoriteItem[]> => {
  try {
    const favorites = await getFavorites();

    const existingIndex = favorites.findIndex(
      fav => fav.id === item.id && fav.type === item.type,
    );

    if (existingIndex >= 0) {
      return favorites;
    }

    const updatedFavorites = [
      ...favorites,
      {...item, addedAt: new Date().toISOString()},
    ];

    await setStorageItem(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw new StorageError('Failed to add item to favorites', 'ADD_FAVORITE');
  }
};

export const removeFromFavorites = async (
  id: number,
  type: 'movie' | 'tv',
): Promise<FavoriteItem[]> => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(
      item => !(item.id === id && item.type === type),
    );

    await setStorageItem(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw new StorageError(
      'Failed to remove item from favorites',
      'REMOVE_FAVORITE',
    );
  }
};

export const toggleFavorite = async (
  item: FavoriteItem,
): Promise<FavoriteItem[]> => {
  try {
    const favorites = await getFavorites();
    const existingIndex = favorites.findIndex(
      fav => fav.id === item.id && fav.type === item.type,
    );

    let updatedFavorites: FavoriteItem[];

    if (existingIndex >= 0) {
      updatedFavorites = favorites.filter(
        (_, index) => index !== existingIndex,
      );
    } else {
      updatedFavorites = [
        ...favorites,
        {...item, addedAt: new Date().toISOString()},
      ];
    }

    await setStorageItem(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return await getFavorites();
  }
};

export const isFavorite = async (
  id: number,
  type: 'movie' | 'tv',
): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(item => item.id === id && item.type === type);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

export const addMultipleToFavorites = async (
  items: FavoriteItem[],
): Promise<FavoriteItem[]> => {
  try {
    const favorites = await getFavorites();
    const newItems = items.filter(
      item =>
        !favorites.some(fav => fav.id === item.id && fav.type === item.type),
    );

    const updatedFavorites = [
      ...favorites,
      ...newItems.map(item => ({...item, addedAt: new Date().toISOString()})),
    ];

    await setStorageItem(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error adding multiple favorites:', error);
    throw new StorageError(
      'Failed to add multiple items to favorites',
      'ADD_MULTIPLE_FAVORITES',
    );
  }
};

export const removeMultipleFromFavorites = async (
  items: Array<{id: number; type: 'movie' | 'tv'}>,
): Promise<FavoriteItem[]> => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(
      favorite =>
        !items.some(
          item => item.id === favorite.id && item.type === favorite.type,
        ),
    );

    await setStorageItem(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error removing multiple from favorites:', error);
    throw new StorageError(
      'Failed to remove multiple items from favorites',
      'REMOVE_MULTIPLE_FAVORITES',
    );
  }
};

export const clearAllFavorites = async (): Promise<void> => {
  try {
    await setStorageItem(STORAGE_KEYS.FAVORITES, []);
  } catch (error) {
    console.error('Error clearing all favorites:', error);
    throw new StorageError('Failed to clear all favorites', 'CLEAR_FAVORITES');
  }
};

export const getUserPreferences = async (): Promise<UserPreferences> => {
  const defaultPreferences: UserPreferences = {
    favoriteGenres: [],
    preferredLanguage: 'en',
    adultContent: false,
    sortMethod: 'popularity',
    theme: 'dark',
  };

  return await getStorageItem<UserPreferences>(
    STORAGE_KEYS.USER_PREFERENCES,
    defaultPreferences,
  );
};

export const updateUserPreferences = async (
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences> => {
  try {
    const currentPreferences = await getUserPreferences();
    const updatedPreferences = {...currentPreferences, ...preferences};
    await setStorageItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
    return updatedPreferences;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new StorageError(
      'Failed to update user preferences',
      'UPDATE_PREFERENCES',
    );
  }
};

export const resetUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const defaultPreferences: UserPreferences = {
      favoriteGenres: [],
      preferredLanguage: 'en',
      adultContent: false,
      sortMethod: 'popularity',
      theme: 'dark',
    };
    await setStorageItem(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
    return defaultPreferences;
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    throw new StorageError(
      'Failed to reset user preferences',
      'RESET_PREFERENCES',
    );
  }
};

export const getSearchHistory = async (): Promise<string[]> => {
  return await getStorageItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
};

export const addToSearchHistory = async (query: string): Promise<string[]> => {
  try {
    if (!query.trim()) {
      return await getSearchHistory();
    }

    const history = await getSearchHistory();
    const updatedHistory = [
      query.trim(),
      ...history.filter(item => item !== query.trim()),
    ].slice(0, 10);

    await setStorageItem(STORAGE_KEYS.SEARCH_HISTORY, updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error('Error adding to search history:', error);
    throw new StorageError(
      'Failed to add to search history',
      'ADD_SEARCH_HISTORY',
    );
  }
};

export const removeFromSearchHistory = async (
  query: string,
): Promise<string[]> => {
  try {
    const history = await getSearchHistory();
    const updatedHistory = history.filter(item => item !== query);
    await setStorageItem(STORAGE_KEYS.SEARCH_HISTORY, updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error('Error removing from search history:', error);
    throw new StorageError(
      'Failed to remove from search history',
      'REMOVE_SEARCH_HISTORY',
    );
  }
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    await removeStorageItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('Error clearing search history:', error);
    throw new StorageError(
      'Failed to clear search history',
      'CLEAR_SEARCH_HISTORY',
    );
  }
};

export const getOnboardingStatus = async (): Promise<boolean> => {
  return await getStorageItem<boolean>(
    STORAGE_KEYS.ONBOARDING_COMPLETED,
    false,
  );
};

export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await setStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  } catch (error) {
    console.error('Error setting onboarding completed:', error);
    throw new StorageError('Failed to set onboarding status', 'SET_ONBOARDING');
  }
};

export const getStorageUsage = async (): Promise<{
  favorites: number;
  searchHistory: number;
  totalItems: number;
  estimatedSize: string;
}> => {
  try {
    const favorites = await getFavorites();
    const searchHistory = await getSearchHistory();

    const totalItems = favorites.length + searchHistory.length;
    const estimatedSizeBytes = JSON.stringify({
      favorites,
      searchHistory,
    }).length;
    const estimatedSize =
      estimatedSizeBytes > 1024
        ? `${(estimatedSizeBytes / 1024).toFixed(2)} KB`
        : `${estimatedSizeBytes} bytes`;

    return {
      favorites: favorites.length,
      searchHistory: searchHistory.length,
      totalItems,
      estimatedSize,
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return {
      favorites: 0,
      searchHistory: 0,
      totalItems: 0,
      estimatedSize: '0 bytes',
    };
  }
};

export const validateStorageIntegrity = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const favorites = await getFavorites();
    favorites.forEach((fav, index) => {
      if (!fav.id || !fav.type || !fav.title) {
        errors.push(
          `Invalid favorite at index ${index}: missing required fields`,
        );
      }
      if (fav.type !== 'movie' && fav.type !== 'tv') {
        errors.push(
          `Invalid favorite at index ${index}: invalid type "${fav.type}"`,
        );
      }
      if (!fav.addedAt) {
        warnings.push(`Favorite at index ${index} missing addedAt timestamp`);
      }
    });

    const preferences = await getUserPreferences();
    if (!Array.isArray(preferences.favoriteGenres)) {
      errors.push('User preferences: favoriteGenres should be an array');
    }
    if (
      !['popularity', 'rating', 'release_date'].includes(preferences.sortMethod)
    ) {
      errors.push(
        `User preferences: invalid sortMethod "${preferences.sortMethod}"`,
      );
    }
    if (!['light', 'dark'].includes(preferences.theme)) {
      errors.push(`User preferences: invalid theme "${preferences.theme}"`);
    }

    const searchHistory = await getSearchHistory();
    if (!Array.isArray(searchHistory)) {
      errors.push('Search history should be an array');
    } else if (searchHistory.length > 10) {
      warnings.push(
        `Search history has ${searchHistory.length} items, should be limited to 10`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('Error validating storage integrity:', error);
    return {
      isValid: false,
      errors: ['Failed to validate storage integrity'],
      warnings: [],
    };
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.FAVORITES,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.SEARCH_HISTORY,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw new StorageError('Failed to clear all data', 'CLEAR_ALL');
  }
};

export const exportStorageData = async (): Promise<string> => {
  try {
    const favorites = await getFavorites();
    const preferences = await getUserPreferences();
    const searchHistory = await getSearchHistory();
    const onboardingCompleted = await getOnboardingStatus();
    const storageVersion = await getStorageVersion();

    const exportData = {
      version: storageVersion || CURRENT_STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        favorites,
        preferences,
        searchHistory,
        onboardingCompleted,
      },
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting storage data:', error);
    throw new StorageError('Failed to export storage data', 'EXPORT');
  }
};

export const importStorageData = async (
  exportedData: string,
): Promise<boolean> => {
  try {
    const importData = JSON.parse(exportedData);

    if (!importData.data || !importData.version) {
      throw new Error('Invalid import data format');
    }

    const {data} = importData;

    if (data.favorites && Array.isArray(data.favorites)) {
      await setStorageItem(STORAGE_KEYS.FAVORITES, data.favorites);
    }

    if (data.preferences && typeof data.preferences === 'object') {
      await setStorageItem(STORAGE_KEYS.USER_PREFERENCES, data.preferences);
    }

    if (data.searchHistory && Array.isArray(data.searchHistory)) {
      await setStorageItem(STORAGE_KEYS.SEARCH_HISTORY, data.searchHistory);
    }

    if (typeof data.onboardingCompleted === 'boolean') {
      await setStorageItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        data.onboardingCompleted,
      );
    }

    console.log('Storage data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing storage data:', error);
    throw new StorageError('Failed to import storage data', 'IMPORT');
  }
};
