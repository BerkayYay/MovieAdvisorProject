import {Movie, TVShow} from '../types';
import {getGenrePreferences} from './genreStorage';
import {tmdbService} from '../services';
import {
  transformTMDbMovie,
  transformTMDbTVShow,
  transformTMDbResponse,
} from './dataTransformers';

export type ContentItem = Movie | TVShow;

export interface SimpleCategory {
  id: string;
  title: string;
  subtitle?: string;
  data: ContentItem[];
}

interface GenreCache {
  movies: Movie[];
  tvShows: TVShow[];
  lastUpdate: number;
  userGenres: number[];
}

let generalCache: GenreCache = {
  movies: [],
  tvShows: [],
  lastUpdate: 0,
  userGenres: [],
};

let personalizedCache: GenreCache = {
  movies: [],
  tvShows: [],
  lastUpdate: 0,
  userGenres: [],
};

const CACHE_DURATION = 5 * 60 * 1000;

function genresMatch(userGenres: number[], cachedGenres: number[]): boolean {
  if (userGenres.length !== cachedGenres.length) return false;
  return userGenres.every(genre => cachedGenres.includes(genre));
}

function getCache(userGenres: number[]): GenreCache {
  if (userGenres.length === 0) {
    return generalCache;
  } else {
    return personalizedCache;
  }
}

async function getMoviesFromAPI(userGenres: number[] = []): Promise<Movie[]> {
  const now = Date.now();

  const cache = getCache(userGenres);
  if (cache.movies.length > 0 && now - cache.lastUpdate < CACHE_DURATION) {
    return cache.movies;
  }

  try {
    let promises;

    if (userGenres.length > 0) {
      promises = [
        tmdbService.movies.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'popularity.desc',
        }),
        tmdbService.movies.discover({
          page: 2,
          genre: userGenres.join(','),
          sort_by: 'popularity.desc',
        }),
        tmdbService.movies.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'vote_average.desc',
        }),
        tmdbService.movies.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'release_date.desc',
        }),
      ];
    } else {
      promises = [
        tmdbService.movies.getPopular(1),
        tmdbService.movies.getPopular(2),
        tmdbService.movies.getTopRated(1),
        tmdbService.movies.getNowPlaying(1),
      ];
    }

    const responses = await Promise.all(promises);
    const allMovies: Movie[] = [];

    responses.forEach(response => {
      const transformedResponse = transformTMDbResponse(
        response,
        transformTMDbMovie,
      );
      allMovies.push(...transformedResponse.results);
    });

    const uniqueMovies = allMovies.filter(
      (movie, index, self) => self.findIndex(m => m.id === movie.id) === index,
    );

    cache.movies = uniqueMovies;
    cache.lastUpdate = now;
    cache.userGenres = userGenres;

    return uniqueMovies;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return cache.movies;
  }
}

async function getTVShowsFromAPI(userGenres: number[] = []): Promise<TVShow[]> {
  const now = Date.now();

  const cache = getCache(userGenres);
  if (cache.tvShows.length > 0 && now - cache.lastUpdate < CACHE_DURATION) {
    return cache.tvShows;
  }

  try {
    let promises;

    if (userGenres.length > 0) {
      promises = [
        tmdbService.tv.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'popularity.desc',
        }),
        tmdbService.tv.discover({
          page: 2,
          genre: userGenres.join(','),
          sort_by: 'popularity.desc',
        }),
        tmdbService.tv.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'vote_average.desc',
        }),
        tmdbService.tv.discover({
          page: 1,
          genre: userGenres.join(','),
          sort_by: 'first_air_date.desc',
        }),
      ];
    } else {
      promises = [
        tmdbService.tv.getPopular(1),
        tmdbService.tv.getPopular(2),
        tmdbService.tv.getTopRated(1),
        tmdbService.tv.getOnTheAir(1),
      ];
    }

    const responses = await Promise.all(promises);
    const allTVShows: TVShow[] = [];

    responses.forEach(response => {
      const transformedResponse = transformTMDbResponse(
        response,
        transformTMDbTVShow,
      );
      allTVShows.push(...transformedResponse.results);
    });

    const uniqueTVShows = allTVShows.filter(
      (show, index, self) => self.findIndex(s => s.id === show.id) === index,
    );

    cache.tvShows = uniqueTVShows;
    cache.lastUpdate = now;
    cache.userGenres = userGenres;

    return uniqueTVShows;
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    return cache.tvShows;
  }
}

