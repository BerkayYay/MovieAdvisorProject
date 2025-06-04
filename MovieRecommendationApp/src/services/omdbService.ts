// OMDb API Service
// Handles interactions with Open Movie Database API for additional movie details

import {buildOmdbUrl, isConfigured} from '../utils/apiConfig';

export interface OMDbMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
  Error?: string;
}

export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDbSearchResponse {
  Search: OMDbSearchResult[];
  totalResults: string;
  Response: string;
  Error?: string;
}

const omdbFetch = async <T>(url: string): Promise<T> => {
  if (!isConfigured().omdb) {
    throw new Error('OMDb API is not configured. Please check your API key.');
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `OMDb API Error: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data.Response === 'False') {
      throw new Error(`OMDb Error: ${data.Error || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OMDb Service Error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching from OMDb');
  }
};

export const omdbService = {
  getByImdbId: async (imdbId: string): Promise<OMDbMovie> => {
    const url = buildOmdbUrl({i: imdbId, plot: 'full'});
    return omdbFetch<OMDbMovie>(url);
  },

  getByTitle: async (title: string, year?: string): Promise<OMDbMovie> => {
    const params: Record<string, string> = {t: title, plot: 'full'};
    if (year) {
      params.y = year;
    }
    const url = buildOmdbUrl(params);
    return omdbFetch<OMDbMovie>(url);
  },

  search: async (
    title: string,
    page: number = 1,
  ): Promise<OMDbSearchResponse> => {
    const url = buildOmdbUrl({s: title, page: page.toString()});
    return omdbFetch<OMDbSearchResponse>(url);
  },

  getAdditionalInfo: async (
    imdbId: string,
  ): Promise<{
    imdbRating: string;
    imdbVotes: string;
    metascore: string;
    awards: string;
    boxOffice?: string;
    runtime: string;
    director: string;
    actors: string;
  } | null> => {
    try {
      const movie = await omdbService.getByImdbId(imdbId);

      return {
        imdbRating: movie.imdbRating,
        imdbVotes: movie.imdbVotes,
        metascore: movie.Metascore,
        awards: movie.Awards,
        boxOffice: movie.BoxOffice,
        runtime: movie.Runtime,
        director: movie.Director,
        actors: movie.Actors,
      };
    } catch (error) {
      console.warn(
        `Could not fetch additional info for IMDb ID ${imdbId}:`,
        error,
      );
      return null;
    }
  },

  getImdbRating: async (imdbId: string): Promise<number | null> => {
    try {
      const movie = await omdbService.getByImdbId(imdbId);
      const rating = parseFloat(movie.imdbRating);
      return isNaN(rating) ? null : rating;
    } catch (error) {
      console.warn(`Could not fetch IMDb rating for ${imdbId}:`, error);
      return null;
    }
  },

  isConfigured: () => isConfigured().omdb,
};
