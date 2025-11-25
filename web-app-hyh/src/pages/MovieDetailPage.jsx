import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMovieById, getPosterUrl } from '../api/tmdbApi';


function MovieDetailPage({ tmdbId, onBack }) {
    const [movie, setMovie] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchMovieById(tmdbId);
                setMovie(data);
            } catch (e) {
                console.error('MovieDetailPage fetch error:', e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [tmdbId]);

    if (isLoading) {
        return (
            <div style={{ padding: 32 }}>
                <LoadingSpinner message="Loading movie information.." />
            </div>
        );
    }

    if (!movie) {
        return (
            <div style={{ padding: 32, color: 'white' }}>
                <button onClick={onBack}>← Back</button>
                <p style={{ marginTop: 16 }}>Can't find movie details.</p>
            </div>
        );
    }

    const posterUrl = getPosterUrl(movie.poster_path);

    return (
        <div style={{ padding: 32, color: 'black' }}>
            <button onClick={onBack}>← Back</button>

            <div style={{ display: 'flex', gap: 32, marginTop: 24 }}>
                <img
                    src={posterUrl}
                    alt={movie.title}
                    style={{
                        width: 300,
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                />

                <div>
                    <h2>{movie.title}</h2>
                    <p>⭐ {movie.vote_average?.toFixed(1)} / 10</p>
                    <p>
                        {movie.runtime}m · {movie.release_date}
                    </p>
                    <p style={{ marginTop: 16 }}>{movie.overview}</p>

                    {movie.genres && movie.genres.length > 0 && (
                        <p>genre: {movie.genres.map((g) => g.name).join(', ')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MovieDetailPage;