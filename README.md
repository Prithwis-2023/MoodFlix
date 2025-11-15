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
Moodflix/
├── networkproject.html           # Main page (movie list)
├── emotion-detector.html         # Emotion capture & recommendations page
├── emotion-detector.js           # Frontend emotion detector logic
├── movie.html                    # Movie detail page
├── movie.js                      # Movie detail renderer
├── data.js                       # Shared movie/series data
├── networkproject.javascript     # Main page rendering logic
├── api.js                        # Frontend API service
├── api_server.py                 # Flask backend API
├── user_logs.csv                 # User interaction history
└── images/                       # Movie poster images
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Flask: `pip install flask flask-cors`
- DeepFace & dependencies: `pip install deepface opencv-python librosa sounddevice`
- Ollama installed and running: https://ollama.ai

### Backend Setup (API Server)

1. Install dependencies:
```bash
pip install flask flask-cors cv2 deepface librosa sounddevice pandas scikit-learn requests geocoder geopy holidays
```

2. Start the API server:
```bash
python api_server.py
```

The server will run on `http://localhost:5000`

### Frontend Setup (Live Server)

1. Open VS Code in the project folder
2. Install Live Server extension (if not already installed)
3. Right-click `networkproject.html` → "Open with Live Server"
4. Browse to `http://127.0.0.1:5500`

## 📱 Usage

1. **View Movie Recommendations** — Open Moodflix to see the main movie catalog
2. **Click "Get AI Recommendations"** — Go to emotion capture page
3. **Allow Webcam Access** — Grant camera permission
4. **Capture Emotion** — Click "Capture" button (good lighting recommended)
5. **View Personalized Recommendations** — System analyzes emotion + context and recommends movies
6. **Select Movie** — Click any recommendation to see details and watch

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

## 📊 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
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
| "API server not running" | Make sure `python api_server.py` is executed |
| "Webcam permission denied" | Allow camera access in browser settings |
| "Emotion not detected" | Ensure good lighting, clear face visibility |
| "No recommendations" | Check if Ollama is running (`ollama serve`) |
| "Weather API error" | Verify internet connection and API key |

## 🚀 Future Enhancements

- [ ] User authentication & profiles
- [ ] Database migration (SQLite/PostgreSQL)
- [ ] Save trained ML model to file
- [ ] Real-time WebSocket updates
- [ ] Mobile app version
- [ ] Trailer playback integration
- [ ] Social recommendations (friends' picks)
- [ ] Advanced analytics dashboard

## 📝 License

This project is open source and available under the MIT License.

## 👥 Contributors

- Your Team Name
- AI/ML: Emotion detection, learning model
- Frontend: UI/UX design
- Backend: API integration

## 📞 Support

For issues or questions, open a GitHub issue or contact the development team.

---

**Made with ❤️ by the Moodflix Team**
