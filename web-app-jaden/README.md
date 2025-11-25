# Moodflix 🎬

An AI-powered movie recommendation platform that uses emotion detection, weather, location, and user preferences to suggest personalized movies.

## 🎯 Features

- **Emotion Detection** — Uses DeepFace to detect emotions from webcam
- **Weather Integration** — Gets real-time weather data from OpenWeatherMap API
- **Location Awareness** — Detects user location via IP geolocation
- **Day Status Detection** — Recognizes holidays, weekends, and weekdays
- **LLM Powered Recommendations** — Uses Ollama (llama2) for intelligent movie suggestions
- **Learning Model** — RandomForest classifier learns from user preferences over time
- **Beautiful UI** — Modern Bootstrap-based responsive design
- **Lightweight Frontend** — Pure vanilla JavaScript, no heavy frameworks (~95KB total)

## 📁 Project Structure

```
moodflix/
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main app component with routing
│   ├── pages/
│   │   ├── HomePage.jsx            # Main page (movie/series list)
│   │   ├── EmotionDetectorPage.jsx # Emotion capture & recommendations
│   │   └── MovieDetailPage.jsx     # Movie detail page
│   ├── api/
│   │   ├── apiService.js           # Backend API service
│   │   └── tmdbApi.js              # Movie data API wrapper
│   ├── data/
│   │   └── content.js              # Movies & series data
│   └── styles/
│       └── MoodflixStyles.css      # Custom styles
├── public/
│   ├── 404.html                    # SPA redirect handler
│   └── images/                     # Movie poster images
├── vite.config.js                  # Vite configuration
├── package.json                    # Node dependencies
├── api_server.py                   # Flask backend API (optional)
├── api_server_simple.py            # Simplified backend (optional)
├── requirements.txt                # Python dependencies
├── DEPLOYMENT.md                   # Deployment guide
└── README.md                       # Project documentation
```

## 🚀 Quick Start

