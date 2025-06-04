import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, FavoriteItem} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {useFavorites} from '../hooks/useStorage';
import {tmdbService, omdbService} from '../services';
import {
  transformTMDbMovieDetails,
  transformTMDbTVDetails,
  transformTMDbMovie,
  transformTMDbTVShow,
} from '../utils/dataTransformers';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const POSTER_WIDTH = screenWidth * 0.35;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

type DetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Details'
>;
type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

interface Props {
  navigation: DetailsScreenNavigationProp;
  route: DetailsScreenRouteProp;
}

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult?: boolean;
  runtime?: number;
  budget?: number;
  revenue?: number;
  imdb_id?: string;
  homepage?: string;
  tagline?: string;
  production_companies?: any[];
  genres?: {id: number; name: string}[];
}

const DetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const {type, id} = route.params;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [similarContent, setSimilarContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);

  const {isFavorite: checkIsFavorite, toggleFavorite: toggleFavoriteInStorage} =
    useFavorites();

  useEffect(() => {
    loadContentDetails();
  }, [id, type]);

  const loadContentDetails = async () => {
    try {
      setLoading(true);

      if (!tmdbService.isConfigured()) {
        throw new Error(
          'TMDb API is not configured. Please check your API keys.',
        );
      }

      let foundContent;
      if (type === 'movie') {
        const movieDetails = await tmdbService.movies.getDetails(id);

        let omdbData: any = undefined;
        if (omdbService.isConfigured() && movieDetails.imdb_id) {
          try {
            omdbData = await omdbService.getByImdbId(movieDetails.imdb_id);
          } catch (omdbError) {
            console.warn('OMDb data not available:', omdbError);
          }
        }

        foundContent = transformTMDbMovieDetails(movieDetails, omdbData);
      } else {
        const tvDetails = await tmdbService.tv.getDetails(id);
        foundContent = transformTMDbTVDetails(tvDetails);
      }

      if (foundContent) {
        setContent(foundContent);
        loadSimilarContent(foundContent);
      } else {
        Alert.alert('Error', 'Content not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert(
        'Error',
        'Failed to load content details. Please check your internet connection.',
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarContent = async (currentContent: ContentItem) => {
    try {
      setSimilarLoading(true);
      let similar: ContentItem[] = [];

      if (type === 'movie') {
        if (currentContent.genre_ids && currentContent.genre_ids.length > 0) {
          const genreString = currentContent.genre_ids.join(',');
          const discoverResponse = await tmdbService.movies.discover({
            genre: genreString,
            page: 1,
            sort_by: 'popularity.desc',
          });

          const similarMovies = (discoverResponse.results || [])
            .filter((movie: any) => movie.id !== currentContent.id)
            .map((movie: any) => transformTMDbMovie(movie))
            .slice(0, 6);

          similar = similarMovies;
        }
      } else {
        if (currentContent.genre_ids && currentContent.genre_ids.length > 0) {
          const genreString = currentContent.genre_ids.join(',');
          const discoverResponse = await tmdbService.tv.discover({
            genre: genreString,
            page: 1,
            sort_by: 'popularity.desc',
          });

          const similarTVShows = (discoverResponse.results || [])
            .filter((tvShow: any) => tvShow.id !== currentContent.id)
            .map((tvShow: any) => transformTMDbTVShow(tvShow))
            .slice(0, 6);

          similar = similarTVShows;
        }
      }

      setSimilarContent(similar);
    } catch (error) {
      console.error('Error loading similar content:', error);
      setSimilarContent([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!content) return;

    try {
      const favoriteItem: FavoriteItem = {
        id: content.id,
        type,
        title: content.title || content.name || 'Unknown Title',
        poster_path: content.poster_path,
        vote_average: content.vote_average,
        release_date: content.release_date,
        first_air_date: content.first_air_date,
        addedAt: new Date().toISOString(),
      };

      const success = await toggleFavoriteInStorage(favoriteItem);
      if (!success) {
        Alert.alert('Error', 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const getGenreNames = (genreIds: number[]) => {
    if (content?.genres) {
      return content.genres.map(
        (genre: {id: number; name: string}) => genre.name,
      );
    }

    return [];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatRating = (rating: number) => {
    return `${rating.toFixed(1)} ⭐`;
  };

  const navigateToDetails = (item: ContentItem) => {
    navigation.push('Details', {
      type: type,
      id: item.id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Content not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = content.title || content.name;
  const releaseDate = content.release_date || content.first_air_date;
  const genreNames = getGenreNames(content.genre_ids);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.backdropContainer}>
          {content.backdrop_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w780${content.backdrop_path}`,
              }}
              style={styles.backdropImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.backdropImage, {backgroundColor: COLORS.surface}]}
            />
          )}
          <View style={styles.backdropOverlay} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.mainInfoContainer}>
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w342${content.poster_path}`,
              }}
              style={styles.posterImage}
              resizeMode="cover"
            />

            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>

              <View style={styles.metadataContainer}>
                <Text style={styles.releaseDate}>
                  {releaseDate
                    ? formatDate(releaseDate)
                    : 'Release date unknown'}
                </Text>
                <Text style={styles.language}>
                  {content.original_language?.toUpperCase() || 'Unknown'}
                </Text>
              </View>

              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>
                  {formatRating(content.vote_average)}
                </Text>
                <Text style={styles.voteCount}>
                  ({content.vote_count.toLocaleString()} votes)
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  checkIsFavorite(content.id, type) &&
                    styles.favoriteButtonActive,
                ]}
                onPress={handleToggleFavorite}>
                <Text style={styles.favoriteButtonText}>
                  {checkIsFavorite(content.id, type)
                    ? '❤️ Remove from Favorites'
                    : '🤍 Add to Favorites'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {genreNames.length > 0 && (
            <View style={styles.genresContainer}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genreTags}>
                {genreNames.map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreTagText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.overviewContainer}>
            <Text style={styles.sectionTitle}>
              {type === 'movie' ? 'Plot' : 'Synopsis'}
            </Text>
            <Text style={styles.overview}>
              {content.overview || 'No overview available.'}
            </Text>
          </View>

          <View style={styles.additionalInfoContainer}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {type === 'movie' ? 'Movie' : 'TV Show'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Popularity:</Text>
              <Text style={styles.infoValue}>
                {content.popularity.toLocaleString()}
              </Text>
            </View>
            {content.adult !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rating:</Text>
                <Text style={styles.infoValue}>
                  {content.adult ? '18+' : 'All Ages'}
                </Text>
              </View>
            )}
          </View>

          {(similarContent.length > 0 || similarLoading) && (
            <View style={styles.similarContainer}>
              <Text style={styles.sectionTitle}>
                Similar {type === 'movie' ? 'Movies' : 'TV Shows'}
              </Text>

              {similarLoading ? (
                <View style={styles.similarLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.similarLoadingText}>
                    Finding similar content...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.similarScrollView}>
                  {similarContent.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.similarItem}
                      onPress={() => navigateToDetails(item)}>
                      <Image
                        source={{
                          uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                        }}
                        style={styles.similarPoster}
                        resizeMode="cover"
                      />
                      <Text style={styles.similarTitle} numberOfLines={2}>
                        {item.title || item.name}
                      </Text>
                      <Text style={styles.similarRating}>
                        {formatRating(item.vote_average)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: LAYOUT.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: LAYOUT.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  backButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  backdropContainer: {
    position: 'relative',
    height: screenHeight * 0.3,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: LAYOUT.spacing.lg,
  },
  mainInfoContainer: {
    flexDirection: 'row',
    marginBottom: LAYOUT.spacing.xl,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: LAYOUT.spacing.lg,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: LAYOUT.spacing.sm,
    lineHeight: 28,
  },
  metadataContainer: {
    marginBottom: LAYOUT.spacing.md,
  },
  releaseDate: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: LAYOUT.spacing.xs,
  },
  language: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.lg,
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: LAYOUT.spacing.sm,
  },
  voteCount: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  favoriteButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  favoriteButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: LAYOUT.spacing.md,
  },
  genresContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  genreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LAYOUT.spacing.sm,
  },
  genreTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.xs,
    borderRadius: LAYOUT.borderRadius.lg,
  },
  genreTagText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '600',
  },
  overviewContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  overview: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  additionalInfoContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.xs,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
  },
  similarContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  similarScrollView: {
    marginHorizontal: -LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  similarItem: {
    width: 120,
    marginRight: LAYOUT.spacing.md,
  },
  similarPoster: {
    width: 120,
    height: 180,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: LAYOUT.spacing.sm,
  },
  similarTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: LAYOUT.spacing.xs,
    textAlign: 'center',
  },
  similarRating: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  similarLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: LAYOUT.spacing.xl,
  },
  similarLoadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: LAYOUT.spacing.sm,
  },
});

export default DetailsScreen;
