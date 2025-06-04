// Mock data constants for easy access throughout the app
import popularMoviesData from './movies/popular.json';
import topRatedMoviesData from './movies/top-rated.json';
import popularTVShowsData from './tvshows/popular.json';
import genresData from './genres.json';
import searchResultsData from './search/multi-results.json';

export const popularMovies = popularMoviesData;
export const topRatedMovies = topRatedMoviesData;
export const popularTVShows = popularTVShowsData;
export const genres = genresData;
export const searchResults = searchResultsData;

export const getAllMovies = () => {
  const movies = [...popularMoviesData.results, ...topRatedMoviesData.results];
  return movies.filter(
    (movie, index, self) => index === self.findIndex(m => m.id === movie.id),
  );
};

export const getAllTVShows = () => {
  return popularTVShowsData.results;
};

export const getMovieGenres = () => {
  return genresData.movies;
};

export const getTVGenres = () => {
  return genresData.tv;
};

export const getAllGenres = () => {
  const combined = [...genresData.movies, ...genresData.tv];
  return combined.filter(
    (genre, index, self) => index === self.findIndex(g => g.id === genre.id),
  );
};

export const findMovieById = (id: number) => {
  const allMovies = getAllMovies();
  return allMovies.find(movie => movie.id === id);
};

export const findTVShowById = (id: number) => {
  return popularTVShowsData.results.find((show: any) => show.id === id);
};

export const searchContent = (query: string) => {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase();

  return searchResultsData.results.filter((item: any) => {
    const title = 'title' in item ? item.title : item.name;
    return (
      title?.toLowerCase().includes(searchTerm) ||
      item.overview.toLowerCase().includes(searchTerm)
    );
  });
};

export const filterMoviesByGenre = (genreId: number) => {
  return getAllMovies().filter(movie => movie.genre_ids.includes(genreId));
};

export const filterTVShowsByGenre = (genreId: number) => {
  return getAllTVShows().filter((show: any) =>
    show.genre_ids.includes(genreId),
  );
};
