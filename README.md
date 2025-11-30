## 🌐 MoodFlix — Networked Emotion-Aware Recommendation System

MoodFlix is a distributed AI system demonstrating client-server networking, real-time payload exchange, concurrent processing, and multimodal inference over a LAN.
Using text, facial expressions, and speech analysis, the system detects the user's emotion and recommends a movie tailored to their mood.

----
<p align="center">
  <img src="https://github.com/user-attachments/assets/ca564aea-b76d-4afb-80de-395e7a0a1e68" width="70%" />
</p>


----

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


                                CLIENT SIDE
                                ┌─────────────────────────┐
                                │      Web Application     │
                                │  (Browser: React Client) │
                                └───────────────┬──────────┘
                                                │
                      ┌─────────────────────────┼───────────────────────────┐
                      │                         │                           │
        ┌─────────────▼──────────────┐  ┌───────▼──────────────┐  ┌────────▼─────────────┐
        │ Collect Environment Data    │  │ Capture Webcam Frame │  │  Record Audio Snippet │
        │   - Location (API)          │  │   (Base64 Image)     │  │   (Base64 Audio)      │
        │   - Weather (API)           │  └──────────────────────┘  └───────────────────────┘
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌──────────────────────────────────────┐
        │ Assemble JSON Payload                │
        │  { environment, image, audio }       │
        └─────────────┬────────────────────────┘
                      │
                      ▼
           CLIENT → SERVER (HTTP POST)

                      ▼
        ┌────────────────────────────────────────┐
        │           Jetson Server A              │
        │       (API Gateway / Preprocessing)    │
        └─────────────┬──────────────────────────┘
                      │
                      ▼
        ┌────────────────────────────────────────┐
        │  Decode Payload (JSON + Base64)         │
        │  Run Local ML Models:                   │
        │    - Facial Expression Model            │
        │    - Audio Emotion Model                │
        └─────────────┬──────────────────────────┘
                      │
                      │  SERVER A → SERVER B (REST / HTTP)
                      ▼
        ┌───────────────────────────────────────────┐
        │      Recommendation Engine Server B        │
        │        - Context Fusion (Env + Face + Audio)  
        │        - Mood Classification
        │        - Generate Movie IDs
        └───────────────────┬────────────────────────┘
                            │
                            │ SERVER B → SERVER A (JSON RETURN)
                            ▼
        ┌───────────────────────────────────────────┐
        │         Server A Response Builder          │
        │   Packages { mood, movie_ids } → JSON      │
        └───────────────────┬────────────────────────┘
                            │
                            │ SERVER → CLIENT (HTTP JSON Response)

                            ▼
                   ┌───────────────────────────────┐
                   │ Client Receives Recommendations│
                   └───────────────────┬────────────┘
                                       │
                                       ▼
                     ┌────────────────────────────────────┐
                     │ Query TMDB API for Movie Metadata  │
                     └───────────────────┬────────────────┘
                                       ▼
                     ┌────────────────────────────────────┐
                     │  Render Personalized Movie UI       │
                     └────────────────────────────────────┘


### 🏗 Client Architecture
The client is a React-based web application designed to collect multimodal data and visualize recommendations. Key implementation details include:

- #### Automated Environment Context 

  - Utilizes BigDataCloud API to detect the user's current location (City, Coordinates).

  - Fetches real-time weather data using the Open-Meteo API based on the coordinates.

  - This environmental context is automatically packed into the JSON payload to help the AI infer mood based on weather/location factors.

- #### Multimodal Data Capture

  - Component: The CapturePage serves as the main interface for data collection.

  - Custom Hooks: Implements useAudioRecorder and useWebcamCapture hooks to access the browser's microphone and camera streams.

  - Processing: Captures a snapshot of the user's facial expression and records a snippet of their voice. Both are encoded into Base64 strings for efficient network transmission within the JSON body.

- ####  AI Recommendation Workflow 

  - The client sends the aggregated payload (Environment + Face Image + Audio) to the AI Engine Server.

  - The server analyzes the facial expression and voice tone alongside the environment data to determine the user's mood.

  - The server responds with a curated list of movie recommendations tailored to that specific mood.

- #### Dynamic Rendering with TMDB 

  - Upon receiving the recommendation list from the server, the client queries the TMDB (The Movie Database) API.

  - It fetches high-quality metadata (posters, plot summaries, ratings) for each recommended movie.

  - Finally, the application renders a rich, interactive UI displaying the personalized movie suggestions.


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
🧠 Server-Side Architecture (NVIDIA Jetson + Ollama)

The Jetson server is responsible for:
- Accepting HTTP POST requests
- Running multimodal inference models (CV, NLP, Audio)
- Updating user emotion history
- Generating movie recommendations
- Returning structured JSON responses

This design demonstrates offloaded computation, ideal for low-power or mobile client devices.

⚙️ Tech Stack

Client
- React.js
- TMDB API
- BigDataCloud API
- Open-Meteo API
- WebRTC/ Media Capture API
- Custom Hooks for webcam & microphone handling

Server
- Python / Node
- Ollama LLM backend
- NVIDIA Jetson hardware
- Multimodal Deep Learning Models
- REST API Server (Flask/FastAPI/Express)

🚀 How to Run Locally

📌 Client Setup (React)

cd client
npm install
npm start

📌 Server Setup (Jetson)

cd server
pip install -r requirements.txt
python server.py

Make sure Jetson and client machine are on the same LAN.
Adjust the server IP inside the React codebase:

REACT_APP_SERVER_URL=http://<jetson-ip>:<port>

👨‍💻 Contributors

Name                        Role
Prithwis Das                implementing server-side architecture
Arslanit                    implementing server-side architecture
Myint Myat Aung             implementing client-side architecture
Choi Hyung-chan             implementing client-side architecture

⭐ Future Enhancements
- Real-time emotion timeline graph
- Long-term preference learning
- Background noise filtering for better audion inference
- Server load balancing (multi-client)
- Websocket live streaming

📄License
MIT License - free to use, modify, and distribute.

