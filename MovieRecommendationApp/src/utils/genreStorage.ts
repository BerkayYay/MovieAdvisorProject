import {Genre, Movie, TVShow} from '../types';
import {getUserPreferences, updateUserPreferences} from './storage';
import {getAllGenres, getMovieGenres, getTVGenres} from '../data';

export interface GenrePreferenceData {
  selectedGenres: number[];
  preferenceScore: {[genreId: number]: number};
  lastUpdated: string;
  totalSelections: number;
}

export const getGenrePreferences = async (): Promise<number[]> => {
  try {
    const preferences = await getUserPreferences();
    return preferences.favoriteGenres || [];
  } catch (error) {
    console.error('Error getting genre preferences:', error);
    return [];
  }
};

export const setGenrePreferences = async (
  genreIds: number[],
): Promise<boolean> => {
  try {
    await updateUserPreferences({
      favoriteGenres: genreIds,
    });
    return true;
  } catch (error) {
    console.error('Error setting genre preferences:', error);
    return false;
  }
};

export const addGenrePreference = async (genreId: number): Promise<boolean> => {
  try {
    const currentGenres = await getGenrePreferences();
    if (!currentGenres.includes(genreId)) {
      const updatedGenres = [...currentGenres, genreId];
      return await setGenrePreferences(updatedGenres);
    }
    return true;
  } catch (error) {
    console.error('Error adding genre preference:', error);
    return false;
  }
};

export const removeGenrePreference = async (
  genreId: number,
): Promise<boolean> => {
  try {
    const currentGenres = await getGenrePreferences();
    const updatedGenres = currentGenres.filter(id => id !== genreId);
    return await setGenrePreferences(updatedGenres);
  } catch (error) {
    console.error('Error removing genre preference:', error);
    return false;
  }
};

export const isGenrePreferred = async (genreId: number): Promise<boolean> => {
  try {
    const preferences = await getGenrePreferences();
    return preferences.includes(genreId);
  } catch (error) {
    console.error('Error checking genre preference:', error);
    return false;
  }
};

export const getGenrePreferenceStats = async (): Promise<{
  totalSelected: number;
  movieGenres: number;
  tvGenres: number;
  commonGenres: number;
  preferredGenreNames: string[];
}> => {
  try {
    const preferences = await getGenrePreferences();
    const allGenres = getAllGenres();
    const movieGenres = getMovieGenres();
    const tvGenres = getTVGenres();

    const movieGenreIds = movieGenres.map(g => g.id);
    const tvGenreIds = tvGenres.map(g => g.id);

    const selectedMovieGenres = preferences.filter(id =>
      movieGenreIds.includes(id),
    );
    const selectedTVGenres = preferences.filter(id => tvGenreIds.includes(id));
    const commonGenres = preferences.filter(
      id => movieGenreIds.includes(id) && tvGenreIds.includes(id),
    );

    const preferredGenreNames = preferences
      .map(id => allGenres.find(g => g.id === id)?.name)
      .filter(Boolean) as string[];

    return {
      totalSelected: preferences.length,
      movieGenres: selectedMovieGenres.length,
      tvGenres: selectedTVGenres.length,
      commonGenres: commonGenres.length,
      preferredGenreNames,
    };
  } catch (error) {
    console.error('Error getting genre preference stats:', error);
    return {
      totalSelected: 0,
      movieGenres: 0,
      tvGenres: 0,
      commonGenres: 0,
      preferredGenreNames: [],
    };
  }
};

export const getGenreMatchScore = async (
  contentGenreIds: number[],
): Promise<number> => {
  try {
    const preferences = await getGenrePreferences();
    if (preferences.length === 0 || contentGenreIds.length === 0) {
      return 0;
    }

    const matchingGenres = contentGenreIds.filter(id =>
      preferences.includes(id),
    );
    const matchScore = matchingGenres.length / preferences.length;
    const genreRatio = matchingGenres.length / contentGenreIds.length;

    return matchScore * 0.7 + genreRatio * 0.3;
  } catch (error) {
    console.error('Error calculating genre match score:', error);
    return 0;
  }
};

