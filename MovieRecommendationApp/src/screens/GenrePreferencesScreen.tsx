import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Text, Button, Loading} from '../components/common';
import {Container} from '../components/layout';
import {GenreSelection} from '../components/movie';
import {RootStackParamList} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {useGenrePreferenceManager} from '../hooks';
import {useSafeAsync, useComponentTracker} from '../utils/memoryLeak';
import {getUserPreferences} from '../utils/storage';

type GenrePreferencesScreenRouteProp = RouteProp<
  RootStackParamList,
  'GenrePreferences'
>;
type GenrePreferencesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GenrePreferences'
>;

const GenrePreferencesScreen: React.FC = () => {
  useComponentTracker('GenrePreferencesScreen');

  const navigation = useNavigation<GenrePreferencesScreenNavigationProp>();
  const route = useRoute<GenrePreferencesScreenRouteProp>();

  const {source, navigateToAfterComplete} = route.params || {};
  const isOnboarding = source === 'onboarding';

  const {preferences, genres, stats} = useGenrePreferenceManager();

  const [saving, setSaving] = useState(false);
  const [localSelectedGenres, setLocalSelectedGenres] = useState<number[]>([]);

  const minSelections = isOnboarding ? 3 : 1;
  const canSave = localSelectedGenres.length >= minSelections;

  const {safeAsync} = useSafeAsync();

  useEffect(() => {
    if (preferences.preferences && !preferences.loading) {
      setLocalSelectedGenres([...preferences.preferences]);
    }
  }, [preferences.preferences, preferences.loading]);

  const handleGenreToggle = (genreId: number) => {
    setLocalSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    console.log('🔄 Starting to save genre preferences...');
    console.log('🎯 Selected genres to save:', localSelectedGenres);

    try {
      const success = await preferences.savePreferences(localSelectedGenres);

      if (success) {
        if (navigateToAfterComplete) {
          navigation.navigate(navigateToAfterComplete as any);
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isOnboarding) {
      Alert.alert(
        'Skip Genre Selection?',
        'You can always set your preferences later from the profile screen.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Skip',
            onPress: () => {
              if (navigateToAfterComplete) {
                navigation.navigate(navigateToAfterComplete as any);
              } else {
                navigation.navigate('Login');
              }
            },
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  if (preferences.loading || genres.loading || saving) {
    return (
      <Container>
        <Loading message="Loading genre preferences..." />
      </Container>
    );
  }

  if (preferences.error) {
    return (
      <Container style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="heading" style={styles.errorTitle}>
            Error Loading Preferences
          </Text>
          <Text variant="body" style={styles.errorText}>
            {preferences.error}
          </Text>
          <Button title="Try Again" onPress={preferences.reload} />
        </View>
      </Container>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Container style={styles.container}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>
            {isOnboarding ? 'Choose Your Favorite Genres' : 'Genre Preferences'}
          </Text>
          <Text variant="body" style={styles.subtitle}>
            {isOnboarding
              ? `Select at least ${minSelections} genres to get personalized recommendations`
              : 'Update your genre preferences to improve recommendations'}
          </Text>

          {!isOnboarding && stats.completion && (
            <View style={styles.statsContainer}>
              <Text variant="caption" style={styles.statsText}>
                {localSelectedGenres.length} genres selected
                {stats.completion.recommendations.length > 0 &&
                  ` • ${stats.completion.recommendations[0]}`}
              </Text>
            </View>
          )}
        </View>

        <GenreSelection
          genres={genres.allGenres}
          selectedGenres={localSelectedGenres}
          onGenreToggle={handleGenreToggle}
          title=""
          subtitle=""
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Save Preferences"
            onPress={handleSave}
            disabled={!canSave || saving}
            loading={saving}
            style={!canSave ? styles.disabledButton : styles.saveButton}
          />

          {isOnboarding && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text variant="body" style={styles.skipText}>
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
    minHeight: 56,
  },
  backButton: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    marginLeft: 'auto',
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  bottomSection: {
    padding: LAYOUT.spacing.lg,
    backgroundColor: COLORS.surface,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.md,
  },
  selectionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  requirementText: {
    color: COLORS.warning,
    marginTop: LAYOUT.spacing.xs,
  },
  saveButton: {
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: LAYOUT.spacing.md,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: LAYOUT.spacing.lg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: LAYOUT.spacing.md,
  },
  statsText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  buttonContainer: {
    padding: LAYOUT.spacing.lg,
    backgroundColor: COLORS.surface,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
});

export default GenrePreferencesScreen;
