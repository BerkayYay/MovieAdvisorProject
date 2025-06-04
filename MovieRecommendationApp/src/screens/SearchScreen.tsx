import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {COLORS, LAYOUT, APP_CONFIG} from '../utils/config';
import {tmdbService} from '../services';
import {
  transformTMDbResponse,
  transformTMDbMovie,
  transformTMDbTVShow,
} from '../utils/dataTransformers';
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  getFavorites,
  toggleFavorite,
} from '../utils/storage';
import {getGenrePreferences} from '../utils/genreStorage';
import {scoreContent} from '../utils/simpleRecommendations';
import {FavoriteItem} from '../types';
import {Container, Input, Text, MovieCard} from '../components';
import {GenreFilterChips} from '../components/movie';
import {
  useSafeTimeout,
  useComponentTracker,
  useSafeAsync,
} from '../utils/memoryLeak';

type SearchNavigationProp = StackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.28;

interface SearchItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
}

export default function SearchScreen() {
  const navigation = useNavigation<SearchNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [showGenreFilters, setShowGenreFilters] = useState(false);
  const [selectedGenreFilters, setSelectedGenreFilters] = useState<number[]>(
    [],
  );
  const [userPreferences, setUserPreferences] = useState<number[]>([]);

  const [searchCache, setSearchCache] = useState<Map<string, SearchItem[]>>(
    new Map(),
  );

  const {safeSetTimeout} = useSafeTimeout();
  const {safeAsync} = useSafeAsync();
  useComponentTracker('SearchScreen');

  useFocusEffect(
    useCallback(() => {
      loadSearchHistory();
      loadFavorites();
      loadUserPreferences();
    }, []),
  );

  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const preferences = await getGenrePreferences();
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowHistory(true);
      setIsSearching(false);
    } else {
      setShowHistory(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setSearchResults([]);

    try {
      const cacheKey = `${query.toLowerCase()}_${selectedGenreFilters
        .sort()
        .join(',')}`;

      if (searchCache.has(cacheKey)) {
        const cachedResults = searchCache.get(cacheKey)!;
        setSearchResults(cachedResults);

        if (query.trim().length >= 3) {
          await addToSearchHistory(query.trim());
          await loadSearchHistory();
        }
        return;
      }

      if (!tmdbService.isConfigured()) {
        throw new Error(
          'Movie database is not available. Please check your internet connection and try again.',
        );
      }

      const searchResponse = await tmdbService.search.searchMulti(query, 1);

      let results: SearchItem[] = [];

      if (searchResponse.results && searchResponse.results.length > 0) {
        results = searchResponse.results
          .filter(
            (item: any) =>
              item.media_type === 'movie' || item.media_type === 'tv',
          )
          .map((item: any) => {
            if (item.media_type === 'movie') {
              const transformedMovie = transformTMDbMovie(item);
              return {
                ...transformedMovie,
                media_type: 'movie' as const,
              };
            } else {
              const transformedTV = transformTMDbTVShow(item);
              return {
                ...transformedTV,
                media_type: 'tv' as const,
                title: transformedTV.name,
              };
            }
          })
          .slice(0, 20);
      }

      if (selectedGenreFilters.length > 0) {
        results = results.filter(item =>
          item.genre_ids.some(genreId =>
            selectedGenreFilters.includes(genreId),
          ),
        );
      }

      if (userPreferences.length > 0) {
        results = results
          .map(item => ({
            item,
            score: scoreContent(item as any, userPreferences),
          }))
          .sort((a, b) => b.score - a.score)
          .map(({item}) => item);
      } else {
        results = results.sort((a, b) => {
          const scoreA = a.popularity * 0.3 + a.vote_average * 0.7;
          const scoreB = b.popularity * 0.3 + b.vote_average * 0.7;
          return scoreB - scoreA;
        });
      }

      setSearchCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, results);

        if (newCache.size > 10) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) {
            newCache.delete(firstKey);
          }
        }

        return newCache;
      });

      setSearchResults(results as SearchItem[]);

      if (query.trim().length >= 3) {
        await addToSearchHistory(query.trim());
        await loadSearchHistory();
      }
    } catch (error) {
      console.error('Error performing search:', error);

      let errorTitle = 'Search Error';
      let errorMessage =
        'Something went wrong while searching. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          errorTitle = 'Service Unavailable';
          errorMessage =
            'Movie database is currently unavailable. Please check your internet connection and try again.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('timeout')
        ) {
          errorTitle = 'Connection Error';
          errorMessage =
            'Unable to connect to the movie database. Please check your internet connection and try again.';
        } else if (error.message.includes('rate limit')) {
          errorTitle = 'Too Many Requests';
          errorMessage =
            "We've received too many requests. Please wait a moment and try again.";
        }
      }

      Alert.alert(errorTitle, errorMessage, [
        {text: 'OK'},
        {text: 'Retry', onPress: () => performSearch(query)},
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 3) {
      performSearch(trimmedQuery);
      Keyboard.dismiss();
    } else if (trimmedQuery.length > 0) {
      Alert.alert(
        'Search Query Too Short',
        'Please enter at least 3 characters to search.',
        [{text: 'OK'}],
      );
    }
  };

  const handleManualSearch = () => {
    handleSearchSubmit();
  };

  const handleHistoryItemPress = (historyItem: string) => {
    setSearchQuery(historyItem);
    setShowHistory(false);
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear your search history?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSearchHistory();
            setSearchHistory([]);
          },
        },
      ],
    );
  };

  const handleItemPress = (item: SearchItem) => {
    navigation.navigate('Details', {
      id: item.id,
      type: item.media_type,
    });
  };

  const handleToggleFavorite = async (item: SearchItem) => {
    try {
      const title = item.title || item.name || 'Unknown Title';
      const releaseDate = item.release_date || item.first_air_date;

      const favoriteItem: FavoriteItem = {
        id: item.id,
        type: item.media_type,
        title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: releaseDate,
        addedAt: new Date().toISOString(),
      };

      await toggleFavorite(favoriteItem);
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const isFavorite = (itemId: number): boolean => {
    return favorites.some(fav => fav.id === itemId);
  };

  const handleToggleGenreFilter = (genreId: number) => {
    setSelectedGenreFilters(prev => {
      const newFilters = prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId];

      setSearchCache(new Map());

      return newFilters;
    });
  };

  const handleClearGenreFilters = () => {
    setSelectedGenreFilters([]);

    setSearchCache(new Map());
  };

  const handleToggleGenreFiltersVisibility = () => {
    setShowGenreFilters(prev => !prev);
  };

  const renderSearchResult = ({item}: {item: SearchItem}) => {
    const title = item.title || item.name || 'Unknown Title';
    const year =
      item.release_date?.split('-')[0] ||
      item.first_air_date?.split('-')[0] ||
      '';

    return (
      <View style={styles.resultItemContainer}>
        <MovieCard
          id={item.id}
          title={title}
          posterPath={item.poster_path}
          rating={item.vote_average}
          isFavorite={isFavorite(item.id)}
          mediaType={item.media_type}
          year={year}
          onPress={() => handleItemPress(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          width={CARD_WIDTH}
        />
      </View>
    );
  };

  const renderHistoryItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item)}>
      <Text variant="body" style={styles.historyIcon}>
        🔍
      </Text>
      <Text variant="body" style={styles.historyText}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (
      searchQuery.trim().length > 0 &&
      searchResults.length === 0 &&
      !isSearching
    ) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text variant="title" style={styles.emptyStateTitle}>
            Ready to Search
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyStateText}>
            {searchQuery.trim().length < 3
              ? 'Type at least 3 characters, then tap the search button'
              : 'Tap the search button or press Enter to find movies and TV shows'}
          </Text>
        </View>
      );
    }

    if (searchQuery && !isSearching && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text variant="title" style={styles.emptyStateTitle}>
            No Results Found
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyStateText}>
            Try searching for different keywords or check your spelling
          </Text>
          {selectedGenreFilters.length > 0 && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleClearGenreFilters}
              testID="clear-filters-empty-state">
              <Text
                variant="body"
                color="primary"
                style={styles.emptyStateButtonText}>
                Clear Genre Filters ({selectedGenreFilters.length})
              </Text>
            </TouchableOpacity>
          )}
          {userPreferences.length >= 3 && selectedGenreFilters.length === 0 && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => {
                setSelectedGenreFilters(userPreferences.slice(0, 3));
                setShowGenreFilters(true);
                setTimeout(() => performSearch(searchQuery), 0);
              }}
              testID="use-preferences-empty-state">
              <Text
                variant="body"
                color="primary"
                style={styles.emptyStateButtonText}>
                Try Your Favorite Genres
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (!searchQuery && showHistory) {
      return (
        <View style={styles.welcomeState}>
          <Text style={styles.welcomeIcon}>🎬</Text>
          <Text variant="title" style={styles.welcomeTitle}>
            Discover Movies & TV Shows
          </Text>
          <Text variant="body" color="secondary" style={styles.welcomeText}>
            Search through thousands of movies and TV shows to find your next
            favorite
          </Text>
          {userPreferences.length >= 3 && (
            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={() => {
                setSelectedGenreFilters(userPreferences.slice(0, 3));
                setShowGenreFilters(true);
              }}
              testID="explore-preferences-welcome">
              <Text
                variant="body"
                color="primary"
                style={styles.welcomeButtonText}>
                🎭 Explore Your Favorite Genres
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Container safe={true} padding={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text variant="heading" style={styles.screenTitle}>
          Search
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholder="Enter search terms..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
            containerStyle={styles.searchInputWrapper}
            textAlignVertical="center"
            selectionColor={COLORS.primary}
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              searchQuery.trim().length < 3 && styles.searchButtonDisabled,
            ]}
            onPress={handleManualSearch}
            disabled={searchQuery.trim().length < 3}
            testID="manual-search-button">
            <Text
              style={[
                styles.searchButtonText,
                searchQuery.trim().length < 3 &&
                  styles.searchButtonTextDisabled,
              ]}>
              🔍
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={handleToggleGenreFiltersVisibility}
          testID="toggle-genre-filters">
          <Text variant="body" style={styles.filterToggleText}>
            🎭 Filter by Genres
            {selectedGenreFilters.length > 0 &&
              ` (${selectedGenreFilters.length})`}
          </Text>
          <Text style={styles.filterToggleIcon}>
            {showGenreFilters ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {showGenreFilters && (
        <View style={styles.genreFiltersContainer}>
          <GenreFilterChips
            selectedGenres={selectedGenreFilters}
            onGenreToggle={handleToggleGenreFilter}
            onClearAll={handleClearGenreFilters}
            maxVisible={8}
            showAllGenres={false}
          />
        </View>
      )}

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text variant="body" style={styles.loadingText}>
            Searching movies and TV shows...
          </Text>
        </View>
      )}

      {showHistory && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text variant="body" style={styles.historyTitle}>
              Recent Searches
            </Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text
                variant="body"
                color="primary"
                style={styles.clearHistoryText}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `history-${index}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {(searchResults.length > 0 || (!searchQuery && !showHistory)) && (
        <View style={styles.resultsContainer}>
          {searchResults.length > 0 && (
            <Text
              variant="caption"
              color="secondary"
              style={styles.resultsCount}>
              {searchResults.length} result
              {searchResults.length !== 1 ? 's' : ''} found
            </Text>
          )}
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => `${item.media_type}-${item.id}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={renderEmptyState}
            numColumns={3}
            columnWrapperStyle={
              searchResults.length > 0 ? styles.row : undefined
            }
          />
        </View>
      )}

      {showHistory && searchHistory.length === 0 && renderEmptyState()}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInputWrapper: {
    marginBottom: 0,
    flex: 1,
  },
  searchButton: {
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    marginLeft: LAYOUT.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  searchButtonText: {
    fontSize: 18,
    color: COLORS.white,
  },
  searchButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  historyContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.sm,
  },
  historyTitle: {
    fontWeight: '600',
  },
  clearHistoryText: {
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.xs,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  historyIcon: {
    marginRight: LAYOUT.spacing.sm,
  },
  historyText: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  resultsCount: {
    marginBottom: LAYOUT.spacing.md,
  },
  resultsList: {
    paddingBottom: LAYOUT.spacing.xl,
  },
  resultItemContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.md,
  },
  row: {
    justifyContent: 'space-around',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: LAYOUT.spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: LAYOUT.spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  welcomeState: {
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.xl * 2,
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: LAYOUT.spacing.lg,
  },
  welcomeTitle: {
    marginBottom: LAYOUT.spacing.md,
    textAlign: 'center',
  },
  welcomeText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LAYOUT.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  filterToggleText: {
    flex: 1,
  },
  filterToggleIcon: {
    marginLeft: LAYOUT.spacing.sm,
  },
  genreFiltersContainer: {
    padding: LAYOUT.spacing.lg,
  },
  emptyStateButton: {
    padding: LAYOUT.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
    marginTop: LAYOUT.spacing.md,
  },
  emptyStateButtonText: {
    fontWeight: '600',
  },
  welcomeButton: {
    padding: LAYOUT.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
    marginTop: LAYOUT.spacing.md,
  },
  welcomeButtonText: {
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
  },
  loadingText: {
    marginLeft: LAYOUT.spacing.sm,
  },
});
