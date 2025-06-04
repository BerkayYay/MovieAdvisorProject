# Mock Data Structure

This directory contains comprehensive mock data for the Movie Advisor app during Phase 1 development. The data follows TMDb API structure for easy future integration.

## Directory Structure

```
src/data/
├── movies/
│   ├── popular.json          # Popular movies data
│   └── top-rated.json        # Top-rated movies data
├── tvshows/
│   └── popular.json          # Popular TV shows data
├── search/
│   └── multi-results.json    # Mixed search results (movies + TV)
├── genres.json               # Genre definitions for movies and TV
├── index.ts                  # Helper functions and exports
└── README.md                 # This file
```

## Data Format

All data follows TMDb API v3 structure:

### Movies

- `id`: Unique identifier
- `title`: Movie title
- `poster_path`: Poster image path
- `backdrop_path`: Backdrop image path
- `overview`: Plot summary
- `release_date`: Release date (YYYY-MM-DD)
- `vote_average`: Rating (0-10)
- `vote_count`: Number of votes
- `genre_ids`: Array of genre IDs

### TV Shows

- `id`: Unique identifier
- `name`: Show name
- `poster_path`: Poster image path
- `backdrop_path`: Backdrop image path
- `overview`: Show summary
- `first_air_date`: First air date (YYYY-MM-DD)
- `vote_average`: Rating (0-10)
- `vote_count`: Number of votes
- `genre_ids`: Array of genre IDs

### Genres

- `movies`: Array of movie genres with `id` and `name`
- `tv`: Array of TV genres with `id` and `name`

## Usage Examples

```typescript
import {
  popularMovies,
  getAllMovies,
  findMovieById,
  filterMoviesByGenre,
  searchContent,
} from '../data';

// Get all popular movies
const movies = popularMovies.results;

// Get combined movie list (popular + top-rated, no duplicates)
const allMovies = getAllMovies();

// Find specific movie
const movie = findMovieById(1011985);

// Filter by genre (Action = 28)
const actionMovies = filterMoviesByGenre(28);

// Search across all content
const searchResults = searchContent('batman');
```

## Future Integration

This mock data structure is designed to match TMDb API responses exactly, making it easy to replace with real API calls in Phase 2:

1. Replace import statements with API calls
2. Update helper functions to use async/await
3. Add error handling and loading states
4. Implement caching strategies

## Content Summary

### Movies (20 items)

- Popular recent releases (Kung Fu Panda 4, Dune 2, etc.)
- Classic top-rated films (The Godfather, Pulp Fiction, etc.)
- Mix of genres: Action, Drama, Comedy, Sci-Fi, Animation

### TV Shows (10 items)

- Current popular series (House of the Dragon, Wednesday, etc.)
- High-rated shows across various genres
- Mix of ongoing and completed series

### Genres

- 19 movie genres (Action, Comedy, Drama, etc.)
- 16 TV genres (Action & Adventure, Comedy, etc.)

All data includes realistic ratings, vote counts, and popularity scores for authentic testing.
