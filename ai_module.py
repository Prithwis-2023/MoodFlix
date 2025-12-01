import os, time, csv, subprocess, threading, re
from collections import deque, defaultdict


import cv2, numpy as np, librosa, sounddevice as sd
from deepface import DeepFace
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder


CONFIDENCE_THRESHOLD = 0.4
NUM_FRAMES = 20
EMOTION_HISTORY_LEN = 10
OLLAMA_MODEL = "llama2"
CSV_FILE = "user_logs.csv"
SAMPLE_RATE = 16000
DURATION = 10

if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", "city", "latitude", "longitude", "today_status", "tomorrow_status",
            "weekday", "weather_desc", "temperature", "mood", "voice_tone", "movie_selected"
        ])
def ask_ollama(prompt_text):
    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL, prompt_text],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print("Error calling Ollama:", e)
        return ""


def extract_audio_features(audio_data, sr=16000):
    """
    audio_data: 1D float32 numpy array
    sr: sample rate
    returns: rms, pitch, zcr, spectral centroid
    """

    audio_data = audio_data.astype(np.float32)
    audio_data = audio_data / (np.max(np.abs(audio_data)) + 1e-6)  # normalize

    # RMS energy
    rms = np.mean(librosa.feature.rms(y=audio_data))

    # Pitch
    pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sr)
    pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0

    # Zero crossing rate
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=audio_data))

    # Spectral centroid
    spec_centroid = np.mean(librosa.feature.spectral_centroid(y=audio_data, sr=sr))

    return rms, pitch, zcr, spec_centroid





def estimate_voice_emotion(audio_data, sr=16000):
    """
    Simple rule-based voice emotion estimation.
    """
    rms, pitch, zcr, spec_centroid = extract_audio_features(audio_data, sr)

    #correction
    base = np.mean(np.abs(audio_data)) + 1e-6

    #scaling
    happy_rms = 0.015 * (0.01 / base)
    sad_rms = 0.007 * (0.01 / base)

    
    if rms > happy_rms and pitch > 120:
        return "happy"
    elif rms < sad_rms and pitch < 100:
        return "sad"
    else:
        return "neutral"




def get_weighted_smoothed_emotion(emotion_history_with_confidence):
    """
    emotion_history_with_confidence: list of tuples [(emotion, confidence), ...]
    Returns: the weighted dominant emotion
    """
    if not emotion_history_with_confidence:
        return "neutral"

    weighted_scores = defaultdict(float)

    for emotion, conf in emotion_history_with_confidence:
        weighted_scores[emotion] += conf  

    #higher score emotion
    dominant = max(weighted_scores, key=weighted_scores.get)
    return dominant




def train_user_model(csv_file):
    """
    csv_file
    returns: (classifier, encoders_tuple)
    """
    if not os.path.exists(csv_file):
        return None, None

    df = pd.read_csv(csv_file)
    if df.empty:
        return None, None

    # range of emotion / tone 
    possible_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    possible_tones = ['happy', 'sad', 'neutral']

    # Label Encoders
    le_city = LabelEncoder()
    le_today = LabelEncoder()
    le_mood = LabelEncoder()
    le_tone = LabelEncoder()
    le_movie = LabelEncoder()

    le_mood.fit(possible_emotions)
    le_tone.fit(possible_tones)

    # feature dataframe
    features = df[['latitude', 'longitude', 'temperature']].copy()
    features['city'] = le_city.fit_transform(df['city'])
    features['today_status'] = le_today.fit_transform(df['today_status'])
    features['mood'] = le_mood.transform(df['mood'])
    features['tone'] = le_tone.transform(df['voice_tone'])

    target = le_movie.fit_transform(df['movie_selected'])

    
    clf = RandomForestClassifier(n_estimators=50)
    clf.fit(features, target)

    return clf, (le_city, le_today, le_mood, le_tone, le_movie)



