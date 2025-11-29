import React from 'react';

function RecommendationCard({ posterUrl, title, rating, onClick }) {

    const styles = {
        card: {
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#333652',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
        cardHover: {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        },
        posterImage: {
            width: '100%',
            height: 'auto',
            display: 'block',
        },
        info: {
            padding: '16px',
        },
        title: {
            color: '#FFFFFF',
            fontSize: '1.1em',
            fontWeight: 'bold',
            margin: '0 0 4px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        rating: {
            color: '#B0B0B0',
            fontSize: '0.9em',
            margin: '0',
        }
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        const placeholder = `https://placehold.co/600x900/333652/FFFFFF?text=${encodeURIComponent(title)}`;
        e.target.src = placeholder;
    };

    return (
        <div
            style={styles.card}
            onClick={onClick}
            onMouseEnter={e => {
                Object.assign(e.currentTarget.style, styles.cardHover);
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = styles.card.boxShadow;
            }}
        >
            <img
                src={posterUrl}
                alt={`Poster for ${title}`}
                style={styles.posterImage}
                onError={handleImageError}
            />
            <div style={styles.info}>
                <h3 style={styles.title} title={title}>{title}</h3>
                <p style={styles.rating}>Rating: {rating}</p>
            </div>
        </div>
    );
}

export default RecommendationCard;