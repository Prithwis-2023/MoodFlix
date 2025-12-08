# MoodFlix Client Architecture

The MoodFlix client is a **React-based Single Page Application (SPA)** that captures multimodal user input (video, audio, environment) and communicates with the Jetson AI server for emotion-aware movie recommendations.

---

## **Architecture Overview**

```
┌─────────────────────────────────────────────────────┐
│                    App.jsx (Root)                   │
│         - View State Management (capture/          │
│           recommendations/detail)                   │
│         - Data Flow Orchestration                   │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────┴───────────────────────┐
       │                               │
┌──────▼─────────┐          ┌──────────▼───────────┐
│  CapturePage   │          │ RecommendationPage   │
│  - Webcam UI   │          │  - Display Results   │
│  - Controls    │          │  - Watch History     │
└──────┬─────────┘          └──────────┬───────────┘
       │                               │
┌──────▼───────────────────────────────▼───────┐
│           Custom React Hooks Layer           │
│  - useWebcamCapture()                        │
│  - useAudioRecorder()                        │
│  - useEnvironment()                          │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│           API Communication Layer            │
│  - inferenceAPI.js (MFNP Protocol)          │
│  - tmdbApi.js (Movie Metadata)              │
└──────────────────────────────────────────────┘
```

---

## **Core Components**

### **1. Application State Manager (`App.jsx`)**
- **Central state controller** managing:
  - View routing (`'capture'` → `'recommendations'` → `'detail'`)
  - Movie recommendations and history
  - User mood/tone from server
  - Loading/error states
- **Splash screen** with Lottie animation on startup
- **Data flow orchestration** between capture → inference → display

### **2. Capture Page (`CapturePage.jsx`)**
**Primary user interaction point** for emotion capture:

- **Automatic camera selection**: Filters virtual cameras (DroidCam, OBS), prefers integrated webcams
- **Multimodal data collection**:
  - Captures 20 video frames at 250ms intervals
  - Records 3-5 second audio snippet
  - Collects environmental context (weather, location, time)
- **Data packaging**: Assembles MFNP payload with Base64-encoded media
- **Server communication**: Sends inference request and handles response

### **3. Recommendation Page (`RecommendationPage.jsx`)**
Displays three sections:
- **Movie Recommendations**: AI-generated suggestions based on captured emotion
- **Watched List**: Last 5 movies marked as watched
- **Watch History**: Full viewing history from server logs (up to 20 items)

### **4. Movie Detail Page (`MovieDetailPage.jsx`)**
- Fetches comprehensive movie data from TMDB API
- Allows marking movies as "watched" (logs to server)
- Supports removal from recent watched list

---

## **Custom React Hooks (Reusable Logic)**

### **`useWebcamCapture()`**
- **Browser API**: `navigator.mediaDevices.getUserMedia()`
- **Responsibilities**:
  - Start/stop webcam stream with device selection
  - Capture multiple frames to Canvas and convert to Base64 JPEG
  - Cleanup on unmount
- **Return values**: `videoRef`, `isWebcamOn`, `startWebcam()`, `stopWebcam()`, `captureFrames()`

### **`useAudioRecorder()`**
- **Browser API**: `MediaRecorder` + `FileReader`
- **Responsibilities**:
  - Record microphone audio as WebM blob
  - Convert to Base64 for network transmission
  - Promise-based `stopRecording()` returns encoded audio
- **Return values**: `isRecording`, `startRecording()`, `stopRecording()`

### **`useEnvironment()`**
- **Data sources**:
  - **Geolocation API**: User's latitude/longitude
  - **BigDataCloud API**: Reverse geocoding (city name)
  - **Open-Meteo API**: Weather data (temperature, conditions)
  - **Date API**: Weekday status (weekend vs. weekday)
- **Return values**: Complete environmental context object (`city`, `weather_desc`, `temperature`, `lat`, `lon`, etc.)

---

## **API Communication Layer**

### **`inferenceAPI.js` (MFNP Protocol)**
Three main functions:

1. **`sendInferenceRequest(payload)`**
   - Wraps payload in MFNP format
   - POST to `/inference` endpoint
   - Returns unwrapped response: `{movies, mood, tone, primary_llm}`

2. **`sendInferenceLog(data)`**
   - Logs user movie selection with context
   - POST to `/inference/log` endpoint
   - Appends to server CSV for ML training

3. **`fetchInferenceLogs(limit)`**
   - GET recent user interaction history
   - Returns array of log entries

**Protocol helpers**:
- `wrapMFNP()`: Packages payload with protocol metadata
- `unwrapMFNPResponse()`: Extracts payload from server response

### **`tmdbApi.js` (The Movie Database)**
- **`searchMovieByTitle(title)`**: Converts server movie titles to TMDB IDs
- **`fetchMovieById(id)`**: Gets detailed movie information
- **`getPosterUrl(path)`**: Constructs poster image URLs

---

## **Data Flow Sequence**

```
1. USER INTERACTION (CapturePage)
   ↓
2. MEDIA CAPTURE
   - useWebcamCapture() → 20 frames (Base64 JPEG)
   - useAudioRecorder() → 3s audio (Base64 WebM)
   - useEnvironment() → weather/location context
   ↓
3. PAYLOAD ASSEMBLY
   {
     environment: {city, weather, temperature, ...},
     images: [frame1, frame2, ...],
     audio: "base64_audio_string"
   }
   ↓
4. MFNP WRAPPING
   inferenceAPI.sendInferenceRequest()
   → POST http://172.19.8.143:8000/inference
   ↓
5. SERVER PROCESSING (Jetson AI)
   - Facial emotion analysis (DeepFace)
   - Voice emotion analysis (librosa)
   - LLM + ML recommendations
   ↓
6. RESPONSE UNWRAPPING
   {movies: [...], mood: "happy", tone: "calm"}
   ↓
7. TMDB ENRICHMENT
   App.jsx → searchMovieByTitle() for each movie
   → Fetch poster, rating, metadata
   ↓
8. UI RENDERING
   RecommendationPage displays enriched movie cards
   ↓
9. USER SELECTION
   Click movie → MovieDetailPage
   Mark as watched → sendInferenceLog()
```

---

## **Key Design Patterns**

1. **State Lifting**: Central state in `App.jsx`, passed down via props
2. **Custom Hooks**: Encapsulate complex browser APIs (webcam, audio, geolocation)
3. **Separation of Concerns**: 
   - UI components (presentation)
   - Hooks (data capture logic)
   - API modules (network communication)
4. **Progressive Enhancement**: Fallback values for denied permissions
5. **Error Boundaries**: Comprehensive error handling at each layer
6. **Async/Await**: Promise-based asynchronous operations throughout

---

## **Browser APIs Used**

- **MediaDevices API**: Webcam/microphone access
- **Canvas API**: Frame capture and JPEG encoding
- **FileReader API**: Audio blob → Base64 conversion
- **Geolocation API**: User location
- **Fetch API**: HTTP requests (CORS-enabled)

---

## **Responsive States**

The client handles:
- ✅ Webcam ON/OFF
- ✅ Recording status (idle/recording)
- ✅ Loading states during inference
- ✅ Error states (permission denied, network failure)
- ✅ Empty states (no recommendations, no history)

This architecture ensures a **modular, maintainable, and user-friendly** interface for the emotion-aware recommendation system.
