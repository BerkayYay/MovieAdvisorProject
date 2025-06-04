export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_name: string;
  popularity: number;
  origin_country: string[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface ContentDetails extends Movie, TVShow {
  // Movie specific fields
  runtime?: number;
  budget?: number;
  revenue?: number;

  // TV specific fields
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];

  // Common enhanced fields
  genres?: Genre[];
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path: string;
  }>;
  networks?: Array<{
    id: number;
    name: string;
    logo_path: string;
  }>;
  cast?: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string;
    order: number;
  }>;
  crew?: Array<{
    id: number;
    name: string;
    job: string;
    profile_path: string;
  }>;
  videos?: Array<{
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    size: number;
  }>;
  similar?: (Movie | TVShow)[];
}

export interface APIResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface FavoriteItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  addedAt: string;
}

export interface UserPreferences {
  favoriteGenres: number[];
  preferredLanguage: string;
  adultContent: boolean;
  sortMethod: 'popularity' | 'rating' | 'release_date';
  theme: 'light' | 'dark';
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  resultsCount: number;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Details: {
    id: number;
    type: 'movie' | 'tv';
  };
  GenrePreferences:
    | {
        source?: 'onboarding' | 'settings';
        navigateToAfterComplete?: keyof RootStackParamList;
      }
    | undefined;
  CategoryContent: {
    categoryTitle: string;
    categorySubtitle?: string;
    categoryData: (Movie | TVShow)[];
    isPersonalized?: boolean;
  };
  TestApi: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search:
    | {
        initialFilter?: 'movie' | 'tv' | 'mixed';
        initialQuery?: string;
      }
    | undefined;
  Favorites: undefined;
  Profile: undefined;
};

export interface ApiResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Category {
  id: string;
  title: string;
  endpoint: string;
  type: 'movie' | 'tv';
}