def combined_recommendations(primary_movies, clf_tule, user_context):


    clf, encoders = clf_tuple if clf_tuple else(None,None)

    if clf is None:
        return primary_movies

    le_city, le_today, le_mood, le_tone, le_movie = encoders


    df = pd.DataFrame([{
        'latitude': user_context['lat'],
        'longitude': user_context['lon'],
        'temperature': user_context['temperature'],
        'city': le_city.transform([user_context['city']])[0],
        'today_status': le_today.transform([user_context['today_status']])[0],
        'mood': le_mood.transform([user_context['mood']])[0],
        'tone': le_tone.transform([user_context['tone']])[0]
    }])

    pred_probs = clf.predict_proba(df)[0]
    top_indices = pred_probs.argsort()[::-1]


    top_movies = le_movie.inverse_transform(top_indices)



    final_list = []


    for movie in top_movies:
        if movie in primary_movies and movie not in final_list:
            final_list.append(movie)

    for movie in primary_movies:
        if movie not in final_list:
            final_list.append(movie)

    return final_list[:5]








def run_emotion_movie_pipeline(frames: list, audio_data: np.ndarray, sample_rate: int, env_context: dict):
    """
    frames: [np.ndarray(BGR), ...]  
    audio_data: 1D np.ndarray(float32) 
    sample_rate: 
    env_context: dict
    """


    # location,weather,time
    city, lat, lon = other_params.get_location()
    today_status, tomorrow_status, weekday_name = other_params.today_and_tomorrow_status()
    weather_desc, temperature = other_params.get_weather()

    print(f"[INFO] Location: {city}, Weather: {weather_desc}, {temperature}°C")

    # 2) voice tone
    
    voice_tone = estimate_voice_emotion(audio_data, sr=sample_rate)

    # 3) camera 
    emotion_history_with_confidence = deque(maxlen=EMOTION_HISTRY_LEN)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
   

    def preprocess_frame(frame):
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l,a,b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

        for i, frame in enumerate(frames):
        enhanced_frame = preprocess_frame(frame)
        gray = cv2.cvtColor(enhanced_frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=7, minSize=(60, 60)
        )
        for (x, y, w, h) in faces:
            try:
                result = DeepFace.analyze(
                    enhanced_frame,
                    actions=['emotion'],
                    enforce_detection=False,
                    detector_backend='opencv',
                    silent=True
                )
                dominant_emotion = result[0]['dominant_emotion']
                conf = result[0]['emotion'][dominant_emotion] / 100.0
                if conf >= CONFIDENCE_THRESHOLD:
                    emotion_history_with_confidence.append((dominant_emotion, conf))
                print(f"[INFO] Frame {i+1}/{len(frames)}: {dominant_emotion} ({conf:.2f})")
            except Exception as e:
                print("[WARN] Skipped frame:", e)
                continue
        time.sleep(0.05)

    smoothed_emotion = get_weighted_smoothed_emotion(emotion_history_with_confidence)
    print(f"[INFO] Final mood: {smoothed_emotion}, voice_tone: {voice_tone}")


#ollama for recommendation

prompt = f"""
You are a movie recommendation assistant. The user context is:
- Location: {city} ({lat:.2f}, {lon:.2f})
- Today: {today_status} ({weekday_name})
- Tomorrow: {tomorrow_status}
- Current weather: {weather_desc}, {temperature}°C
- Current mood: {mood}
- Voice tone: {voice_tone}
Recommend 5 movie names that the user is most likely to enjoy right now. 
"""
    recommendations = ask_ollama(prompt)
    movie_titles = re.findall(r"\d+\\.\\s*(.*?)\\s*\\(\\d{4}\\)", recommendations)
    

    clf_tuple = train_user_model(CSV_FILE)
    user_context = {
        'city': city,
        'lat': lat,
        'lon': lon,
        'today_status': today_status,
        'temperature': temperature,
        'mood': smoothed_emotion,
        'tone': voice_tone
    }
    final_movies = combined_recommendations(movie_titles, clf_tuple, user_context)

    return {
        "city": city,
        "lat": float(lat),
        "lon": float(lon),
        "today_status": today_status,
        "tomorrow_status": tomorrow_status,
        "weekday": weekday_name,
        "weather_desc": weather_desc,
        "temperature": float(temperature),
        "mood": smoothed_emotion,
        "voice_tone": voice_tone,
        "movies": final_movies,
    }
