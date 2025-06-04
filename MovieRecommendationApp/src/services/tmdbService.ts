// TMDb API Service
// Handles all interactions with The Movie Database API

import {
  API_CONFIG,
  TMDB_ENDPOINTS,
  buildTmdbUrl,
  getTmdbAuthHeaders,
  isConfigured,
} from '../utils/apiConfig';

export interface TMDbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDbTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDbMovieDetails extends TMDbMovie {
  runtime: number;
  genres: TMDbGenre[];
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages: Array<{
    iso_639_1: string;
    name: string;
  }>;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
}

export interface TMDbTVDetails extends TMDbTVShow {
  created_by: Array<{
    id: number;
    name: string;
  }>;
  episode_run_time: number[];
  genres: TMDbGenre[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
  status: string;
  tagline: string;
  type: string;
  networks: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
}

const tmdbFetch = async <T>(url: string): Promise<T> => {
  if (!isConfigured().tmdb) {
    throw new Error('TMDb API is not configured. Please check your API keys.');
  }

  try {
    const headers = getTmdbAuthHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as Record<string, string>,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `TMDb API Error: ${response.status} - ${response.statusText}. Response: ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TMDb API Error:', error);
    if (error instanceof Error) {
      throw new Error(`TMDb Service Error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching from TMDb');
  }
};

export const tmdbMovieService = {
  getPopular: async (page: number = 1): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_POPULAR, {page});
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },

  getTopRated: async (page: number = 1): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_TOP_RATED, {page});
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },

  getNowPlaying: async (page: number = 1): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_NOW_PLAYING, {page});
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },

  getUpcoming: async (page: number = 1): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_UPCOMING, {page});
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },

  getDetails: async (movieId: number): Promise<TMDbMovieDetails> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_DETAILS(movieId));
    return tmdbFetch<TMDbMovieDetails>(url);
  },

  search: async (
    query: string,
    page: number = 1,
  ): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_SEARCH, {query, page});
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },

  discover: async (
    params: {
      page?: number;
      genre?: string;
      year?: number;
      sort_by?: string;
    } = {},
  ): Promise<TMDbResponse<TMDbMovie>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.DISCOVER_MOVIE, {
      page: 1,
      sort_by: 'popularity.desc',
      ...params,
    });
    return tmdbFetch<TMDbResponse<TMDbMovie>>(url);
  },
};

export const tmdbTVService = {
  getPopular: async (page: number = 1): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_POPULAR, {page});
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },

  getTopRated: async (page: number = 1): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_TOP_RATED, {page});
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },

  getAiringToday: async (
    page: number = 1,
  ): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_AIRING_TODAY, {page});
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },

  getOnTheAir: async (page: number = 1): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_ON_THE_AIR, {page});
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },

  getDetails: async (tvId: number): Promise<TMDbTVDetails> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_DETAILS(tvId));
    return tmdbFetch<TMDbTVDetails>(url);
  },

  search: async (
    query: string,
    page: number = 1,
  ): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_SEARCH, {query, page});
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },

  discover: async (
    params: {
      page?: number;
      genre?: string;
      year?: number;
      sort_by?: string;
    } = {},
  ): Promise<TMDbResponse<TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.DISCOVER_TV, {
      page: 1,
      sort_by: 'popularity.desc',
      ...params,
    });
    return tmdbFetch<TMDbResponse<TMDbTVShow>>(url);
  },
};

export const tmdbGenreService = {
  getMovieGenres: async (): Promise<{genres: TMDbGenre[]}> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.MOVIE_GENRES);
    return tmdbFetch<{genres: TMDbGenre[]}>(url);
  },

  getTVGenres: async (): Promise<{genres: TMDbGenre[]}> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.TV_GENRES);
    return tmdbFetch<{genres: TMDbGenre[]}>(url);
  },

  getAllGenres: async (): Promise<TMDbGenre[]> => {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        tmdbGenreService.getMovieGenres(),
        tmdbGenreService.getTVGenres(),
      ]);

      const allGenres = [...movieGenres.genres, ...tvGenres.genres];
      const uniqueGenres = allGenres.filter(
        (genre, index, self) =>
          self.findIndex(g => g.id === genre.id) === index,
      );

      return uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },
};

export const tmdbSearchService = {
  searchMulti: async (
    query: string,
    page: number = 1,
  ): Promise<TMDbResponse<TMDbMovie | TMDbTVShow>> => {
    const url = buildTmdbUrl(TMDB_ENDPOINTS.SEARCH_MULTI, {query, page});
    return tmdbFetch<TMDbResponse<TMDbMovie | TMDbTVShow>>(url);
  },
};

export const tmdbService = {
  movies: tmdbMovieService,
  tv: tmdbTVService,
  genres: tmdbGenreService,
  search: tmdbSearchService,
  isConfigured: () => isConfigured().tmdb,
};
