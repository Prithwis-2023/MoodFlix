import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieById, getPosterUrl } from '../api/tmdbApi';

function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const data = await fetchMovieById(id);
        setMovie(data);
      } catch (err) {
        console.error('Failed to fetch movie:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="container-fluid text-white p-5">
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container-fluid text-white p-5">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left"></i> Back to Home
        </button>
        <p className="mt-4">Movie not found.</p>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar navbar-dark mb-5 pt-4">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="bi bi-play-circle"></i> Moodflix
          </span>
        </div>
      </nav>

      <div className="container-fluid">
        <button className="back-btn mb-4" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left"></i> Back to Home
        </button>
      </div>

      <div className="container-fluid mt-5">
        <div className="row">
          <div className="col-md-4">
            <img
              src={getPosterUrl(movie.poster_path)}
              alt={movie.title}
              className="movie-poster"
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
              }}
            />
          </div>
          <div className="col-md-8">
            <h1 className="detail-title">{movie.title}</h1>
            <div className="rating-badge">
              ⭐ {movie.vote_average?.toFixed(1)} / 10
            </div>
            <p>
              {movie.runtime}m · {movie.release_date}
            </p>
            <p className="description-text mt-3">{movie.overview}</p>
            {movie.genres?.length > 0 && (
              <p className="mt-3">
                Genre: {movie.genres.map((g) => g.name).join(', ')}
              </p>
            )}
            <button className="action-btn mt-4">Watch Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetailPage;
