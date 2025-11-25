import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getContext, 
  detectEmotion, 
  getMovieRecommendations, 
  checkAPIHealth,
  captureCanvasAsBase64,
  logSelection
} from '../api/apiService';
import { movies } from '../data/content';

function EmotionDetectorPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [currentContext, setCurrentContext] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check API health
      const isHealthy = await checkAPIHealth();
      setApiHealthy(isHealthy);

      // Initialize webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Webcam error:', error);
        setMessage({
          text: 'Cannot access webcam. Check browser permissions.',
          type: 'error'
        });
      }

      // Load context if API is available
      if (isHealthy) {
        const context = await getContext();
        setCurrentContext(context);
      }
    };

    init();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCaptureEmotion = async () => {
    if (!apiHealthy) {
      setMessage({
        text: '⚠️ Backend not connected. Deploy api_server.py for AI emotion detection.',
        type: 'error'
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageBase64 = captureCanvasAsBase64(canvas);

    setLoading(true);
    setMessage({ text: 'Analyzing emotion...', type: 'info' });

    const emotionResult = await detectEmotion(imageBase64);
    setLoading(false);

    if (emotionResult) {
      setCurrentEmotion(emotionResult);
      setMessage({
        text: '✅ Emotion detected! Click "Get Recommendations" to see personalized movies.',
        type: 'success'
      });
    } else {
      setMessage({
        text: '❌ Could not detect emotion. Try again with better lighting.',
        type: 'error'
      });
    }
  };

  const handleGetRecommendations = async () => {
    if (!currentEmotion || !currentContext) {
      setMessage({ text: '❌ Please capture emotion first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Getting recommendations...', type: 'info' });

    const availableMovies = movies.map(m => m.title);
    const result = await getMovieRecommendations(
      currentEmotion, 
      currentContext, 
      [], 
      availableMovies
    );

    setLoading(false);

    if (result && result.recommendations.length > 0) {
      setRecommendations(result);
      setMessage({
        text: '✅ Recommendations loaded based on your mood!',
        type: 'success'
      });
    } else {
      setMessage({
        text: '❌ Could not get recommendations. Try again.',
        type: 'error'
      });
    }
  };

  const handleMovieClick = (movieTitle) => {
    if (currentEmotion && currentContext) {
      logSelection(movieTitle, currentEmotion, currentContext);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark mb-5 pt-4">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">
            <i className="bi bi-play-circle"></i> Moodflix
          </Link>
          <Link to="/" className="btn btn-outline-light">
            <i className="bi bi-house"></i> Home
          </Link>
        </div>
      </nav>

      <div className="container-fluid">
        <h1 className="text-white mb-4">
          <i className="bi bi-emoji-smile"></i> AI Emotion Detection
        </h1>

        {/* API Status Warning */}
        {!apiHealthy && (
          <div className="alert alert-danger mb-4" role="alert">
            <i className="bi bi-exclamation-triangle"></i> API server is not running. 
            Start <code>api_server.py</code> to use AI recommendations.
          </div>
        )}

        {/* Status Message */}
        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : 'info'} mb-4`}>
            {message.text}
          </div>
        )}

        {/* Webcam Section */}
        <div className="row mb-5">
          <div className="col-md-6">
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="webcam-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="text-center mt-3">
              <button 
                className="btn btn-primary btn-lg me-3"
                onClick={handleCaptureEmotion}
                disabled={loading}
              >
                <i className="bi bi-camera"></i> Capture Emotion
              </button>
              <button 
                className="btn btn-success btn-lg"
                onClick={handleGetRecommendations}
                disabled={loading || !currentEmotion}
              >
                <i className="bi bi-stars"></i> Get Recommendations
              </button>
            </div>
          </div>

          <div className="col-md-6">
            {/* Emotion Display */}
            {currentEmotion && (
              <div className="emotion-card mb-4">
                <h3>Detected Emotion</h3>
                <div className="emotion-value">{currentEmotion.emotion.toUpperCase()}</div>
                <p className="confidence-text">
                  Confidence: {(currentEmotion.confidence * 100).toFixed(1)}%
                </p>
                <p className="mt-3">
                  <strong>Voice Tone:</strong> {currentEmotion.voice_tone || 'neutral'}
                </p>
              </div>
            )}

            {/* Context Display */}
            {currentContext && (
              <div className="context-card">
                <h3>Your Context</h3>
                <p><i className="bi bi-geo-alt"></i> <strong>Location:</strong> {currentContext.city}</p>
                <p><i className="bi bi-cloud"></i> <strong>Weather:</strong> {currentContext.weather}</p>
                <p><i className="bi bi-thermometer"></i> <strong>Temperature:</strong> {currentContext.temperature}°C</p>
                <p><i className="bi bi-calendar"></i> <strong>Day Status:</strong> {currentContext.today_status}</p>
                <p><i className="bi bi-clock"></i> <strong>Weekday:</strong> {currentContext.weekday}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations && (
          <div className="recommendations-section">
            <h2 className="text-white mb-4">
              <i className="bi bi-stars"></i> Recommended For You
            </h2>
            <p className="text-white-50 mb-4">{recommendations.reasoning}</p>
            <div className="row">
              {recommendations.recommendations.map((movieTitle, index) => {
                const movie = movies.find(m => 
                  m.title.toLowerCase() === movieTitle.toLowerCase()
                );
                
                if (!movie) return null;

                return (
                  <div key={index} className="col-md-6 col-lg-4 mb-4">
                    <Link 
                      to={`/movie/${movie.id}`}
                      className="text-white text-decoration-none"
                      onClick={() => handleMovieClick(movie.title)}
                    >
                      <div className="recommendation-card">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="recommendation-img"
                          onError={(e) => {
                            e.target.src = '/images/image1.png';
                          }}
                        />
                        <div className="recommendation-body">
                          <h5>{movie.title}</h5>
                          <p className="rating-text">⭐ {movie.rating}/10</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmotionDetectorPage;
