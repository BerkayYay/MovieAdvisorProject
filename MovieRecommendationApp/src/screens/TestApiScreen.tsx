import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Button, Alert} from 'react-native';
import {tmdbService, omdbService, apiServices} from '../services';
import {isConfigured, API_CONFIG} from '../utils/apiConfig';
import {
  transformTMDbMovie,
  transformTMDbResponse,
  transformTMDbGenre,
  getDisplayTitle,
  getContentType,
} from '../utils/dataTransformers';

export const TestApiScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const config = isConfigured();

    const configInfo = [
      '=== API Configuration Status ===',
      `TMDb configured: ${config.tmdb ? '✅' : '❌'}`,
      `TMDb using access token: ${
        config.usingAccessToken ? '✅' : '❌ (using API key)'
      }`,
      `OMDb configured: ${config.omdb ? '✅' : '❌'}`,
      `Both APIs ready: ${config.bothConfigured ? '✅' : '❌'}`,
      '',
    ];

    setTestResults(configInfo);
  }, []);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testTMDbMovies = async () => {
    setIsLoading(true);
    addResult('=== Testing TMDb Movies ===');

    try {
      const config = isConfigured();
      addResult(`🔑 Access token configured: ${config.usingAccessToken}`);
      addResult(
        `🔑 API key fallback: ${
          !config.usingAccessToken && Boolean(API_CONFIG.TMDB.API_KEY)
        }`,
      );
      addResult('');

      addResult('📡 Fetching popular movies...');
      const popularResponse = await tmdbService.movies.getPopular(1);
      addResult(
        `✅ Raw API response: ${popularResponse.results.length} movies`,
      );

      const transformedMovies = transformTMDbResponse(
        popularResponse,
        transformTMDbMovie,
      );
      addResult(
        `🔄 Data transformed: ${transformedMovies.results.length} movies`,
      );
      addResult(
        `   Sample movie: "${transformedMovies.results[0]?.title || 'None'}"`,
      );
      addResult(
        `   Rating: ${transformedMovies.results[0]?.vote_average || 'N/A'}/10`,
      );
      addResult(
        `   Content type: ${getContentType(transformedMovies.results[0])}`,
      );

      addResult('');
      addResult('🔍 Testing search with transformation...');
      const searchResponse = await tmdbService.movies.search('Inception');
      const transformedSearch = transformTMDbResponse(
        searchResponse,
        transformTMDbMovie,
      );
      addResult(
        `✅ Search for "Inception": ${transformedSearch.results.length} results`,
      );
      if (transformedSearch.results.length > 0) {
        const firstResult = transformedSearch.results[0];
        addResult(
          `   Found: "${getDisplayTitle(firstResult)}" (${
            firstResult.release_date
          })`,
        );
        addResult(`   Display type: ${getContentType(firstResult)}`);
      }

      if (searchResponse.results[0]) {
        addResult('');
        addResult('📄 Testing movie details...');
        const detailsResponse = await tmdbService.movies.getDetails(
          searchResponse.results[0].id,
        );
        addResult(`✅ Movie details: ${detailsResponse.title}`);
        addResult(`   Runtime: ${detailsResponse.runtime} min`);
        addResult(
          `   Budget: $${detailsResponse.budget?.toLocaleString() || 'N/A'}`,
        );
        addResult(
          `   Genres: ${
            detailsResponse.genres?.map(g => g.name).join(', ') || 'N/A'
          }`,
        );
      }
    } catch (error) {
      addResult(
        `❌ TMDb Movies Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    addResult('');
    setIsLoading(false);
  };

  const testTMDbGenres = async () => {
    setIsLoading(true);
    addResult('=== Testing TMDb Genres ===');

    try {
      addResult('📡 Fetching movie genres...');
      const movieGenresResponse = await tmdbService.genres.getMovieGenres();
      const transformedMovieGenres =
        movieGenresResponse.genres.map(transformTMDbGenre);
      addResult(`✅ Movie genres: ${transformedMovieGenres.length} total`);
      addResult(
        `   Sample genres: ${transformedMovieGenres
          .slice(0, 5)
          .map(g => g.name)
          .join(', ')}`,
      );

      addResult('');
      addResult('📡 Fetching TV genres...');
      const tvGenresResponse = await tmdbService.genres.getTVGenres();
      const transformedTVGenres =
        tvGenresResponse.genres.map(transformTMDbGenre);
      addResult(`✅ TV genres: ${transformedTVGenres.length} total`);
      addResult(
        `   Sample genres: ${transformedTVGenres
          .slice(0, 5)
          .map(g => g.name)
          .join(', ')}`,
      );

      addResult('');
      addResult('🔄 Testing combined genres...');
      const allGenres = await tmdbService.genres.getAllGenres();
      addResult(`✅ All genres combined: ${allGenres.length} total`);
    } catch (error) {
      addResult(
        `❌ TMDb Genres Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    addResult('');
    setIsLoading(false);
  };

  const testOMDb = async () => {
    setIsLoading(true);
    addResult('=== Testing OMDb ===');

    try {
      const searchResults = await omdbService.search('Inception');
      addResult(`✅ OMDb search: ${searchResults.Search?.length || 0} results`);

      if (searchResults.Search?.[0]) {
        const details = await omdbService.getByImdbId(
          searchResults.Search[0].imdbID,
        );
        addResult(
          `✅ Movie details: ${details.Title} (${details.imdbRating}/10)`,
        );
      }
    } catch (error) {
      addResult(
        `❌ OMDb Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    addResult('');
    setIsLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testTMDbMovies();
    await testTMDbGenres();
    await testOMDb();
    addResult('=== All Tests Complete ===');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Test Screen</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Test TMDb Movies"
          onPress={testTMDbMovies}
          disabled={isLoading}
        />
        <Button
          title="Test TMDb Genres"
          onPress={testTMDbGenres}
          disabled={isLoading}
        />
        <Button title="Test OMDb" onPress={testOMDb} disabled={isLoading} />
        <Button
          title="Run All Tests"
          onPress={runAllTests}
          disabled={isLoading}
        />
        <Button
          title="Clear Results"
          onPress={clearResults}
          disabled={isLoading}
        />
      </View>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>

      {isLoading && <Text style={styles.loading}>Testing API calls...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  results: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  loading: {
    color: '#ffa500',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
