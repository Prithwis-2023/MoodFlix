# MoodFlix Station Code — Documentation

This section documents server.py — a small HTTP server used by MoodFlix to run inference, combine model recommendations, and append client logs to a CSV file.

---

Overview
--------

server.py implements a minimal HTTP server (built on Python's http.server.BaseHTTPRequestHandler) exposing endpoints used by the MoodFlix front-end to:
- Request movie recommendations (LLM + local classifier combination),
- Store user interaction logs (append-only CSV),
- Retrieve recent logged interactions.

The server delegates the machine-learning and LLM work to functions imported from aiengine:
- train_on_user_data(CSV_FILE)
- ollama_inference(payload)
- combined_recommendations(primary_movies, clf_tuple, payload)
- emotion_history_with_confidence (a structure cleared per request)

How it works (flow)
-------------------
1. At module import time, train_on_user_data(CSV_FILE) is called to produce a classifier tuple (clf_tuple).
2. Incoming requests are handled by JetsonHandler.
3. **POST /inference**:
   - Clears emotion history for the request, parses JSON payload.
   - Asks the LLM (ollama_inference) for primary movie recommendations and returns mood/tone.
   - Combines those primary LLM recommendations with the classifier using combined_recommendations.
   - Returns final movie list, primary LLM output, mood, and tone.
4. **POST /inference/log**:
   - Accepts a JSON payload describing the user selection and environment.
   - Validates presence of movieTitle.
   - Appends a row to CSV_FILE immediately.
5. **GET /inference/log**:
   - Returns the last N rows (default 50) from the CSV as JSON, with optional query param `limit`.
   - Sends the JSON payload to the client.

Configuration / constants
-------------------------
- HOST = "0.0.0.0"
- PORT = 8000
- IDLE_TIMEOUT = 60 (seconds) — socket timeout, server exits after idle timeout
- CSV_FILE = "tmp/user_logs.csv" — path where logs are appended (not in ROOT directory because of write permission problems)

Note: In the current file these are module-level constants, i.e., change values by editing the file or adding an environment-aware wrapper.

Endpoints
---------

1) **GET /inference/log**
- Purpose: Retrieve recent saved logs from the CSV.
- Query params:
  - limit (optional) — integer, number of most recent rows to return (default 50)
- Response:
  - 200: JSON array of log objects (see CSV schema below for fields)
  - 404: {"error":"Unknown endpoint"} if path does not match
- Typical curl:
```bash
curl "http://localhost:8000/inference/log?limit=50"
```

2) **POST /inference**
- Purpose: Run an inference request (LLM -> combine -> final recommendations).
- Request body: JSON (payload forwarded to ollama_inference and combined_recommendations). The server expects the payload format required by your aiengine. Typical payload contains user context, session, or text describing mood.
- Flow:
  - emotion_history_with_confidence.clear()
  - Call ollama_inference(payload) -> returns (primary_movies, mood, tone)
  - Call combined_recommendations(primary_movies, clf_tuple, payload) -> final_movies
- Response:
  - 200: ```{"movies": final_movies, "primary_llm": primary_movies, "mood": mood, "tone": tone}```
  - 400: Invalid JSON
  - 500: Ollama or combination errors with details
- Example:
```bash
curl -X POST http://localhost:8000/inference \
  -H "Content-Type: application/json" \
  -d '{"movies":[""A Taxi Driver", "Minari", "Mother"],"primary_llm":[], "mood":"happy", "tone":"happy"}'
```

3) **POST /inference/log**
- Purpose: Append a user selection log to CSV_FILE. This is used to collect user feedback (movie selected after recommendation).
- Minimum requirement:
  - movieTitle (string) must be present in POST body JSON.
- Optional: env object with environmental metadata (temperature, lat, lon, city, weather_desc, today_status, tomorrow_status, weekday)
- Behavior:
  - Builds a CSV row and appends immediately (with newline) to CSV_FILE.
- Response:
  - 200: {"status":"ok","message":"log saved"}
  - 400: Invalid JSON or missing movieTitle
  - 500: Permission Error or failed write
