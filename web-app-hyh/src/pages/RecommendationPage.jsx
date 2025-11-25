import LoadingSpinner from '../components/LoadingSpinner';
import GetRecommendationButton from '../components/GetRecommendationButton';
import RecommendationCard from '../components/RecommendationCard';



function RecommendationsPage({ recommendations, isLoading, error, onSelectMovie, onRecapture, }) {
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
                    <GetRecommendationButton onClick={onRecapture}
                        style={{ width: "200px" } }>
                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>✨</span>
                        Get AI Recommendations
                    </GetRecommendationButton>
                </div>

                {/* Section Title */}
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

                {/* Horizontal Scroll Area */}
                {!isLoading && (
                    <div style={styles.scrollContainer}>
                        {recommendations && recommendations.length > 0 ? (
                            recommendations.map((movie) => (
                                <div
                                    key={movie.id || movie.title}
                                    style={styles.cardWrapper}
                                    onClick={() => onMovieClick(movie)}
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
            </div>
        </div>
    );
}

// 스타일 전체
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

    buttonWrapper: {
        textAlign: 'center',
        marginBottom: '3rem',
    },

    sectionTitle: {
        fontSize: '1.8rem',
        fontWeight: 700,
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

