import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, FavoriteItem} from '../types';
import {COLORS, LAYOUT, APP_CONFIG} from '../utils/config';
import {useFavorites} from '../hooks/useStorage';
import {
  Container,
  Input,
  Text,
  Button,
  MovieCard,
  Loading,
} from '../components';

type FavoritesNavigationProp = StackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - LAYOUT.spacing.lg * 3) / 2;
const LIST_CARD_WIDTH = width * 0.35;

type SortOption = 'dateAdded' | 'title' | 'rating' | 'releaseDate';
type ViewMode = 'grid' | 'list';

interface SortConfig {
  option: SortOption;
  ascending: boolean;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesNavigationProp>();
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    option: 'dateAdded',
    ascending: false,
  });

  const {
    favorites,
    loading: isLoading,
    removeFavorite,
    refresh,
  } = useFavorites();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    let result = [...favorites];

    if (searchQuery.trim()) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.option) {
        case 'dateAdded':
          comparison =
            new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = a.vote_average - b.vote_average;
          break;
        case 'releaseDate':
          const aDate = a.release_date || a.first_air_date || '1900-01-01';
          const bDate = b.release_date || b.first_air_date || '1900-01-01';
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
          break;
      }

      return sortConfig.ascending ? comparison : -comparison;
    });

    setFilteredFavorites(result);
  }, [favorites, searchQuery, sortConfig]);

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    Alert.alert('Remove Favorite', `Remove "${item.title}" from favorites?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await removeFavorite(item.id, item.type);
            if (!success) {
              Alert.alert('Error', 'Failed to remove favorite');
            }
          } catch (error) {
            console.error('Error removing favorite:', error);
            Alert.alert('Error', 'Failed to remove favorite');
          }
        },
      },
    ]);
  };

  const handleItemPress = (item: FavoriteItem) => {
    navigation.navigate('Details', {
      id: item.id,
      type: item.type,
    });
  };

  const handleSortChange = (option: SortOption) => {
    setSortConfig(prev => ({
      option,
      ascending: prev.option === option ? !prev.ascending : false,
    }));
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'));
  };

  const getSortLabel = (option: SortOption): string => {
    const labels = {
      dateAdded: 'Date Added',
      title: 'Title',
      rating: 'Rating',
      releaseDate: 'Release Date',
    };
    return labels[option];
  };

  const getItemYear = (item: FavoriteItem): string => {
    const date = item.release_date || item.first_air_date;
    if (!date) return '';
    return new Date(date).getFullYear().toString();
  };

  const renderGridItem = ({
    item,
    index,
  }: {
    item: FavoriteItem;
    index: number;
  }) => {
    const isLastItem = index === filteredFavorites.length - 1;
    const isOddCount = filteredFavorites.length % 2 === 1;
    const shouldSpanFullWidth = isLastItem && isOddCount;

    return (
      <View
        style={[
          styles.gridItemContainer,
          shouldSpanFullWidth && styles.gridItemFullWidth,
        ]}>
        <MovieCard
          id={item.id}
          title={item.title}
          posterPath={item.poster_path}
          rating={item.vote_average}
          isFavorite={true}
          mediaType={item.type}
          year={getItemYear(item)}
          onPress={() => handleItemPress(item)}
          onToggleFavorite={() => handleRemoveFavorite(item)}
          showRemoveButton={true}
          onRemove={() => handleRemoveFavorite(item)}
          width={
            shouldSpanFullWidth
              ? GRID_CARD_WIDTH * 2 + LAYOUT.spacing.xs * 2
              : GRID_CARD_WIDTH
          }
        />
      </View>
    );
  };

  const renderListItem = ({item}: {item: FavoriteItem}) => {
    const posterUrl = item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : null;

    return (
      <TouchableOpacity
        style={styles.listItemContainer}
        onPress={() => handleItemPress(item)}>
        <View style={styles.listItemContent}>
          <View style={styles.posterContainer}>
            {posterUrl ? (
              <Image
                source={{uri: posterUrl}}
                style={styles.posterImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <Text style={styles.posterPlaceholderText}>🎬</Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {item.type === 'movie' ? 'M' : 'TV'}
              </Text>
            </View>
          </View>
          <View style={styles.listItemInfo}>
            <Text
              variant="title"
              numberOfLines={2}
              style={styles.listItemTitle}>
              {item.title}
            </Text>
            <Text
              variant="caption"
              color="secondary"
              style={styles.listItemYear}>
              {getItemYear(item)} •{' '}
              {item.type === 'movie' ? 'Movie' : 'TV Show'}
            </Text>
            <View style={styles.listItemRating}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text variant="caption" color="secondary">
                {item.vote_average.toFixed(1)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={e => {
                e.stopPropagation();
                handleRemoveFavorite(item);
              }}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSortButton = (option: SortOption) => {
    const isActive = sortConfig.option === option;
    const label = getSortLabel(option);
    const arrow = isActive ? (sortConfig.ascending ? ' ↑' : ' ↓') : '';

    return (
      <TouchableOpacity
        key={option}
        style={[styles.sortButton, isActive && styles.sortButtonActive]}
        onPress={() => handleSortChange(option)}>
        <Text
          variant="caption"
          color={isActive ? 'text' : 'secondary'}
          style={[
            styles.sortButtonText,
            isActive && styles.sortButtonTextActive,
          ]}>
          {label}
          {arrow}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💔</Text>
      <Text variant="title" style={styles.emptyTitle}>
        No Favorites Yet
      </Text>
      <Text variant="body" color="secondary" style={styles.emptyText}>
        Start exploring and add movies & TV shows to your favorites!
      </Text>
      <Button
        title="Start Exploring"
        onPress={() => navigation.goBack()}
        variant="primary"
        style={styles.discoverButton}
      />
    </View>
  );

  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text variant="title" style={styles.emptyTitle}>
        No Matches Found
      </Text>
      <Text variant="body" color="secondary" style={styles.emptyText}>
        No favorites match your search "{searchQuery}"
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <Container safe={true}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <Loading message="Loading favorites..." />
      </Container>
    );
  }

  return (
    <Container safe={true} padding={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text variant="heading" style={styles.screenTitle}>
          Favorites
        </Text>
        <View style={styles.headerRight}>
          <Text variant="body" color="secondary" style={styles.favoritesCount}>
            {favorites.length}
          </Text>
          <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggle}>
            <Text style={styles.viewToggleText}>
              {viewMode === 'grid' ? '☰' : '⊞'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {favorites.length > 0 && (
        <>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search your favorites..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.sortContainer}>
            <Text variant="caption" color="secondary" style={styles.sortLabel}>
              Sort by:
            </Text>
            <View style={styles.sortButtons}>
              {(
                ['dateAdded', 'title', 'rating', 'releaseDate'] as SortOption[]
              ).map(renderSortButton)}
            </View>
          </View>
        </>
      )}

      {favorites.length === 0 ? (
        renderEmptyState()
      ) : filteredFavorites.length === 0 ? (
        renderSearchEmptyState()
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          key={viewMode}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer,
          ]}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoritesCount: {
    marginRight: LAYOUT.spacing.md,
  },
  viewToggle: {
    padding: LAYOUT.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  viewToggleText: {
    fontSize: 18,
    color: COLORS.primary,
  },
  searchContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  searchInput: {
    fontSize: 16,
  },
  sortContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  sortLabel: {
    marginBottom: LAYOUT.spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LAYOUT.spacing.xs,
  },
  sortButton: {
    paddingVertical: LAYOUT.spacing.xs,
    paddingHorizontal: LAYOUT.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 12,
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingBottom: LAYOUT.spacing.xl,
  },
  gridContainer: {
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  gridItemContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.xs,
  },
  gridItemFullWidth: {
    flex: 2,
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.xs,
  },
  listItemContainer: {
    marginBottom: LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.md,
  },
  listItemContent: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    alignItems: 'flex-start',
  },
  listItemInfo: {
    flex: 1,
    marginLeft: LAYOUT.spacing.md,
    justifyContent: 'space-between',
    minHeight: LIST_CARD_WIDTH * 1.5, // Maintain aspect ratio with poster
  },
  listItemTitle: {
    marginBottom: LAYOUT.spacing.xs,
    fontWeight: '600',
  },
  listItemYear: {
    marginBottom: LAYOUT.spacing.xs,
  },
  listItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.sm,
  },
  ratingIcon: {
    fontSize: 12,
    marginRight: LAYOUT.spacing.xs,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: LAYOUT.spacing.lg,
  },
  emptyTitle: {
    marginBottom: LAYOUT.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.xl,
    lineHeight: 22,
  },
  discoverButton: {
    paddingHorizontal: LAYOUT.spacing.xl,
  },
  posterContainer: {
    width: LIST_CARD_WIDTH,
    height: LIST_CARD_WIDTH * 1.5,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: {
    fontSize: 24,
    color: COLORS.secondary,
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: LAYOUT.spacing.xs,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
});