### Live Demo
**Visit the deployed app:** [https://jaden769.github.io/MoodFlix/](https://jaden769.github.io/MoodFlix/)

The app is deployed on GitHub Pages and works without backend setup. AI features require backend deployment (optional).

### Local Development

#### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ (optional, for AI backend)

#### Frontend Setup (Required)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5500`

#### Backend Setup (Optional - for AI features)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the API server:
```bash
python api_server.py
```

The server will run on `http://localhost:5000`

**Note:** Backend is optional. The app works without it, but AI emotion detection requires the backend.

## 📱 Usage

1. **Browse Movies** — View the main movie and series catalog on the homepage
2. **View Movie Details** — Click on any movie card to see full information
3. **AI Recommendations (requires backend):**
   - Navigate to the emotion detection page
   - Allow webcam access when prompted
   - Click "Capture Emotion" (good lighting recommended)
   - Get AI-powered personalized movie suggestions

## 🔌 API Endpoints

### `GET /api/health`
Health check.

### `GET /api/context`
Returns location, weather, day status, etc.
```json
{
  "city": "Seoul",
  "weather": "few clouds",
  "temperature": 14.76,
  "today_status": "Weekend",
  "tomorrow_status": "Weekday",
  "weekday": "Sunday"
}
```

### `POST /api/emotion`
Detects emotion from image (base64).
```json
Request: { "image": "base64_image_data" }
Response: { "emotion": "happy", "confidence": 0.92 }
```

### `POST /api/recommend`
Gets AI-powered movie recommendations.
```json
Request: {
  "emotion": "happy",
  "weather": "rainy",
  "temperature": 20,
  "city": "Seoul",
  "today_status": "Weekend",
  "watched_movies": ["Parasite"],
  "voice_tone": "happy",
  "available_movies": ["Movie1", "Movie2", ...]
}
Response: {
  "recommendations": ["Parasite", "Dune", "Inception"],
  "emotion": "happy",
  "reasoning": "Recommended for your happy mood..."
}
```

### `POST /api/log-selection`
Logs user's movie selection for learning.

## 🧠 How AI Recommendations Work

1. **Emotion Detection** (DeepFace)
   - Captures webcam frame
   - Detects facial emotion (angry, disgust, fear, happy, sad, surprise, neutral)
   - Returns confidence score

2. **Context Collection**
   - Gets user's location via IP
   - Fetches real-time weather
   - Detects day type (weekend/holiday/weekday)
   - Analyzes voice tone from audio

3. **LLM Recommendation** (Ollama)
   - Creates prompt with all context
   - Calls local Ollama model
   - Gets 5 initial movie recommendations

4. **Learning Model** (RandomForest)
   - Reads user history from CSV
   - Trains model on past selections
   - Ranks recommendations based on historical patterns
   - Learns: emotion + weather + location + day → movie preference

5. **Final Output**
   - Combines LLM + ML model rankings
   - Returns personalized top 5 movies

## 🎨 Design

- **Modern Gradient Background** — Dark purple/blue gradient
- **Responsive Grid Layout** — Bootstrap 5 for all screen sizes
- **Smooth Animations** — Cards lift on hover with glow effect
- **Accessible Icons** — Bootstrap Icons for visual hierarchy
- **Consistent Branding** — Red accent color (#ff6b6b) throughout
- **React Router** — Seamless client-side navigation

## 📊 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router v6 |
| Styling | Bootstrap 5, Custom CSS |
| Backend | Python Flask |
| Emotion Detection | DeepFace (TensorFlow) |
| Audio Analysis | Librosa |
| ML Model | Scikit-learn RandomForest |
| LLM | Ollama (llama2) |
| Location | Geocoder, Geopy |
| Weather | OpenWeatherMap API |
| Database | CSV (user_logs.csv) |

## 🔑 Configuration

Edit these in `api_server.py`:

```python
CONFIDENCE_THRESHOLD = 0.4           # Min emotion confidence
EMOTION_HISTORY_LEN = 10             # Frames to average
OLLAMA_MODEL = "llama2"              # LLM model name
WEATHER_API_KEY = "your_api_key"    # OpenWeatherMap key
COUNTRY_CODE = "US"                  # For holiday detection
SAMPLE_RATE = 16000                  # Audio sample rate
DURATION = 10                        # Audio recording duration
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "npm command not found" | Install Node.js from https://nodejs.org/ |
| "API server not running" | Make sure `python api_server.py` is executed |
| "Port 5500 in use" | Change port in `vite.config.js` or stop other servers |
| "Webcam permission denied" | Allow camera access in browser settings |
| "Emotion not detected" | Ensure good lighting, clear face visibility |
| "No recommendations" | Check if Ollama is running (`ollama serve`) |
| "Weather API error" | Verify internet connection and API key |
| "Module not found" | Run `npm install` to install dependencies |

## 🚀 Deployment

The app is deployed on GitHub Pages at: https://jaden769.github.io/MoodFlix/

To deploy your own version:

```bash
npm run build        # Build for production
npm run deploy       # Deploy to GitHub Pages
```

For backend deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🚀 Future Enhancements

- [x] React migration for modern component-based architecture
- [x] Client-side routing with React Router
- [x] GitHub Pages deployment
- [ ] Backend deployment to Render
- [ ] User authentication & profiles
- [ ] Real TMDB API integration
- [ ] Trailer playback integration
- [ ] Social recommendations (friends' picks)
- [ ] TypeScript migration for type safety

## 📝 License

This project is open source and available under the MIT License.

## 👥 Contributors

- Jaden - Full Stack Development
- AI/ML: Emotion detection, learning model
- Frontend: React, UI/UX design
- Backend: Flask API integration

## 📞 Support

For issues or questions, open a GitHub issue or contact the development team.

---

**Made with ❤️ by the Moodflix Team**
 
 