## 🌐 MoodFlix — Networked Emotion-Aware Recommendation System

MoodFlix is a distributed AI system demonstrating client-server networking, real-time payload exchange, concurrent processing, and multimodal inference over a LAN.
Using text, facial expressions, and speech analysis, the system detects the user's emotion and recommends a movie tailored to their mood.

This project showcases core networking concepts including:
- REST communication over HTTP
- Structured payload transfer (JSON + Base64 for media)
- Client-server synchronization
- Stateful context sharing
- Remote inference offloading
- Cross-domain multimodal data exchange

### 🏗 System Architecture
```
 ┌─────────────────────┐      HTTP POST/GET       ┌─────────────────────────┐
 │  Client (Local PC)  │  <────────────────────>  │    Jetson Server        │
 │  React Web App      │                          │  (Ollama + ML Models)   │
 └─────────────────────┘  <────────────────────>  └─────────────────────────┘
        ▲                               |
        │                               | Model Inference
        │                               ▼
        └─────────── Multimodal Input → ML Pipeline (CV + NLP + Audio)
```
The client collects webcam frames, speech audio, and other auxillary data and packages them into a JSON payload, and sends it to the server via HTTP.

The Jetson server performs multimodal emotion inference, updates the user’s emotion timeline, and returns a series of recommended movies.

### 🏗 client Architecture
The client is a React-based web application designed to collect multimodal data and visualize recommendations. Key implementation details include:

1. Automated Environment Context 

Utilizes BigDataCloud API to detect the user's current location (City, Coordinates).

Fetches real-time weather data using the Open-Meteo API based on the coordinates.

This environmental context is automatically packed into the JSON payload to help the AI infer mood based on weather/location factors.

2. Multimodal Data Capture

Component: The CapturePage serves as the main interface for data collection.

Custom Hooks: Implements useAudioRecorder and useWebcamCapture hooks to access the browser's microphone and camera streams.

Processing: Captures a snapshot of the user's facial expression and records a snippet of their voice. Both are encoded into Base64 strings for efficient network transmission within the JSON body.

3. AI Recommendation Workflow 

The client sends the aggregated payload (Environment + Face Image + Audio) to the AI Engine Server.

The server analyzes the facial expression and voice tone alongside the environment data to determine the user's mood.

The server responds with a curated list of movie recommendations tailored to that specific mood.

4. Dynamic Rendering with TMDB 

Upon receiving the recommendation list from the server, the client queries the TMDB (The Movie Database) API.

It fetches high-quality metadata (posters, plot summaries, ratings) for each recommended movie.

Finally, the application renders a rich, interactive UI displaying the personalized movie suggestions.




### ✉ Payload Format (Networking Spec)

When the client sends data, the HTTP request body follows this structure: 
```
{
  "environment":
  {
    "city": "<string>",
    "lat":  "<string>",
    "lon":  "<string>",
     ...
  },
  "images": "<base64-encoded-frame>",
  "audio": "<base64-encoded-waveform>"
}
```