export const filterContentByGenrePreferences = async <T extends Movie | TVShow>(
  content: T[],
  minScore: number = 0.2,
): Promise<T[]> => {
  try {
    const preferences = await getGenrePreferences();
    if (preferences.length === 0) {
      return content;
    }

    const filteredContent: T[] = [];
    for (const item of content) {
      const score = await getGenreMatchScore(item.genre_ids);
      if (score >= minScore) {
        filteredContent.push(item);
      }
    }

    return filteredContent;
  } catch (error) {
    console.error('Error filtering content by genre preferences:', error);
    return content;
  }
};

export const sortContentByGenrePreferences = async <T extends Movie | TVShow>(
  content: T[],
): Promise<T[]> => {
  try {
    const contentWithScores = await Promise.all(
      content.map(async item => ({
        item,
        score: await getGenreMatchScore(item.genre_ids),
      })),
    );

    return contentWithScores
      .sort((a, b) => b.score - a.score)
      .map(({item}) => item);
  } catch (error) {
    console.error('Error sorting content by genre preferences:', error);
    return content;
  }
};

export const getRecommendedGenres = async (
  excludeSelected: boolean = true,
): Promise<Genre[]> => {
  try {
    const preferences = await getGenrePreferences();
    const allGenres = getAllGenres();

    if (!excludeSelected) {
      return allGenres;
    }

    return allGenres.filter(genre => !preferences.includes(genre.id));
  } catch (error) {
    console.error('Error getting recommended genres:', error);
    return getAllGenres();
  }
};

export const getGenreCompletionStatus = async (): Promise<{
  isComplete: boolean;
  missingGenres: Genre[];
  coverage: number;
  recommendations: string[];
}> => {
  try {
    const preferences = await getGenrePreferences();
    const allGenres = getAllGenres();

    const isComplete = preferences.length >= 3;
    const coverage = Math.min(preferences.length / 3, 1);

    const missingGenres = allGenres.filter(g => !preferences.includes(g.id));

    const recommendations: string[] = [];
    if (preferences.length === 0) {
      recommendations.push(
        'Select at least 3 genres to get personalized recommendations',
      );
    } else if (preferences.length < 3) {
      recommendations.push(
        `Select ${
          3 - preferences.length
        } more genres for better recommendations`,
      );
    } else if (preferences.length >= 5) {
      recommendations.push(
        'Great! You have enough genre preferences for excellent personalization',
      );
    }

    return {
      isComplete,
      missingGenres,
      coverage,
      recommendations,
    };
  } catch (error) {
    console.error('Error getting genre completion status:', error);
    return {
      isComplete: false,
      missingGenres: [],
      coverage: 0,
      recommendations: ['Error loading genre preferences'],
    };
  }
};

export const exportGenrePreferenceData = async (): Promise<{
  preferences: number[];
  stats: any;
  completion: any;
  timestamp: string;
}> => {
  try {
    const preferences = await getGenrePreferences();
    const stats = await getGenrePreferenceStats();
    const completion = await getGenreCompletionStatus();

    return {
      preferences,
      stats,
      completion,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting genre preference data:', error);
    throw error;
  }
};

export const validateGenrePreferences = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const preferences = await getGenrePreferences();
    const allGenres = getAllGenres();
    const allGenreIds = allGenres.map(g => g.id);

    const invalidGenres = preferences.filter(id => !allGenreIds.includes(id));
    if (invalidGenres.length > 0) {
      errors.push(`Invalid genre IDs found: ${invalidGenres.join(', ')}`);
    }

    const uniquePreferences = [...new Set(preferences)];
    if (uniquePreferences.length !== preferences.length) {
      warnings.push('Duplicate genre preferences found');
    }

    if (preferences.length === 0) {
      warnings.push(
        'No genre preferences set - personalization will be limited',
      );
    } else if (preferences.length > 15) {
      warnings.push(
        'Very large number of genre preferences - may reduce specificity of recommendations',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('Error validating genre preferences:', error);
    return {
      isValid: false,
      errors: ['Failed to validate genre preferences'],
      warnings: [],
    };
  }
};
