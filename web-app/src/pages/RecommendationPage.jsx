import LoadingSpinner from '../components/LoadingSpinner';
import GetRecommendationButton from '../components/GetRecommendationButton';
import RecommendationCard from '../components/RecommendationCard';



function RecommendationSection({ recommendations, isLoading, error, onSelectMovie }) {
    return (
        <>
            <h2 style={styles.sectionTitle}>
                <span style={{ marginRight: '10px' }}>★</span>
                Movie Recommendations
            </h2>

            {isLoading && (
                <div style={styles.loaderBox}>
                    <LoadingSpinner message="Curating movies just for you..." />
                </div>
            )}

            {!isLoading && error && (
                <div style={styles.errorBox}>
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && (
                <div style={styles.scrollContainer}>
                    {recommendations && recommendations.length > 0 ? (
                        recommendations.map((movie) => (
                            <div
                                key={movie.id || movie.title}
                                style={styles.cardWrapper}
                                onClick={() => onSelectMovie(movie.tmdbId)}
                            >
                                <RecommendationCard
                                    title={movie.title}
                                    rating={movie.rating}
                                    posterUrl={movie.posterUrl}
                                    onClick={() => onSelectMovie(movie.tmdbId)}
                                />
                            </div>
                        ))
                    ) : (
                        <div style={{ ...styles.emptyState, minWidth: '300px' }}>
                            <p style={styles.emptyText}>
                                No recommendations yet.<br />
                                Try capturing your emotion!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}


function PreviousWatchingSection({ recentWatched, onSelectMovie }) {
    
    const moviesToShow = (recentWatched || []).slice(0, 5);

    return (
        <>
            <h2 style={styles.sectionTitle}>
                <span style={{ marginRight: '10px' }}>⏱</span>
                Previously Watching
            </h2>

            <div style={styles.scrollContainer}>
                {moviesToShow.length > 0 ? (
                    moviesToShow.map((movie) => (
                        <div
                            key={movie.tmdbId}
                            style={styles.cardWrapper}
                            onClick={() => onSelectMovie(movie.tmdbId)}
                        >
                            <RecommendationCard
                                title={movie.title}
                                rating={movie.rating}
                                posterUrl={movie.posterUrl}
                                onClick={() => onSelectMovie(movie.tmdbId)}
                            />
                        </div>
                    ))
                ) : (
                    <div style={{ ...styles.emptyState, minWidth: '300px' }}>
                        <p style={styles.emptyText}>
                            we don'y have Previous Watching Movie..<br />
                            Add in Movie Detail!!
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}


//entire Page
function RecommendationsPage({
    recommendations,
    recentWatched,           
    isLoading,
    error,
    onSelectRecommendedMovie,
    onSelectPreviousMovie,
    onRecapture,
}) {
    return (
        <div style={styles.page}>
            {/* Header */}
            <nav style={styles.navbar}>
                <div style={styles.navContainer}>
                    <span style={styles.brand}>
                        <span style={{ marginRight: '8px' }}>🎬</span> Moodflix
                    </span>
                </div>
            </nav>

            <div style={styles.container}>
                {/* AI Recommendation Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GetRecommendationButton
                        onClick={onRecapture}
                        style={{ width: '200px' }}
                    >
                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>✨</span>
                        Get AI Recommendations
                    </GetRecommendationButton>
                </div>

                {/* section 1: AI recommendation */}
                <RecommendationSection
                    recommendations={recommendations}
                    isLoading={isLoading}
                    error={error}
                    onSelectMovie={onSelectRecommendedMovie}
                />

                {/* section 2: previous watching */}
                <PreviousWatchingSection
                    recentWatched={recentWatched}
                    onSelectMovie={onSelectPreviousMovie}
                />
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
        paddingBottom: '4rem',
    },

    navbar: {
        padding: '1.5rem 2rem',
        marginBottom: '1rem',
    },

    navContainer: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
    },

    brand: {
        fontWeight: 700,
        fontSize: '1.5rem',
    },

    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        boxSizing: 'border-box',
    },

    sectionTitle: {
        fontSize: '1.8rem',
        fontWeight: 700,
        marginTop: '2.5rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '3px solid #ff6b6b',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
    },

    scrollContainer: {
        display: 'flex',
        overflowX: 'auto',
        gap: '24px',
        paddingBottom: '20px',
        paddingTop: '10px',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
    },

    cardWrapper: {
        flex: '0 0 220px',
        maxWidth: '220px',
        cursor: 'pointer',
    },

    loaderBox: {
        display: 'flex',
        justifyContent: 'center',
        padding: '3rem 0',
    },

    errorBox: {
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'rgba(255, 99, 71, 0.2)',
        borderRadius: '12px',
        color: '#ffcccb',
    },

    emptyState: {
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        minWidth: '260px',
    },

    emptyText: {
        fontSize: '1.2rem',
        color: 'rgba(255, 255, 255, 0.6)',
    },
};

export default RecommendationsPage;

