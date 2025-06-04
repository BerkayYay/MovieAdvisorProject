import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {COLORS, LAYOUT} from '../../utils/config';

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string;
  rating: number;
  isFavorite?: boolean;
  mediaType?: 'movie' | 'tv';
  year?: string;
  onPress: () => void;
  onToggleFavorite?: () => void;
  width?: number;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

const {width: screenWidth} = Dimensions.get('window');
const DEFAULT_WIDTH = screenWidth * 0.32;

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const MovieCard: React.FC<MovieCardProps> = ({
  title,
  posterPath,
  rating,
  isFavorite = false,
  mediaType,
  year,
  onPress,
  onToggleFavorite,
  width = DEFAULT_WIDTH,
  showRemoveButton = false,
  onRemove,
}) => {
  const height = width * 1.5;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const favoriteScale = useSharedValue(1);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
    opacity.value = withTiming(1, {duration: 300});
  }, []);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, {damping: 15, stiffness: 200});
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {damping: 15, stiffness: 200});
  };

  const handleFavoritePress = () => {
    favoriteScale.value = withSpring(
      0.8,
      {damping: 15, stiffness: 300},
      finished => {
        if (finished) {
          favoriteScale.value = withSpring(1, {damping: 15, stiffness: 300});
        }
      },
    );
    onToggleFavorite?.();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: interpolate(scale.value, [0, 1], [0.8, 1])},
      {scale: pressScale.value},
    ],
    opacity: opacity.value,
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: favoriteScale.value}],
  }));

  return (
    <Animated.View style={[styles.container, {width}, containerAnimatedStyle]}>
      <AnimatedTouchableOpacity
        style={styles.posterContainer}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        delayPressIn={50}>
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w500${posterPath}`,
          }}
          style={[styles.poster, {width, height}]}
          resizeMode="cover"
        />

        {onToggleFavorite && (
          <Animated.View style={[styles.favoriteButton, favoriteAnimatedStyle]}>
            <TouchableOpacity
              onPress={handleFavoritePress}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.favoriteButtonInner}>
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {showRemoveButton && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </AnimatedTouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaContainer}>
          <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
          {mediaType && (
            <Text style={styles.mediaType}>
              {mediaType === 'movie' ? '🎬' : '📺'}
            </Text>
          )}
        </View>

        {year && <Text style={styles.year}>{year}</Text>}
      </View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginHorizontal: LAYOUT.spacing.xs,
    marginBottom: LAYOUT.spacing.md,
  },
  posterContainer: {
    position: 'relative',
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  poster: {
    backgroundColor: COLORS.surface,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
  },
  favoriteButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: LAYOUT.spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: LAYOUT.spacing.xs,
  },
  rating: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  mediaType: {
    fontSize: 12,
  },
  year: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: LAYOUT.spacing.xs,
  },
});
