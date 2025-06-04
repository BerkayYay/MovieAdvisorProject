// Data Transformation Utilities
// Converts API responses to app data structures

import {
  Movie,
  TVShow,
  ContentDetails,
  Genre,
  APIResponse,
  FavoriteItem,
} from '../types';
import {
  TMDbMovie,
  TMDbTVShow,
  TMDbMovieDetails,
  TMDbTVDetails,
  TMDbGenre,
  TMDbResponse,
} from '../services/tmdbService';
import {OMDbMovie} from '../services/omdbService';
import {getImageUrl} from './apiConfig';

export const transformTMDbMovie = (tmdbMovie: TMDbMovie): Movie => {
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    poster_path: tmdbMovie.poster_path || '',
    backdrop_path: tmdbMovie.backdrop_path || undefined,
    overview: tmdbMovie.overview,
    release_date: tmdbMovie.release_date,
    vote_average: tmdbMovie.vote_average,
    vote_count: tmdbMovie.vote_count,
    genre_ids: tmdbMovie.genre_ids,
    adult: tmdbMovie.adult,
    original_language: tmdbMovie.original_language,
    original_title: tmdbMovie.original_title,
    popularity: tmdbMovie.popularity,
    video: tmdbMovie.video,
  };
};

export const transformTMDbTVShow = (tmdbTVShow: TMDbTVShow): TVShow => {
  return {
    id: tmdbTVShow.id,
    name: tmdbTVShow.name,
    poster_path: tmdbTVShow.poster_path || '',
    backdrop_path: tmdbTVShow.backdrop_path || undefined,
    overview: tmdbTVShow.overview,
    first_air_date: tmdbTVShow.first_air_date,
    vote_average: tmdbTVShow.vote_average,
    vote_count: tmdbTVShow.vote_count,
    genre_ids: tmdbTVShow.genre_ids,
    adult: false,
    original_language: tmdbTVShow.original_language,
    original_name: tmdbTVShow.original_name,
    popularity: tmdbTVShow.popularity,
    origin_country: tmdbTVShow.origin_country,
  };
};

export const transformTMDbMovieDetails = (
  tmdbMovieDetails: TMDbMovieDetails,
  omdbData?: OMDbMovie,
): ContentDetails => {
  const baseMovie = transformTMDbMovie(tmdbMovieDetails);

  return {
    ...baseMovie,
    runtime: tmdbMovieDetails.runtime,
    budget: tmdbMovieDetails.budget,
    revenue: tmdbMovieDetails.revenue,

    genres: tmdbMovieDetails.genres?.map(transformTMDbGenre),
    production_companies: tmdbMovieDetails.production_companies?.map(
      company => ({
        id: company.id,
        name: company.name,
        logo_path: company.logo_path || '',
      }),
    ),

    ...(omdbData && {
      imdbRating: parseFloat(omdbData.imdbRating) || undefined,
      imdbVotes: omdbData.imdbVotes,
      awards: omdbData.Awards,
      boxOffice: omdbData.BoxOffice,
      director: omdbData.Director,
      actors: omdbData.Actors,
      writer: omdbData.Writer,
      country: omdbData.Country,
      language: omdbData.Language,
    }),
  } as ContentDetails;
};

export const transformTMDbTVDetails = (
  tmdbTVDetails: TMDbTVDetails,
): ContentDetails => {
  const baseTVShow = transformTMDbTVShow(tmdbTVDetails);

  return {
    ...baseTVShow,
    number_of_seasons: tmdbTVDetails.number_of_seasons,
    number_of_episodes: tmdbTVDetails.number_of_episodes,
    episode_run_time: tmdbTVDetails.episode_run_time,

    genres: tmdbTVDetails.genres?.map(transformTMDbGenre),
    production_companies: tmdbTVDetails.production_companies?.map(company => ({
      id: company.id,
      name: company.name,
      logo_path: company.logo_path || '',
    })),
    networks: tmdbTVDetails.networks?.map(network => ({
      id: network.id,
      name: network.name,
      logo_path: network.logo_path || '',
    })),
  } as ContentDetails;
};

export const transformTMDbGenre = (tmdbGenre: TMDbGenre): Genre => {
  return {
    id: tmdbGenre.id,
    name: tmdbGenre.name,
  };
};

