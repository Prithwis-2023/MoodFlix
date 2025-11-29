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
