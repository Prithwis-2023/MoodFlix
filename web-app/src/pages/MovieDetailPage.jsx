import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMovieById, getPosterUrl } from '../api/tmdbApi';
import { sendInferenceLog } from '../api/inferenceAPI'; 

function MovieDetailPage({ tmdbId, env, onBack, onAddRecentWatched, isFromPrevious, onRemoveFromRecent,mood,tone }) {
    const [movie, setMovie] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    const handleRemove = () => {
        if (onRemoveFromRecent) {
            onRemoveFromRecent(tmdbId);  
        }
        onBack();                      
    };

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
            <div style={styles.page}>
                <div style={styles.centerBox}>
                    <LoadingSpinner message="Loading movie information..." />
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div style={styles.page}>
                <nav style={styles.navbar}>
                    <div style={styles.navContainer}>
                        <span style={styles.brand}>
                            🎬 Moodflix
                        </span>
                    </div>
                </nav>

                <div style={styles.container}>
                    <button style={styles.backBtn} onClick={onBack}>
                        <span style={{ marginRight: 6 }}>⟵</span> Back to Recommendations
                    </button>
                    <p style={{ marginTop: 24, color: '#fff' }}>
                        Can't find movie details.
                    </p>
                </div>
            </div>
        );
    }

    const posterUrl = getPosterUrl(movie.poster_path);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const runtime = movie.runtime ? `${movie.runtime} min` : '';
    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : '';
    const genres =
        movie.genres && movie.genres.length > 0
            ? movie.genres.map((g) => g.name).join(', ')
            : null;

    
    
    const handleAddToWatchlist = async () => {
        if (!onAddRecentWatched) return;

        
        const recentMovie = {
            tmdbId,                       
            title: movie.title,
            rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
            posterUrl,                   
        };
        onAddRecentWatched(recentMovie);

        const clientSentAt = new Date().toISOString();  

        try {
            const result = await sendInferenceLog({
                clientSentAt,
                env,
                movieTitle: movie.title,
                mood,
                tone,
            });

            console.log(`[Server Log] Log sent successfully for '${movie.title}'`);
            console.log("[Server Log] Response:", result);

        } catch (err) {
            console.error(`[Server Log] Failed to send log for '${movie.title}':`, err);
        }

        

    };
    return (
        <div style={styles.page}>
            {/* Navigation */}
            <nav style={styles.navbar}>
                <div style={styles.navContainer}>
                    <span style={styles.brand}>
                        <span style={{ marginRight: 8 }}>🎬</span> Moodflix
                    </span>
                </div>
            </nav>

            <div style={styles.container}>
                {/* Back button */}
                <button style={styles.backBtn} onClick={onBack}>
                    <span style={{ marginRight: 6 }}>⟵</span> Back to Recommendations
                </button>

                {/* Detail Content */}
                <div style={styles.content}>
                    {/* Poster */}
                    <div style={styles.posterWrapper}>
                        <img
                            src={posterUrl}
                            alt={movie.title}
                            style={styles.poster}
                        />
                    </div>

                    {/* Info */}
                    <div style={styles.info}>
                        <h1 style={styles.title}>{movie.title}</h1>

                        <div style={styles.ratingBadge}>
                            ⭐ {rating} / 10
                        </div>

                        <p style={styles.metaText}>
                            {releaseYear && <span>{releaseYear}</span>}
                            {releaseYear && runtime && <span style={styles.dot}>•</span>}
                            {runtime && <span>{runtime}</span>}
                            {genres && (
                                <>
                                    <span style={styles.dot}>•</span>
                                    <span>{genres}</span>
                                </>
                            )}
                        </p>

                        <p style={styles.description}>
                            {movie.overview || 'No description available for this movie.'}
                        </p>

                        
                        <div style={{ marginTop: '2rem' }}>
                            <button style={styles.actionBtn}
                                onClick={handleAddToWatchlist}>
                                Add to Watchlist
                            </button>
                            {isFromPrevious && (                          
                                <button
                                    style={{ ...styles.actionBtn, background: '#555' }}
                                    onClick={handleRemove}
                                >
                                    Remove from Previously Watching
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: '#fff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    navbar: {
        padding: '1.5rem 2rem 0.5rem',
    },
    navContainer: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    brand: {
        fontWeight: 700,
        fontSize: '1.5rem',
        letterSpacing: '1px',
        display: 'inline-flex',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 3rem',
        boxSizing: 'border-box',
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#ff6b6b',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        marginTop: '0.5rem',
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
        transition: 'all 0.3s ease',
    },
    content: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2.5rem',
        alignItems: 'flex-start',
    },
    posterWrapper: {
        flex: '0 0 280px',
        maxWidth: '320px',
    },
    poster: {
        width: '100%',
        height: 'auto',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(255, 107, 107, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    info: {
        flex: '1 1 300px',
        minWidth: '0',
    },
    title: {
        fontSize: '2.3rem',
        fontWeight: 700,
        marginBottom: '1rem',
    },
    ratingBadge: {
        display: 'inline-block',
        background: '#ff6b6b',
        color: '#fff',
        padding: '0.45rem 1.4rem',
        borderRadius: '50px',
        fontWeight: 600,
        marginBottom: '1.3rem',
        fontSize: '0.95rem',
    },
    metaText: {
        fontSize: '0.95rem',
        color: '#ccc',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        alignItems: 'center',
    },
    dot: {
        opacity: 0.6,
    },
    description: {
        fontSize: '1.05rem',
        lineHeight: 1.7,
        color: '#ddd',
        maxWidth: '700px',
    },
    actionBtn: {
        background: '#ff6b6b',
        border: 'none',
        color: '#fff',
        padding: '0.75rem 2rem',
        fontWeight: 600,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    centerBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
    },
};

export default MovieDetailPage;