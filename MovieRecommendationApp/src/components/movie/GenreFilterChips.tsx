import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {Text} from '../common';
import {COLORS, LAYOUT} from '../../utils/config';
import {getAllGenres} from '../../data';
import {Genre} from '../../types';

const {width} = Dimensions.get('window');

interface GenreFilterChipsProps {
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  onClearAll: () => void;
  maxVisible?: number;
  showAllGenres?: boolean;
}

const GenreFilterChips: React.FC<GenreFilterChipsProps> = ({
  selectedGenres,
  onGenreToggle,
  onClearAll,
  maxVisible = 10,
  showAllGenres = false,
}) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showAll, setShowAll] = useState(showAllGenres);

  useEffect(() => {
    const allGenres = getAllGenres();
    setGenres(allGenres);
  }, []);

  const displayedGenres = showAll ? genres : genres.slice(0, maxVisible);
  const hasMoreGenres = genres.length > maxVisible;

  const renderGenreChip = (genre: Genre) => {
    const isSelected = selectedGenres.includes(genre.id);

    return (
      <TouchableOpacity
        key={genre.id}
        style={[
          styles.chip,
          isSelected ? styles.chipSelected : styles.chipUnselected,
        ]}
        onPress={() => onGenreToggle(genre.id)}
        testID={`genre-filter-chip-${genre.id}`}>
        <Text
          variant="caption"
          style={[
            styles.chipText,
            isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}>
          {genre.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (genres.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="body" style={styles.title}>
          Filter by Genres
        </Text>
        {selectedGenres.length > 0 && (
          <TouchableOpacity onPress={onClearAll} testID="clear-genre-filters">
            <Text variant="caption" color="primary" style={styles.clearText}>
              Clear All ({selectedGenres.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.chipsContainer}>
          {displayedGenres.map(renderGenreChip)}

          {hasMoreGenres && !showAll && (
            <TouchableOpacity
              style={[styles.chip, styles.chipMore]}
              onPress={() => setShowAll(true)}
              testID="show-more-genres">
              <Text variant="caption" style={styles.chipTextMore}>
                +{genres.length - maxVisible} more
              </Text>
            </TouchableOpacity>
          )}

          {showAll && hasMoreGenres && (
            <TouchableOpacity
              style={[styles.chip, styles.chipMore]}
              onPress={() => setShowAll(false)}
              testID="show-less-genres">
              <Text variant="caption" style={styles.chipTextMore}>
                Show less
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {selectedGenres.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.selectedLabel}>
            Active filters ({selectedGenres.length}):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedScrollContent}>
            {selectedGenres.map(genreId => {
              const genre = genres.find(g => g.id === genreId);
              if (!genre) return null;

              return (
                <TouchableOpacity
                  key={genreId}
                  style={styles.selectedChip}
                  onPress={() => onGenreToggle(genreId)}
                  testID={`selected-genre-${genreId}`}>
                  <Text variant="caption" style={styles.selectedChipText}>
                    {genre.name} ✕
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: LAYOUT.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.sm,
  },
  title: {
    fontWeight: '600',
    color: COLORS.text,
  },
  clearText: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: LAYOUT.spacing.lg,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LAYOUT.spacing.xs,
  },
  chip: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: LAYOUT.spacing.xs,
    marginBottom: LAYOUT.spacing.xs,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  chipMore: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  chipTextUnselected: {
    color: COLORS.text,
  },
  chipTextMore: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  selectedContainer: {
    marginTop: LAYOUT.spacing.md,
    paddingTop: LAYOUT.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedLabel: {
    marginBottom: LAYOUT.spacing.xs,
  },
  selectedScrollContent: {
    paddingRight: LAYOUT.spacing.lg,
  },
  selectedChip: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.xs,
    borderRadius: LAYOUT.borderRadius.sm,
    marginRight: LAYOUT.spacing.xs,
  },
  selectedChipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default GenreFilterChips;
