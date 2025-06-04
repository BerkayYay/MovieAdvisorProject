import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS, LAYOUT} from '../../utils/config';

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  isPersonalized?: boolean;
  onSeeAll?: () => void;
  showSeeAll?: boolean;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  subtitle,
  isPersonalized = false,
  onSeeAll,
  showSeeAll = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {isPersonalized && (
            <View style={styles.personalizedBadge}>
              <Text style={styles.personalizedText}>✨</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showSeeAll && onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  personalizedBadge: {
    marginLeft: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.xs,
    paddingVertical: 2,
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: COLORS.primary + '20',
  },
  personalizedText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
    lineHeight: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