- Example:
```bash
curl -X POST http://localhost:8000/inference/log \
  -H "Content-Type: application/json" \
  -d '{
    "clientSentAt":"2025-10-01T12:00:00Z",
    "movieTitle":"The Matrix",
    "mood":"nostalgic",
    "tone":"calm",
    "env":{
      "temperature":"22",
      "lat":"37.123",
      "lon":"-122.123",
      "city":"San Francisco",
      "weather_desc":"clear",
      "today_status":"work",
      "tomorrow_status":"holiday",
      "weekday":"Wednesday"
    }
  }'
```

CSV schema
----------
Rows are written in this exact order (12 columns):

0. clientSentAt (timestamp string)
1. city
2. lat
3. lon
4. today_status
5. tomorrow_status
6. weekday
7. weather_desc
8. temperature
9. mood
10. tone
11. movie_title

Example CSV row:
```
2025-10-01T12:00:00Z,San Francisco,37.123,-122.123,work,holiday,Wednesday,clear,22,nostalgic,calm,The Matrix
```

Error handling and status codes
-------------------------------
- **400 Bad Request**: invalid JSON or required field (movieTitle) missing for /inference/log
- **500 Internal Server Error**: failures from ollama_inference, combined_recommendations, or CSV write permissions
- **404 Not Found**: unknown endpoint
- **CORS**: The server sets Access-Control-Allow-Origin: * for JSON responses and OPTIONS, enabling broad cross-origin access.

Important implementation notes & risks
------------------------------------
- **Synchronous blocking server**: This server uses HTTPServer and handle_request in a loop with a socket timeout. It handles one request at a time; it's not suitable for high concurrency.
- **Heavy work at import time**: train_on_user_data(CSV_FILE) runs at import/module-load. This can slow process start or cause issues if CSV_FILE is large. Consider lazy initialization or running training in a background thread/process.
- **File append concurrency**: Appending to CSV without file locking can cause corrupted rows if multiple server processes or threads write simultaneously. Use file locks or a transactional store (database) for safety.
- **Error propagation**: The handler reports underlying exception messages in 500 responses. Might potentially leak sensitive internal details in production.

Future improvements
------------------------
- Move heavy initialization (train_on_user_data) off the import path; initialize lazily or in a startup job.
- Swap to ThreadingHTTPServer or a framework (Flask/FastAPI) to simplify routing and concurrency.
- Add structured logging (Python logging module) instead of plain prints.
- Replace CSV with a small database (SQLite or a proper DB) to avoid concurrency issues and to allow richer analytics.
- Validate incoming payloads (JSON schema) for both /inference and /inference/log.
- Use environment variables for configuration (HOST, PORT, CSV_FILE, IDLE_TIMEOUT).
- Add unit/integration tests and a sample data CSV to run local tests.
- Rate-limit inference calls and/or enforce authentication if endpoints are public.

Testing & troubleshooting
-------------------------
- Check permissions on the directory containing CSV_FILE. PermissionError will be returned as 500.
- If the server exits after IDLE_TIMEOUT seconds with "No Request, exiting...", adjust IDLE_TIMEOUT or run the server inside a process supervisor that restarts it.
- If train_on_user_data blocks startup, run it separately and persist the trained model to disk; load the persisted model quickly.

Run locally
-------------------
1. Ensure Python 3 is available.
2. Ensure the application dependencies (aiengine and whatever it needs) are installed and accessible.
3. Create directory for CSV if needed:
```bash
mkdir -p tmp
touch tmp/user_logs.csv
```
4. Start server:
```bash
python3 server.py
```
5. The server listens on http://0.0.0.0:8000 by default.

Notes about integration
-----------------------
- server.py expects aiengine to expose the functions used. Confirm those functions' contracts (input payload schema, return types).
- The combined_recommendations function receives three arguments: (primary_movies, clf_tuple, payload). Ensure clf_tuple is compatible with the combine logic.
- Ollama and LLM interactions (ollama_inference) can be slow; consider async calls or offloading to an inference service.

---
