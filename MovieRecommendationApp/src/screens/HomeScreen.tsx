import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {StackNavigationProp} from '@react-navigation/stack';
import {MainTabParamList, RootStackParamList, FavoriteItem} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {getFavorites, toggleFavorite} from '../utils/storage';
import {MovieCard, CategoryHeader} from '../components';
import {Container, Loading, Text, Button} from '../components';
import {useComponentTracker, useSafeAsync} from '../utils/memoryLeak';
import {useSimpleRecommendations} from '../hooks/useSimpleRecommendations';
import {ContentItem, SimpleCategory} from '../utils/simpleRecommendations';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const {width} = Dimensions.get('window');
const POSTER_WIDTH = width * 0.32;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {safeAsync} = useSafeAsync();
  useComponentTracker('HomeScreen');

  const {categories, hasPreferences, loading, error, refresh, reload} =
    useSimpleRecommendations();

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await safeAsync(() => getFavorites());
        if (storedFavorites) {
          setFavorites(storedFavorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    loadFavorites();
  }, [safeAsync]);

  useFocusEffect(
    useCallback(() => {
      const timeoutId = setTimeout(() => {
        refresh();
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      const storedFavorites = await safeAsync(() => getFavorites());
      if (storedFavorites) {
        setFavorites(storedFavorites);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, safeAsync]);

  const handleItemPress = useCallback(
    (item: ContentItem) => {
      let mediaType: 'movie' | 'tv' = 'movie';
      if ('title' in item) {
        mediaType = 'movie';
      } else if ('name' in item) {
        mediaType = 'tv';
      }

      navigation.navigate('Details', {
        id: item.id,
        type: mediaType,
      });
    },
    [navigation],
  );

  const handleToggleFavorite = useCallback(async (item: ContentItem) => {
    try {
      let mediaType: 'movie' | 'tv' = 'movie';
      let title = 'Unknown Title';
      let releaseDate: string | undefined;

      if ('title' in item) {
        mediaType = 'movie';
        title = item.title;
        releaseDate = item.release_date;
      } else if ('name' in item) {
        mediaType = 'tv';
        title = item.name;
        releaseDate = item.first_air_date;
      }

      const favoriteItem: FavoriteItem = {
        id: item.id,
        type: mediaType,
        title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        addedAt: new Date().toISOString(),
        release_date: mediaType === 'movie' ? releaseDate : undefined,
        first_air_date: mediaType === 'tv' ? releaseDate : undefined,
      };

      const updatedFavorites = await toggleFavorite(favoriteItem);
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  }, []);

  const isFavorite = useCallback(
    (itemId: number): boolean => {
      return favorites.some(fav => fav.id === itemId);
    },
    [favorites],
  );

  const handleSeeAll = useCallback(
    (category: SimpleCategory) => {
      navigation.navigate('CategoryContent', {
        categoryTitle: category.title,
        categorySubtitle: category.subtitle,
        categoryData: category.data,
        isPersonalized: category.id === 'for-you',
      });
    },
    [navigation],
  );

  const handleSetupPreferences = useCallback(() => {
    navigation.navigate('GenrePreferences', {source: 'settings'});
  }, [navigation]);

  const renderContentItem = useCallback(
    ({item}: {item: ContentItem}) => {
      let title = 'Unknown Title';
      let year: string | undefined;
      let mediaType: 'movie' | 'tv' = 'movie';

      if ('title' in item) {
        title = item.title;
        year = item.release_date;
        mediaType = 'movie';
      } else if ('name' in item) {
        title = item.name;
        year = item.first_air_date;
        mediaType = 'tv';
      }

      const displayYear = year
        ? new Date(year).getFullYear().toString()
        : undefined;
      const isFav = isFavorite(item.id);

      return (
        <MovieCard
          id={item.id}
          title={title}
          posterPath={item.poster_path}
          rating={item.vote_average}
          mediaType={mediaType}
          year={displayYear}
          isFavorite={isFav}
          onPress={() => handleItemPress(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          width={POSTER_WIDTH}
        />
      );
    },
    [isFavorite, handleItemPress, handleToggleFavorite],
  );

  const renderCategory = useCallback(
    (category: SimpleCategory) => (
      <View key={category.id} style={styles.categoryContainer}>
        <CategoryHeader
          title={category.title}
          subtitle={category.subtitle}
          onSeeAll={() => handleSeeAll(category)}
          showSeeAll={true}
          isPersonalized={category.id === 'for-you'}
        />
        <FlatList
          data={category.data}
          keyExtractor={(item, index) => `${category.id}-${item.id}-${index}`}
          renderItem={renderContentItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          getItemLayout={(data, index) => ({
            length: POSTER_WIDTH + LAYOUT.spacing.sm,
            offset: (POSTER_WIDTH + LAYOUT.spacing.sm) * index,
            index,
          })}
        />
      </View>
    ),
    [handleSeeAll, renderContentItem],
  );

  const renderPreferencesPrompt = useCallback(
    () => (
      <View style={styles.preferencesPrompt}>
        <Text variant="heading" style={styles.promptTitle}>
          Get Personalized Recommendations
        </Text>
        <Text variant="body" style={styles.promptDescription}>
          Set up your genre preferences to see content tailored just for you.
        </Text>
        <Button
          title="Set Up Preferences"
          onPress={handleSetupPreferences}
          variant="primary"
          style={styles.setupButton}
        />
      </View>
    ),
    [handleSetupPreferences],
  );

  if (loading) {
    return (
      <Container>
        <Loading message="Loading movies..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <View style={styles.errorContainer}>
          <Text variant="heading" style={styles.errorText}>
            Oops! Something went wrong
          </Text>
          <Text variant="body" style={styles.errorDescription}>
            {error}
          </Text>
          <Button
            title="Try Again"
            onPress={reload}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
      </Container>
    );
  }

  return (
    <Container safe={true} padding={false}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!hasPreferences && renderPreferencesPrompt()}
          {categories.map(renderCategory)}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingVertical: LAYOUT.spacing.lg,
  },
  categoryContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  categoryList: {
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  itemSeparator: {
    width: LAYOUT.spacing.sm,
  },
  preferencesPrompt: {
    backgroundColor: COLORS.surface,
    margin: LAYOUT.spacing.lg,
    padding: LAYOUT.spacing.lg,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xl,
  },
  promptTitle: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.sm,
    color: COLORS.text,
  },
  promptDescription: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.lg,
    color: COLORS.textSecondary,
  },
  setupButton: {
    minWidth: 200,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: LAYOUT.spacing.xl,
    flex: 1,
  },
  errorText: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.md,
  },
  errorDescription: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.lg,
  },
  retryButton: {
    minWidth: 150,
  },
});
