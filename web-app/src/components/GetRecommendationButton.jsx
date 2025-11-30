import React from 'react';

function GetRecommendationButton({ onClick, disabled, children }) {

    const styles = {
        button: {
            // Base styles
            width: '80%',
            minWidth: '230px',
            padding: '16px 24px',
            margin: '0 auto',

            // Flexbox for centering content
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',               

            // Font Styles
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'white',            
            letterSpacing: '0.5px',

            // Appearance
            backgroundColor: '#FF4A6F', 
            border: 'none',
            borderRadius: '12px',

            // Logic inside style object (as requested in snippet)
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: disabled ? 'none' : '0 8px 20px rgba(255, 74, 111, 0.3)', // 그림자 효과 강화

            transition: 'all 0.3s ease',
            opacity: disabled ? 0.5 : 1,
            transform: disabled ? 'none' : 'translateY(0)',
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
