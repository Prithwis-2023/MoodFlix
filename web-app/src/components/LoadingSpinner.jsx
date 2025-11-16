function LoadingSpinner({ message = "AI recommending..." }) {

    // Inline styles for layout
    const styles = {
        spinnerContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            color: '#333',
        },
        svgSpinner: {
            margin: '20px',
        },
        loadingText: {
            fontSize: '1.2em',
            fontWeight: 'bold',
            color: '#007bff', // A pleasant blue
        }
    };

    return (
        <div style={styles.spinnerContainer}>
            {/* This is an inline SVG spinner.
              It creates a "ripple" effect by animating the radius (r)
              and opacity (stroke-opacity) of two overlapping circles.
            */}
            <svg
                width="80"
                height="80"
                viewBox="0 0 44 44"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#007bff" // Spinner color
                style={styles.svgSpinner}
            >
                <g fill="none" fillRule="evenodd" strokeWidth="2">
                    <circle cx="22" cy="22" r="1">
                        {/* Animation for the first circle */}
                        <animate attributeName="r"
                            begin="0s" dur="1.8s"
                            values="1; 20"
                            calcMode="spline"
                            keyTimes="0; 1"
                            keySplines="0.165, 0.84, 0.44, 1"
                            repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity"
                            begin="0s" dur="1.8s"
                            values="1; 0"
                            calcMode="spline"
                            keyTimes="0; 1"
                            keySplines="0.3, 0.61, 0.355, 1"
                            repeatCount="indefinite" />
                    </circle>
                    <circle cx="22" cy="22" r="1">
                        {/* Animation for the second circle, starting 0.9s later */}
                        <animate attributeName="r"
                            begin="-0.9s" dur="1.8s"
                            values="1; 20"
                            calcMode="spline"
                            keyTimes="0; 1"
                            keySplines="0.165, 0.84, 0.44, 1"
                            repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity"
                            begin="-0.9s" dur="1.8s"
                            values="1; 0"
                            calcMode="spline"
                            keyTimes="0; 1"
                            keySplines="0.3, 0.61, 0.355, 1"
                            repeatCount="indefinite" />
                    </circle>
                </g>
            </svg>

            <p style={styles.loadingText}>{message}</p>
        </div>
    );
}

export default LoadingSpinner;