export const transformTMDbResponse = <T, U>(
  tmdbResponse: TMDbResponse<T>,
  transformer: (item: T) => U,
): APIResponse<U> => {
  return {
    page: tmdbResponse.page,
    results: tmdbResponse.results.map(transformer),
    total_pages: tmdbResponse.total_pages,
    total_results: tmdbResponse.total_results,
  };
};

export const createFavoriteItem = (
  content: Movie | TVShow,
  type: 'movie' | 'tv',
): FavoriteItem => {
  const title = 'title' in content ? content.title : content.name;
  const releaseDate =
    'release_date' in content ? content.release_date : undefined;
  const firstAirDate =
    'first_air_date' in content ? content.first_air_date : undefined;

  return {
    id: content.id,
    type,
    title,
    poster_path: content.poster_path,
    vote_average: content.vote_average,
    release_date: releaseDate,
    first_air_date: firstAirDate,
    addedAt: new Date().toISOString(),
  };
};

export const getFullImageUrl = (
  imagePath: string | null | undefined,
  size: 'w500' | 'original' = 'w500',
): string | null => {
  if (!imagePath) return null;
  return getImageUrl(imagePath, size);
};

export const transformMixedSearchResults = (
  results: (TMDbMovie | TMDbTVShow)[],
): (Movie | TVShow)[] => {
  return results.map(item => {
    if ('title' in item) {
      return transformTMDbMovie(item as TMDbMovie);
    } else {
      return transformTMDbTVShow(item as TMDbTVShow);
    }
  });
};

export const getContentType = (content: Movie | TVShow): 'movie' | 'tv' => {
  return 'title' in content ? 'movie' : 'tv';
};

export const getDisplayTitle = (content: Movie | TVShow): string => {
  return 'title' in content ? content.title : content.name;
};

export const getDisplayDate = (content: Movie | TVShow): string => {
  return 'release_date' in content
    ? content.release_date
    : content.first_air_date;
};

export const transformTMDbMovieWithImages = (tmdbMovie: TMDbMovie): Movie => {
  const movie = transformTMDbMovie(tmdbMovie);
  return {
    ...movie,
    poster_path: movie.poster_path
      ? getFullImageUrl(movie.poster_path) || ''
      : '',
    backdrop_path: movie.backdrop_path
      ? getFullImageUrl(movie.backdrop_path, 'original') || undefined
      : undefined,
  };
};

export const transformTMDbTVShowWithImages = (
  tmdbTVShow: TMDbTVShow,
): TVShow => {
  const tvShow = transformTMDbTVShow(tmdbTVShow);
  return {
    ...tvShow,
    poster_path: tvShow.poster_path
      ? getFullImageUrl(tvShow.poster_path) || ''
      : '',
    backdrop_path: tvShow.backdrop_path
      ? getFullImageUrl(tvShow.backdrop_path, 'original') || undefined
      : undefined,
  };
};

export const sortContentByPopularity = <T extends Movie | TVShow>(
  content: T[],
): T[] => {
  return [...content].sort((a, b) => b.popularity - a.popularity);
};

export const sortContentByRating = <T extends Movie | TVShow>(
  content: T[],
): T[] => {
  return [...content].sort((a, b) => b.vote_average - a.vote_average);
};

export const sortContentByDate = <T extends Movie | TVShow>(
  content: T[],
): T[] => {
  return [...content].sort((a, b) => {
    const dateA = getDisplayDate(a);
    const dateB = getDisplayDate(b);
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};

export const filterContentByGenre = <T extends Movie | TVShow>(
  content: T[],
  genreIds: number[],
): T[] => {
  if (genreIds.length === 0) return content;

  return content.filter(item =>
    item.genre_ids.some(genreId => genreIds.includes(genreId)),
  );
};

export const searchContent = <T extends Movie | TVShow>(
  content: T[],
  query: string,
): T[] => {
  if (!query.trim()) return content;

  const lowercaseQuery = query.toLowerCase();

  return content.filter(item => {
    const title = getDisplayTitle(item).toLowerCase();
    const overview = item.overview.toLowerCase();

    return title.includes(lowercaseQuery) || overview.includes(lowercaseQuery);
  });
};
