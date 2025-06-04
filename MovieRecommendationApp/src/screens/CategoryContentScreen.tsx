import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Movie, TVShow, FavoriteItem} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {getFavorites, toggleFavorite} from '../utils/storage';
import {Container, Text, MovieCard, Input} from '../components';
import {useComponentTracker, useSafeAsync} from '../utils/memoryLeak';

type CategoryContentScreenRouteProp = RouteProp<
  RootStackParamList,
  'CategoryContent'
>;
type CategoryContentNavigationProp = StackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

type ContentItem = Movie | TVShow;

export default function CategoryContentScreen() {
  const navigation = useNavigation<CategoryContentNavigationProp>();
  const route = useRoute<CategoryContentScreenRouteProp>();
  const {categoryTitle, categorySubtitle, categoryData, isPersonalized} =
    route.params;

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<ContentItem[]>(categoryData);

  const {safeAsync} = useSafeAsync();
  useComponentTracker('CategoryContentScreen');

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, categoryData]);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredData(categoryData);
      return;
    }

    const filtered = categoryData.filter(item => {
      const title = 'title' in item ? item.title : item.name;
      return (
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.overview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  const handleItemPress = (item: ContentItem) => {
    const mediaType = 'title' in item ? 'movie' : 'tv';
    navigation.navigate('Details', {
      id: item.id,
      type: mediaType,
    });
  };

  const handleToggleFavorite = async (item: ContentItem) => {
    try {
      const mediaType = 'title' in item ? 'movie' : 'tv';
      const title = 'title' in item ? item.title : item.name;
      const releaseDate =
        'release_date' in item ? item.release_date : item.first_air_date;

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

  const renderContentItem = ({item}: {item: ContentItem}) => {
    const title = 'title' in item ? item.title : item.name;
    const mediaType = 'title' in item ? 'movie' : 'tv';
    const releaseDate =
      'release_date' in item ? item.release_date : item.first_air_date;
    const year = releaseDate?.split('-')[0] || '';

    return (
      <View style={styles.contentItemContainer}>
        <MovieCard
          id={item.id}
          title={title}
          posterPath={item.poster_path}
          rating={item.vote_average}
          isFavorite={isFavorite(item.id)}
          mediaType={mediaType}
          year={year}
          onPress={() => handleItemPress(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          width={CARD_WIDTH}
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text variant="title" style={styles.emptyStateTitle}>
        No Content Found
      </Text>
      <Text variant="body" color="secondary" style={styles.emptyStateText}>
        {searchQuery
          ? `No content matches "${searchQuery}"`
          : 'This category is currently empty'}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}>
          <Text variant="body" color="primary" style={styles.clearSearchText}>
            Clear Search
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Container safe={true} padding={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="heading" style={styles.screenTitle}>
            {categoryTitle}
            {isPersonalized && <Text style={styles.personalizedIcon}> ✨</Text>}
          </Text>
          {categorySubtitle && (
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {categorySubtitle}
            </Text>
          )}
        </View>
        <Text variant="body" color="secondary" style={styles.countText}>
          {filteredData.length} item{filteredData.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {categoryData.length > 5 && (
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search in this category..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      )}

      <FlatList
        data={filteredData}
        renderItem={renderContentItem}
        keyExtractor={item => `${item.id}-${'title' in item ? 'movie' : 'tv'}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: LAYOUT.spacing.md,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  personalizedIcon: {
    color: COLORS.primary,
  },
  subtitle: {
    marginTop: LAYOUT.spacing.xs,
    lineHeight: 18,
  },
  countText: {
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  searchInput: {
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingBottom: LAYOUT.spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  contentItemContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.xs,
  },
  itemSeparator: {
    height: LAYOUT.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.xl * 2,
    paddingHorizontal: LAYOUT.spacing.lg,
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
    lineHeight: 22,
  },
  clearSearchButton: {
    marginTop: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  clearSearchText: {
    fontWeight: '600',
  },
});
