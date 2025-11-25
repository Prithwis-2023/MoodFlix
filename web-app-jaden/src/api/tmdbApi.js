/**
 * TMDB-like API wrapper for local movie data
 */

import { movies, series, allContent } from '../data/content';

/**
 * Fetch all movies
 */
export async function fetchMovies() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(movies), 100);
  });
}

/**
 * Fetch all series
 */
export async function fetchSeries() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(series), 100);
  });
}

/**
 * Fetch movie by ID
 */
export async function fetchMovieById(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const movie = allContent.find(item => item.id === parseInt(id));
      if (movie) {
        resolve(movie);
      } else {
        reject(new Error('Movie not found'));
      }
    }, 100);
  });
}

/**
 * Get poster URL (handles local images)
 */
export function getPosterUrl(posterPath) {
  if (!posterPath) return '/images/placeholder.jpg';
  // If it's already a full path, return as is
  if (posterPath.startsWith('/') || posterPath.startsWith('http')) {
    return posterPath;
  }
  return `/images/${posterPath}`;
}

/**
 * Search movies by title
 */
export async function searchMovies(query) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = allContent.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      resolve(results);
    }, 100);
  });
}
