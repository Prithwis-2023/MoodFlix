import { useState, useEffect } from 'react';
import './App.css';

import CapturePage from './pages/CapturePage';

import { fetchMoviesByIds, fetchMovieById, getPosterUrl, searchMovieByTitle } from './api/tmdbApi';

import LoadingSpinner from './components/LoadingSpinner';
import RecommendationCard from './components/RecommendationCard';
import GetRecommendationButton from './components/GetRecommendationButton';
import MovieDetailPage from './pages/MovieDetailPage';
import RecommendationsPage from './pages/RecommendationPage';
import CapturePage1 from './pages/CapturePage1';

function App() {
  const [view, setView] = useState('capture');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [recentWatched, setRecentWatched] = useState([]);
  const [serverTitles, setServerTitles] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFromPrevious, setIsFromPrevious] = useState(false);


  useEffect(() => {
    // 제목 리스트가 비어있으면 아무 것도 안 함
    if (!serverTitles || serverTitles.length === 0) return;

    let canceled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const movies = [];

        // 각 title에 대해 TMDB 검색
        for (const title of serverTitles) {
          try {
            const results = await searchMovieByTitle(title);
            if (results && results.length > 0) {
              movies.push(results[0]); // 일단 1순위 결과만 사용
            } else {
              console.warn('no TMDB result for title:', title);
            }
          } catch (err) {
            console.error('TMDB search error for title:', title, err);
          }
        }

        // TMDB raw 결과 → RecommendationPage용 객체 배열로 변환
        const formatted = movies.map((m) => ({
          id: m.id,
          tmdbId: m.id,
          title: m.title,
          rating: m.vote_average != null ? m.vote_average.toFixed(1) : 'N/A',
          posterUrl: getPosterUrl(m.poster_path),
        }));

        if (!canceled) {
          setRecommendations(formatted);
          setView('recommendations');
        }
      } catch (e) {
        console.error('failed recommendation from TMDB:', e);
        if (!canceled) {
          setError('failed recommendation');
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [serverTitles]);
  
  //handle previous Watching list
  const handleAddRecentWatched = (movie) => {
    
    const tmdbId = movie.tmdbId ?? movie.id;

    const normalized = {
      tmdbId,
      title: movie.title,
      rating:
        movie.rating ?? 
        (movie.vote_average != null
          ? movie.vote_average.toFixed(1)
          : 'N/A'),
      posterUrl:
        movie.posterUrl ?? 
        getPosterUrl(movie.poster_path),
    };

    setRecentWatched((prev) => {
      const filtered = prev.filter((m) => m.tmdbId !== normalized.tmdbId);
      return [normalized, ...filtered].slice(0, 5);
    });
  };

  const handleSelectRecommendedMovie = (tmdbId) => {
    setSelectedMovieId(tmdbId);
    setIsFromPrevious(false);
    setView('detail');
  };

  const handleSelectPreviousMovie = (tmdbId) => {
    setSelectedMovieId(tmdbId);
    setIsFromPrevious(true);
    setView('detail');
  };

  const handleRemoveFromRecent = (tmdbId) => {
    setRecentWatched((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
  };

  //lendering detail page
  if (view === 'detail' && selectedMovieId) {
    return (
      <MovieDetailPage
        tmdbId={selectedMovieId}
        onBack={() => setView('recommendations')}
        onAddRecentWatched={handleAddRecentWatched}
        isFromPrevious={isFromPrevious}
        onRemoveFromRecent={handleRemoveFromRecent}
      />
    );
  }

  //capture page
  if (view === 'capture') {
    return (
      <CapturePage
        setRecommendations={setServerTitles}
        setView={setView}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        error={error}
        setError={setError}
      />
    );
  }

  const env = useEnvironment();
  //recommendation page
  return (
    <RecommendationsPage
      recommendations={recommendations}
      recentWatched={recentWatched}
      isLoading={isLoading}
      error={error}
      onRecapture={() => setView('capture')}
      onSelectRecommendedMovie={handleSelectRecommendedMovie}
      onSelectPreviousMovie={handleSelectPreviousMovie}
      env={env} 
    />
  );
  
}

export default App;


