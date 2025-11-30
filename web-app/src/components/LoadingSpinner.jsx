import React from 'react';

function LoadingSpinner({ message = "Analyzing your mood..." }) {

    return (
        <div className="mf-loading-container">
            <div className="mf-logo-wrapper">
                <div className="mf-logo-m">M</div>
                <div className="mf-light-bar" />
            </div>
            <p className="mf-loading-text">{message}</p>

            <style>
                {`
      /* container*/
      .mf-loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 40px;
      }

      /* logo */
      .mf-logo-wrapper {
        position: relative;
        width: 80px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      /* ✔ Moodflix M logo*/
      .mf-logo-m {
        font-size: 96px;
        font-weight: 900;
        font-family: Arial, sans-serif;
        color: #FF4A6F; /* Moodflix 시그니처 핑크 */
        text-shadow:
          0 0 12px rgba(255, 74, 111, 0.8),
          0 0 24px rgba(255, 74, 111, 0.6),
          0 0 40px rgba(255, 74, 111, 0.4);
        animation: mfPulse 1.4s infinite ease-in-out;
      }

      /* lighy effect */
      .mf-light-bar {
        position: absolute;
        top: -10%;
        left: -60%;
        width: 40%;
        height: 120%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.9) 50%,
          transparent 100%
        );
        filter: blur(2px);
        transform: skewX(-15deg);
        opacity: 0.9;
        animation: mfLightSweep 1.6s infinite;
      }

      /* text */
      .mf-loading-text {
        color: #ffffff;
        font-size: 1.05em;
        font-weight: 600;
        letter-spacing: 0.03em;
      }

      /* pulse*/
      @keyframes mfPulse {
        0% {
          transform: scale(1);
          text-shadow:
            0 0 8px rgba(255, 74, 111, 0.7),
            0 0 20px rgba(255, 74, 111, 0.4);
        }
        50% {
          transform: scale(1.04);
          text-shadow:
            0 0 16px rgba(255, 74, 111, 1),
            0 0 32px rgba(255, 74, 111, 0.8),
            0 0 52px rgba(255, 74, 111, 0.6);
        }
        100% {
          transform: scale(1);
          text-shadow:
            0 0 8px rgba(255, 74, 111, 0.7),
            0 0 20px rgba(255, 74, 111, 0.4);
        }
      }

      /* ✨ sweeping light bar */
      @keyframes mfLightSweep {
        0% {
          transform: translateX(0) skewX(-15deg);
          opacity: 0;
        }
        20% {
          opacity: 0.9;
        }
        60% {
          opacity: 0.9;
        }
        100% {
          transform: translateX(220%) skewX(-15deg);
          opacity: 0;
        }
      }
        `}
            </style>
        </div>
    );
}

export default LoadingSpinner;
