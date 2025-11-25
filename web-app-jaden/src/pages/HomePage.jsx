import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMovies, fetchSeries } from '../api/tmdbApi';

function HomePage() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          fetchMovies(),
          fetchSeries()
        ]);
        setMovies(moviesData);
        setSeries(seriesData);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const renderCard = (item, type) => (
    <div key={item.id} className="col-md-3 mb-4">
      <Link to={`/movie/${item.id}`} className="text-white text-decoration-none">
        <div className="card h-100 bg-dark text-white border-0 movie-card">
          <img
            src={item.poster}
            alt={item.title}
            className="card-img-top"
            onError={(e) => {
              e.target.src = '/images/image1.png';
            }}
          />
          <div className="card-body">
            <h5 className="card-title">{item.title}</h5>
            <p className="card-text">⭐ Rating: {item.rating}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="container-fluid text-white p-5">
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark mb-5 pt-4">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="bi bi-play-circle"></i> Moodflix
          </span>
          <Link to="/emotion-detector" className="btn btn-primary">
            <i className="bi bi-emoji-smile"></i> Get AI Recommendations
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container-fluid mb-5">
        <div className="hero-section text-center">
          <h1 className="display-4 fw-bold mb-3">
            Welcome to Moodflix
          </h1>
          <p className="lead mb-4">
            AI-powered movie recommendations based on your mood, weather, and preferences
          </p>
          <Link to="/emotion-detector" className="btn btn-lg hero-btn">
            <i className="bi bi-camera"></i> Start Emotion Detection
          </Link>
        </div>
      </div>

      {/* Movies Section */}
      <div className="container-fluid mb-5">
        <h2 className="text-white mb-4">
          <i className="bi bi-film"></i> Movies
        </h2>
        <div className="row" id="movies-section">
          {movies.map(movie => renderCard(movie, 'movie'))}
        </div>
      </div>

      {/* Series Section */}
      <div className="container-fluid mb-5">
        <h2 className="text-white mb-4">
          <i className="bi bi-tv"></i> Series
        </h2>
        <div className="row" id="series-section">
          {series.map(show => renderCard(show, 'series'))}
        </div>
      </div>

      {/* Footer */}
      <footer className="container-fluid text-center text-white-50 py-4 mt-5">
        <p>Made with ❤️ by the Moodflix Team</p>
      </footer>
    </div>
  );
}

export default HomePage;
