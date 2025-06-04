// API Configuration for TMDb and OMDb APIs
// This file handles environment variables and API endpoints

import {
  TMDB_API_KEY,
  TMDB_ACCESS_TOKEN,
  OMDB_API_KEY,
  TMDB_BASE_URL,
  OMDB_BASE_URL,
} from '@env';

export const API_CONFIG = {
  TMDB: {
    BASE_URL: TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    API_KEY: TMDB_API_KEY || '',
    ACCESS_TOKEN: TMDB_ACCESS_TOKEN || '',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
    IMAGE_BASE_URL_ORIGINAL: 'https://image.tmdb.org/t/p/original',
  },

  OMDB: {
    BASE_URL: OMDB_BASE_URL || 'https://www.omdbapi.com',
    API_KEY: OMDB_API_KEY || '',
  },

  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

export const TMDB_ENDPOINTS = {
  MOVIE_POPULAR: '/movie/popular',
  MOVIE_TOP_RATED: '/movie/top_rated',
  MOVIE_NOW_PLAYING: '/movie/now_playing',
  MOVIE_UPCOMING: '/movie/upcoming',
  MOVIE_DETAILS: (id: number) => `/movie/${id}`,
  MOVIE_SEARCH: '/search/movie',

  TV_POPULAR: '/tv/popular',
  TV_TOP_RATED: '/tv/top_rated',
  TV_AIRING_TODAY: '/tv/airing_today',
  TV_ON_THE_AIR: '/tv/on_the_air',
  TV_DETAILS: (id: number) => `/tv/${id}`,
  TV_SEARCH: '/search/tv',

  DISCOVER_MOVIE: '/discover/movie',
  DISCOVER_TV: '/discover/tv',
  MOVIE_GENRES: '/genre/movie/list',
  TV_GENRES: '/genre/tv/list',

  SEARCH_MULTI: '/search/multi',
} as const;

export const isConfigured = () => {
  const hasTmdbAuth = Boolean(
    (API_CONFIG.TMDB.ACCESS_TOKEN &&
      API_CONFIG.TMDB.ACCESS_TOKEN !== 'your_tmdb_access_token_here') ||
      (API_CONFIG.TMDB.API_KEY &&
        API_CONFIG.TMDB.API_KEY !== 'your_tmdb_api_key_here'),
  );
  const hasOmdbKey = Boolean(
    API_CONFIG.OMDB.API_KEY &&
      API_CONFIG.OMDB.API_KEY !== 'your_omdb_api_key_here',
  );

  return {
    tmdb: hasTmdbAuth,
    omdb: hasOmdbKey,
    bothConfigured: hasTmdbAuth && hasOmdbKey,
    usingAccessToken: Boolean(
      API_CONFIG.TMDB.ACCESS_TOKEN &&
        API_CONFIG.TMDB.ACCESS_TOKEN !== 'your_tmdb_access_token_here',
    ),
  };
};

export const getTmdbAuthHeaders = () => {
  if (
    API_CONFIG.TMDB.ACCESS_TOKEN &&
    API_CONFIG.TMDB.ACCESS_TOKEN !== 'your_tmdb_access_token_here'
  ) {
    return {
      Authorization: `Bearer ${API_CONFIG.TMDB.ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
};

export const buildTmdbUrl = (
  endpoint: string,
  params: Record<string, string | number> = {},
) => {
  const baseUrl = API_CONFIG.TMDB.BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let finalUrl = `${baseUrl}${cleanEndpoint}`;

  const hasAccessToken =
    API_CONFIG.TMDB.ACCESS_TOKEN &&
    API_CONFIG.TMDB.ACCESS_TOKEN !== 'your_tmdb_access_token_here';

  const hasApiKey =
    API_CONFIG.TMDB.API_KEY &&
    API_CONFIG.TMDB.API_KEY !== 'your_tmdb_api_key_here';

  const allParams: Record<string, string> = {};

  if (!hasAccessToken && hasApiKey) {
    allParams.api_key = API_CONFIG.TMDB.API_KEY;
  }

  Object.entries(params).forEach(([key, value]) => {
    allParams[key] = String(value);
  });

  const paramKeys = Object.keys(allParams);
  if (paramKeys.length > 0) {
    const queryString = paramKeys
      .map(
        key =>
          `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`,
      )
      .join('&');
    finalUrl = `${finalUrl}?${queryString}`;
  }

  return finalUrl;
};

export const buildOmdbUrl = (params: Record<string, string | number> = {}) => {
  const url = new URL(API_CONFIG.OMDB.BASE_URL);

  url.searchParams.append('apikey', API_CONFIG.OMDB.API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  return url.toString();
};

export const getImageUrl = (
  path: string,
  size: 'w500' | 'original' = 'w500',
) => {
  if (!path) return null;

  const baseUrl =
    size === 'original'
      ? API_CONFIG.TMDB.IMAGE_BASE_URL_ORIGINAL
      : API_CONFIG.TMDB.IMAGE_BASE_URL;

  return `${baseUrl}${path}`;
};
