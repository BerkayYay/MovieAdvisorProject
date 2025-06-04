import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {Text} from '../common';
import {Genre} from '../../types';
import {COLORS, LAYOUT} from '../../utils/config';

const {width: screenWidth} = Dimensions.get('window');

interface GenreSelectionProps {
  genres: Genre[];
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  title?: string;
  subtitle?: string;
}

export const GenreSelection: React.FC<GenreSelectionProps> = ({
  genres,
  selectedGenres,
  onGenreToggle,
  multiSelect = true,
  maxSelections,
  title = 'Select Your Favorite Genres',
  subtitle = 'Choose genres you enjoy to get personalized recommendations',
}) => {
  const isGenreSelected = (genreId: number) => {
    return selectedGenres.includes(genreId);
  };

  const canSelectMore = () => {
    if (!maxSelections) return true;
    return selectedGenres.length < maxSelections;
  };

  const handleGenrePress = (genreId: number) => {
    const isSelected = isGenreSelected(genreId);

    if (!multiSelect) {
      onGenreToggle(genreId);
      return;
    }

    if (isSelected) {
      onGenreToggle(genreId);
    } else {
      if (canSelectMore()) {
        onGenreToggle(genreId);
      }
    }
  };

  const renderGenreChip = ({item}: {item: Genre}) => {
    const isSelected = isGenreSelected(item.id);
    const disabled = !isSelected && !canSelectMore();

    return (
      <TouchableOpacity
        style={[
          styles.genreChip,
          isSelected && styles.genreChipSelected,
          disabled && styles.genreChipDisabled,
        ]}
        onPress={() => handleGenrePress(item.id)}
        disabled={disabled}
        testID={`genre-chip-${item.id}`}>
        <Text
          variant="body"
          style={[
            styles.genreText,
            isSelected && styles.genreTextSelected,
            disabled && styles.genreTextDisabled,
          ]}>
          {item.name}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" style={styles.subtitle}>
        {subtitle}
      </Text>
      {maxSelections && (
        <Text variant="caption" style={styles.selectionCount}>
          Selected: {selectedGenres.length} / {maxSelections}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={genres}
        renderItem={renderGenreChip}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: LAYOUT.spacing.lg,
  },
  header: {
    marginBottom: LAYOUT.spacing.xl,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.md,
  },
  selectionCount: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.spacing.xs,
  },
  separator: {
    height: LAYOUT.spacing.md,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 25,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    marginHorizontal: LAYOUT.spacing.xs,
    minHeight: 48,
    width: (screenWidth - LAYOUT.spacing.lg * 2 - LAYOUT.spacing.xs * 4) / 2,
  },
  genreChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genreChipDisabled: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
    opacity: 0.5,
  },
  genreText: {
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  genreTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  genreTextDisabled: {
    color: COLORS.textSecondary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: LAYOUT.spacing.xs,
  },
});
