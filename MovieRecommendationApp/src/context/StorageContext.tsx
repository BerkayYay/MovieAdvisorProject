import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {Alert} from 'react-native';
import {
  initializeStorage,
  validateStorageIntegrity,
  getStorageUsage,
  StorageError,
} from '../utils/storage';
import {useStorageStates} from '../hooks/useStorage';

interface StorageContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  storageHealth: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  storageUsage: {
    favorites: number;
    searchHistory: number;
    totalItems: number;
    estimatedSize: string;
  } | null;
  favorites: ReturnType<typeof useStorageStates>['favorites'];
  preferences: ReturnType<typeof useStorageStates>['preferences'];
  searchHistory: ReturnType<typeof useStorageStates>['searchHistory'];
  refreshStorage: () => Promise<void>;
  validateStorage: () => Promise<void>;
  checkStorageUsage: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({children}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageHealth, setStorageHealth] =
    useState<StorageContextType['storageHealth']>(null);
  const [storageUsage, setStorageUsage] =
    useState<StorageContextType['storageUsage']>(null);

  const storageStates = useStorageStates();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const initSuccess = await initializeStorage();
      if (!initSuccess) {
        throw new Error('Storage initialization failed');
      }

      const health = await validateStorageIntegrity();
      setStorageHealth(health);

      if (!health.isValid) {
        console.warn('Storage integrity issues found:', health.errors);
      }

      const usage = await getStorageUsage();
      setStorageUsage(usage);

      setIsInitialized(true);
    } catch (err) {
      console.error('Storage initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown storage error');

      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStorage = async () => {
    try {
      await storageStates.refreshAll();
      await checkStorageUsage();
    } catch (err) {
      console.error('Error refreshing storage:', err);
      if (err instanceof StorageError) {
        setError(`Storage refresh failed: ${err.message}`);
      }
    }
  };

  const validateStorage = async () => {
    try {
      const health = await validateStorageIntegrity();
      setStorageHealth(health);

      if (!health.isValid && health.errors.length > 0) {
        Alert.alert(
          'Storage Issues Detected',
          `Found ${health.errors.length} error(s) in storage data. The app may not function correctly.`,
          [{text: 'OK'}],
        );
      }
    } catch (err) {
      console.error('Error validating storage:', err);
      setError('Storage validation failed');
    }
  };

  const checkStorageUsage = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.error('Error checking storage usage:', err);
    }
  };

  const contextValue: StorageContextType = {
    isInitialized,
    isLoading,
    error,
    storageHealth,
    storageUsage,
    favorites: storageStates.favorites,
    preferences: storageStates.preferences,
    searchHistory: storageStates.searchHistory,
    refreshStorage,
    validateStorage,
    checkStorageUsage,
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