export function scoreContent(item: ContentItem, userGenres: number[]): number {
  if (userGenres.length === 0) {
    return item.vote_average / 10;
  }

  // Calculate genre match score
  const itemGenres = item.genre_ids || [];
  const matchingGenres = itemGenres.filter(genreId =>
    userGenres.includes(genreId),
  );
  const genreScore = matchingGenres.length / Math.max(userGenres.length, 1);

  const ratingScore = item.vote_average / 10;

  return genreScore * 0.7 + ratingScore * 0.3;
}

export function getPersonalizedContent(
  content: ContentItem[],
  userGenres: number[],
  limit: number = 20,
): ContentItem[] {
  if (userGenres.length === 0) {
    return content
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, limit);
  }

  return content
    .map(item => ({
      item,
      score: scoreContent(item, userGenres),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({item}) => item)
    .slice(0, limit);
}

export async function getFallbackCategories(): Promise<SimpleCategory[]> {
  const allMovies = await getMoviesFromAPI();
  const allTVShows = await getTVShowsFromAPI();

  return [
    {
      id: 'popular-movies',
      title: 'Popular Movies',
      data: allMovies.sort((a, b) => b.popularity - a.popularity).slice(0, 20),
    },
    {
      id: 'top-rated-movies',
      title: 'Top Rated Movies',
      data: allMovies
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 20),
    },
    {
      id: 'popular-tv',
      title: 'Popular TV Shows',
      data: allTVShows.sort((a, b) => b.popularity - a.popularity).slice(0, 20),
    },
    {
      id: 'top-rated-tv',
      title: 'Top Rated TV Shows',
      data: allTVShows
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 20),
    },
  ];
}

export async function getPersonalizedCategories(
  userGenres: number[],
): Promise<SimpleCategory[]> {
  const allMovies = await getMoviesFromAPI(userGenres);
  const allTVShows = await getTVShowsFromAPI(userGenres);
  const allContent = [...allMovies, ...allTVShows];

  const categories: SimpleCategory[] = [];

  categories.push({
    id: 'for-you',
    title: 'For You',
    subtitle: 'Handpicked based on your preferences',
    data: getPersonalizedContent(allContent, userGenres, 20),
  });

  const trendingContent = allContent
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20);

  categories.push({
    id: 'trending',
    title: 'Trending Now',
    subtitle: 'Popular content in your favorite genres',
    data: trendingContent,
  });

  const topGenres = userGenres.slice(0, 2);
  const genreNames: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  };

  topGenres.forEach(genreId => {
    const genreName = genreNames[genreId] || `Genre ${genreId}`;
    const genreContent = allContent
      .filter(item => item.genre_ids.includes(genreId))
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 20);

    if (genreContent.length > 0) {
      categories.push({
        id: `genre-${genreId}`,
        title: `Best ${genreName}`,
        subtitle: `Top-rated ${genreName.toLowerCase()} content`,
        data: genreContent,
      });
    }
  });

  return categories;
}

export async function hasUserPreferences(): Promise<boolean> {
  try {
    const preferences = await getGenrePreferences();
    return preferences.length >= 3;
  } catch (error) {
    console.error('Error checking user preferences:', error);
    return false;
  }
}

export async function getSimpleRecommendations(): Promise<SimpleCategory[]> {
  try {
    const userHasPrefs = await hasUserPreferences();

    if (!userHasPrefs) {
      const categories = await getFallbackCategories();
      return categories;
    }

    const userGenres = await getGenrePreferences();
    const categories = await getPersonalizedCategories(userGenres);
    return categories;
  } catch (error) {
    console.error('Error getting simple recommendations:', error);
    const fallbackCategories = await getFallbackCategories();
    return fallbackCategories;
  }
}

export async function refreshSimpleRecommendations(): Promise<void> {
  generalCache.movies = [];
  generalCache.tvShows = [];
  generalCache.lastUpdate = 0;
  generalCache.userGenres = [];

  personalizedCache.movies = [];
  personalizedCache.tvShows = [];
  personalizedCache.lastUpdate = 0;
  personalizedCache.userGenres = [];

  try {
    const userHasPrefs = await hasUserPreferences();
    if (userHasPrefs) {
      const userGenres = await getGenrePreferences();
      await Promise.all([
        getMoviesFromAPI(userGenres),
        getTVShowsFromAPI(userGenres),
      ]);
    } else {
      await Promise.all([getMoviesFromAPI(), getTVShowsFromAPI()]);
    }
  } catch (error) {
    console.error('Error pre-fetching data during refresh:', error);
  }
}
