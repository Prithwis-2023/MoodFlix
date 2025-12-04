# MoodFlix AI Engine (`aiengine.py`)

This module serves as the core artificial intelligence and inference engine for MoodFlix Station, powering real-time multimodal emotion recognition and movie recommendation functionalities. It integrates facial expression analysis, voice emotion estimation, and a machine learning-based recommendation system, along with LLM-powered movie suggestions.

---

## Overview

`aiengine.py` brings together computer vision, speech processing, and traditional machine learning to personalize content based on the user's inferred mood and environmental factors. It supports:

- **Real-time facial emotion analysis** from webcam video frames.
- **Voice emotion detection** from audio clips.
- **Movie recommendation generation** using:
  - A local [Random Forest](https://scikit-learn.org/stable/modules/ensemble.html#random-forests) classifier trained on past user choices and context,
  - Results blended with LLM-generated (e.g., TinyLlama) recommendations for diversity and context adaptation.

---

## Features

- **Facial Emotion Recognition:** Uses [DeepFace](https://github.com/serengil/deepface) with OpenCV to recognize emotions from video frames.
- **Voice Emotion Detection:** Extracts audio features using [librosa](https://librosa.org/) and applies rule-based logic to infer emotion.
- **Contextual Recommendations:** Combines emotional states and environmental factors (like weather, location, etc.) for personalized movie suggestions.
- **Hybrid Recommender:** Blends results from a Random Forest algorithm and LLM prompt-based suggestion system.
- **Persistence:** Maintains user interaction logs in CSV format for offline ML training and improvement.

---

## How it Works

### 1. Facial Emotion Recognition

- Video frames are processed and enhanced using CLAHE and OpenCV.
- DeepFace analyzes each frame and outputs a dominant emotion with its confidence score.
- Confidence-weighted smoothing is applied to obtain the user's likely mood over time (see: `get_weighted_smoothed_emotion`).

### 2. Voice Emotion Detection

- Audio is decoded from base64, resampled, and normalized.
- Features extracted: RMS energy, pitch, zero-crossing rate, spectral centroid.
- A simple rule-based classifier assigns the emotion (happy, sad, neutral) based on feature thresholds (see: `estimate_voice_emotion`).

### 3. Recommendation System

The movie recommendation pipeline operates in two major modes:

- **ML-Based:**
  - Previous user choices and context are recorded in `user_logs.csv`.
  - Features used: location (city/latitude/longitude), weather, time context, mood (from video), and tone (from audio).
  - Encoded using `LabelEncoder`, with fallbacks for unseen values (robust production approach).
  - A [Random Forest Classifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html) is trained to predict movie preferences given context/features (`train_on_user_data`).

- **LLM-Based:**
  - Context is passed to an LLM (e.g., TinyLlama via CLI tool Ollama) via a prompt template.
  - LLM generates a set of recommended movie titles, which are parsed from the output (`ask_ollama`).

- **Hybrid Fusion:**
  - Predictions from both ML and LLM paths are combined intelligently in `combined_recommendations`.

### 4. LLM Integration for Movie Suggestions

- The `ollama_inference` function generates a dialogue prompt based on context and user emotion/tone.
- This prompt is sent to an LLM (default `'tinyllama'`) via Ollama CLI.
- The LLM returns a list of recommended movies, which are parsed and blended with ML recommendations if possible.

---

## Machine Learning Algorithms Used

- **Random Forest Classifier (from `sklearn.ensemble`):**
  - Ensemble decision tree method.
  - Trained using user interactions/context to predict likely movie choices.
  - Chosen for robustness, interpretability, and ability to handle mixed feature types (categorical/numeric).
  - Training occurs every time sufficient historical `user_logs.csv` data is available.

- **LabelEncoder (from `sklearn.preprocessing`):**
  - Categorical labels (city names, moods, weather descriptions, etc.) are mapped to integers for ML ingestion.
  - Handles unseen/novel values with an "other" class for failsafe inference.

- **Audio Feature Extraction:**
  - Uses statistical feature extraction (not ML classification, but foundational for any future model upgrades).
  - Rule-based mapping of features to emotions is currently used for voice emotion detection.

---

## Key Functions

| Function | Purpose |
|---|---|
| `facial_inference` | Performs per-frame detection and emotion analysis using DeepFace. |
| `get_weighted_smoothed_emotion` | Aggregates and smooths facial emotion detections for robustness. |
| `decode_base64_audio` | Converts base64 input to normalized audio array for feature extraction. |
| `extract_audio_features` | Computes core statistical features from voice. |
| `estimate_voice_emotion` | Assigns an emotion label from extracted voice features using handcrafted rules. |
| `train_on_user_data` | Fits a Random Forest model on past user log data; uses `LabelEncoder`s for categorical variables. |
| `combined_recommendations` | Merges ML model and LLM recommendations for increased accuracy and diversity. |
| `ask_ollama` | CLI call to Ollama LLM for recommendation LLM inference. |
| `ollama_inference` | Constructs prompt for ollama, gets/returns recommendations, and exposes mood/tone analysis. |

---

## Configuration

- **Paths:** User logs recorded in `user_logs.csv` by default.
- **Facial Rage:** Requires OpenCV Haar cascades (frontal face default).
- **Audio:** Assumes single-channel, 16kHz or resamples as needed for voice emotion.
- **LLM Model:** Change `OLLAMA_MODEL` to use another local LLM in Ollama.

---

## Dependencies

- Python 3.x
- OpenCV (`cv2`)
- DeepFace
- librosa
- numpy, pandas
- sklearn (scikit-learn)
- pydub, soundfile
- Ollama CLI (https://ollama.com/) & local LLM model, e.g., tinyllama

Install dependencies via pip, e.g.:

```bash
pip install opencv-python deepface librosa numpy pandas scikit-learn pydub soundfile
# Also install and configure Ollama per its official docs.
```

---

## Notes

- **Facial and voice inference require access to camera and microphone data processed into base64.**
- **LLM-based suggestions depend on correct setup of the Ollama CLI and the presence of the specified model.**
- The voice emotion detector is rule-based (not ML) but is foundational for future upgrades using trained models.
- Not intended to be run directly as a script; designed to be imported as a backend logic module.

---
