import React from 'react';

function GetRecommendationButton({ onClick, disabled, children }) {

    const styles = {
        button: {
            // Base styles
            padding: '12px 24px',
            fontSize: '1em',
            fontWeight: 'bold',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px', // Space between icon and text

            // Normal state (pink/red)
            backgroundColor: '#FF4A6F',
            boxShadow: '0 4px 12px rgba(255, 74, 111, 0.3)',
        },
        disabled: {
            // Disabled state (grayed out)
            backgroundColor: '#555',
            color: '#999',
            cursor: 'not-allowed',
            boxShadow: 'none',
        }
    };

    // Combine base style with disabled style if needed
    const buttonStyle = disabled
        ? { ...styles.button, ...styles.disabled }
        : styles.button;

    return (
        <button
            style={buttonStyle}
            onClick={onClick}
            disabled={disabled}
        >
            {/* You can add an icon here if needed, like the spark icon */}
            {/* <span role="img" aria-label="spark">✨</span> */}
            {children}
        </button>
    );
}

export default GetRecommendationButton;
