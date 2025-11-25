import { useState, useEffect } from 'react';
import './App.css';

import CapturePage from './pages/CapturePage';

import { fetchMoviesByIds, fetchMovieById, getPosterUrl, searchMovieByTitle } from './api/tmdbApi';

import LoadingSpinner from './components/LoadingSpinner';
import RecommendationCard from './components/RecommendationCard';
import GetRecommendationButton from './components/GetRecommendationButton';
import MovieDetailPage from './pages/MovieDetailPage';
import RecommendationsPage from './pages/RecommendationPage';

function App() {
  const [view, setView] = useState('capture');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [recentWatched, setRecentWatched] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  //test Data
  useEffect(() => {
    if (view !== 'recommendations') return;

    
    const mockTitles = [
      "interstellar", 
      "joker", 
      "Bridget Jones: Mad About the Boy", 
      "The Dark Knight", 
      "The Shawshank Redemption"
    ];

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const movies = [];

        
        for (const title of mockTitles){
          const results = await searchMovieByTitle(title);
          if(results.length>0){
            movies.push(results[0]);
          }
        }

        const formatted = movies.map(m => ({
          id: m.id,
          tmdbId: m.id,
          title: m.title,
          rating: m.vote_average?.toFixed(1) ?? 'N/A',
          posterUrl: getPosterUrl(m.poster_path),
        }));

        setRecommendations(formatted);
      } catch (e) {
        setError('failed recommedation');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [view]);
  
  //handle previous Watching list
  const handleAddRecentWatched = (movie) => {
    setRecentWatched((prev) => {
      const filtered = prev.filter((m) => m.tmdbId !== movie.tmdbId); 
      const updated = [movie, ...filtered];
      return updated.slice(0, 5); 
    });
  };

  //lendering detail page
  if (view === 'detail' && selectedMovieId) {
    return (
      <MovieDetailPage
        tmdbId={selectedMovieId}
        onBack={() => setView('recommendations')}
        onAddRecentWatched={handleAddRecentWatched}
      />
    );
  }

  //capture page
  if (view === 'capture') {
    return (
      <CapturePage
        setRecommendations={setRecommendations}
        setView={setView}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        error={error}
        setError={setError}
      />
    );
  }

  //recommendation page
  return (
    <RecommendationsPage
      recommendations={recommendations}
      recentWatched={recentWatched}
      isLoading={isLoading}
      error={error}
      onRecapture={() => setView('capture')}
      onSelectMovie={(tmdbId) => {
        setSelectedMovieId(tmdbId);
        setView('detail');
      }}
    />
  );
  
}

export default App;


