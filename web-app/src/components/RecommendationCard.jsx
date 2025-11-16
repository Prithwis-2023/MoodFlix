import React from 'react';



function RecommendationCard({ posterUrl, title, rating }) {

    // Inline styles based on the provided design image
    const styles = {
        // The main card container
        card: {
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#333652', // Dark card background
            borderRadius: '12px',       // Rounded corners
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',         // To keep the image corners rounded
            display: 'flex',
            flexDirection: 'column',
            height: '100%',             // Fill the grid cell
        },
        // Poster image
        posterImage: {
            width: '100%',
            height: 'auto',             // Maintain aspect ratio
            display: 'block',
            // No border-radius here, the image itself seems to have it
        },
        // Container for text content (title, rating)
        info: {
            padding: '16px',
        },
        // Movie title
        title: {
            color: '#FFFFFF',           // White text
            fontSize: '1.1em',
            fontWeight: 'bold',
            margin: '0 0 4px 0',      // Margin bottom 4px
            whiteSpace: 'nowrap',       // Prevent title from wrapping
            overflow: 'hidden',
            textOverflow: 'ellipsis',   // Add '...' if title is too long
        },
        // Rating text
        rating: {
            color: '#B0B0B0',           // Light gray text
            fontSize: '0.9em',
            margin: '0',
        }
    };

    /**
     * Handles image loading errors by replacing the broken image
     * with a placeholder from placehold.co
     */
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        // Placeholder image URL
        const placeholder = `https://placehold.co/600x900/333652/FFFFFF?text=${encodeURIComponent(title)}`;
        e.target.src = placeholder;
    };

    return (
        <div style={styles.card}>
            <img
                src={posterUrl}
                alt={`Poster for ${title}`}
                style={styles.posterImage}
                // Add an error handler for broken poster links
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