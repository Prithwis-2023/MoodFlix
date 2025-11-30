#!/usr/bin/env/python3
import cv2
import os
import io
import base64
import numpy as np
import csv
import pandas as pd
import time
import subprocess
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import re
from collections import defaultdict
from deepface import DeepFace
import soundfile as sf
import librosa

user_data = "user_logs.csv"
OLLAMA_MODEL = "tinyllama"


CONFIDENCE_THRESHOLD = 0.50
NUM_FRAMES = 10
emotion_history_with_confidence = []

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_frame(frame):
	lab = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
	l, a, b = cv2.split(lab)
	clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
	l = clahe.apply(l)
	enhanced = cv2.merge([l, a, b])
	return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

def decode_base64_frame(b64_string):
	img_data = base64.b64decode(b64_string)
	np_arr = np.frombuffer(img_data, np.uint8)
	frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
	return frame

def facial_inference(image_array):
	for i, b64_frame in enumerate(image_array):
		frame = decode_base64_frame(b64_frame)
		if frame is None:
			print(f"Skipping frame {i+1}: cannot decode")
			continue

		enhanced_frame = preprocess_frame(frame)
		gray = cv2.cvtColor(enhanced_frame, cv2.COLOR_BGR2GRAY)
		faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=7, minSize=(60, 60))

		for (x, y, w, h) in faces:
			try:
				result = DeepFace.analyze(
					enhanced_frame, actions=['emotion'], enforce_detection=False,
					detector_backend='opencv', silent=True
				)
				dominant = result[0]['dominant_emotion']
				conf = result[0]['emotion'][dominant] / 100.0

				if conf >= CONFIDENCE_THRESHOLD:
					emotion_history_with_confidence.append((dominant, conf))
				print(f"[Frame] → {dominant}")

			except Exception as e:
				print(f"[Error]: {e}")		

		time.sleep(0.2)			

def get_weighted_smoothed_emotion(frames_array, emotion_history_with_confidence):
    """
    emotion_history_with_confidence: list of tuples [(emotion, confidence), ...]
    Returns: the weighted dominant emotion
    """
    facial_inference(frames_array)

    if not emotion_history_with_confidence:
        return "neutral"
    weighted_scores = defaultdict(float)
    for emotion, conf in emotion_history_with_confidence:
        weighted_scores[emotion] += conf  # add confidence as weight
    # picking the emotion with highest total confidence
    dominant = max(weighted_scores, key=weighted_scores.get)
    return dominant
   
def decode_base64_audio(b64_string, target_sr=16000):
    audio_bytes = base64.b64decode(b64_string)
    audio_file = io.BytesIO(audio_bytes)
    audio_data, sr = sf.read(audio_file, dtype='float32')
    # if stereo convert to mono
    if len(audio_data.shape) > 1:
        audio_data = np.mean(audio_data, axis=1)
    # resample if needed
    if sr != target_sr:
        audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=target_sr)
    return audio_data, target_sr 

def extract_audio_features(audio_data, sr=16000):
    audio_data = audio_data.astype(np.float32)
    audio_data = audio_data / (np.max(np.abs(audio_data)) + 1e-6) # normalize
    
    # RMS energy
    rms = np.mean(librosa.feature.rms(y=audio_data))

    # Pitch
    pitches, magnitude = librosa.piptrack(y=audio_data, sr=sr)
    pitch = np.mean(pitches[pitches>0]) if np.any(pitches>0) else 0

    # Zero crossing rate
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=audio_data))

    # Spectral centroid
    spec_centroid = np.mean(librosa.feature.spectral_centroid(y=audio_data, sr=sr))

    return rms, pitch, zcr, spec_centroid


def estimate_voice_emotion(audio_data, sr=16000):
    rms, pitch, zcr, spec_centroid = extract_audio_features(audio_data, sr)
    # Rules (tuned for Jetson mic)
    if rms > 0.02 and pitch > 120 and zcr > 0.02:
        voice_tone = "happy"
    elif rms < 0.01 and pitch < 100 and zcr < 0.01:
        voice_tone = "sad"
    else:
        voice_tone = "neutral"

    return voice_tone


def ask_ollama(prompt_text):
    """Call Ollama CLI to get movie recommendations"""
    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL, prompt_text],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print("Error calling Ollama:", e)
        return ""

def fit_with_other(le, series):
	values = series.tolist()
	values.append("other")
	le.fit(values)
	return le

def safe_transform(le, value):
	if value not in le.classes_:
		return le.transform(["other"])[0]
	return le.transform([value])[0]

def train_on_user_data(csv_file):
	"""This function implements the standard 
	recommendation system used by companies, 
	based on user's clicks"""
	if not os.path.exists(csv_file):
		return None, None
	
	df = pd.read_csv(csv_file)
	if df.empty:
		return None, None
	
	possible_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
	possible_tones = ['happy', 'sad', 'neutral']
	#possible_week_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	
	le_city = LabelEncoder()
	le_today = LabelEncoder()
	le_tomorrow = LabelEncoder()
	le_weekday = LabelEncoder()
	le_weather = LabelEncoder()
	le_mood = LabelEncoder()
	le_tone = LabelEncoder()
	le_movie = LabelEncoder()

	le_city = fit_with_other(le_city, df['city'])
	le_today = fit_with_other(le_today, df['today_status'])
	le_tomorrow = fit_with_other(le_tomorrow, df['tomorrow_status'])
	le_weather = fit_with_other(le_weather, df['weather_desc'])
	
	#le_weekday.fit(possible_week_days)
	le_mood.fit(possible_emotions)
	le_tone.fit(possible_tones)

	features = df[['latitude', 'longitude', 'temperature']].copy()
	features['city'] = le_city.transform(df['city'])
	features['today_status'] = le_today.transform(df['today_status'])
	features['tomorrow_status'] = le_tomorrow.transform(df['tomorrow_status'])
	#features['weekday'] = le_weekday.transform(df['weekday'])
	features['weather_desc'] = le_weather.transform(df['weather_desc'])
	features['mood'] = le_mood.transform(df['mood'])
	features['tone'] = le_tone.transform(df['voice_tone'])
	

	target = le_movie.fit_transform(df['movie_selected'])

	clf = RandomForestClassifier(n_estimators=50)
	clf.fit(features, target)
	return clf, (le_city, le_today, le_tomorrow, le_weather, le_mood, le_tone, le_movie)


def ollama_inference(payload):
	city = payload["environment"]["city"]
	lat = payload["environment"]["lat"]
	lon = payload["environment"]["lon"]
	today_status = payload["environment"]["today_status"]
	tomorrow_status = payload["environment"]["tomorrow_status"]
	week_day = payload["environment"]["weekday"]
	weather_desc = payload["environment"]["weather_desc"]
	temperature = payload["environment"]["temperature"]
	#mood = payload["mood"]
	mood = str(get_weighted_smoothed_emotion(payload['images'], emotion_history_with_confidence))
	audio_data, sr = decode_base64_audio(payload['audio'])
	voice_tone = estimate_voice_emotion(audio_data, sr)

	prompt = f"""
	You are a movie recommendation assistant. The user context is:
	- Location: {city} ({lat:.2f}, {lon:.2f})
	- Today: {today_status} ({week_day})
	- Tomorrow: {tomorrow_status}
	- Current weather: {weather_desc}, {temperature}°C
	- Current mood: {mood}
	- Voice tone: {voice_tone}
	Recommend 5 movie names that the user is most likely to enjoy right now. 
	"""
	
	response = ask_ollama(prompt)
	movie_titles = re.findall(r"\d+\.\s*(.*?)\s*\(\d{4}\)", response)
	return movie_titles	

def combined_recommendations(primary_movies, clf_tuple, user_context):
	clf, encoders = clf_tuple
	if clf is None:
		return primary_movies

	le_city, le_today, le_tomorrow, le_weather, le_mood, le_tone, le_movie = encoders

	audio_data, sr = decode_base64_audio(user_context['audio'])

	df = pd.DataFrame([{
		'latitude': user_context['environment']['lat'],
		'longitude': user_context['environment']['lon'],
        'temperature': user_context['environment']['temperature'],
		'city':safe_transform(le_city, user_context['environment']['city']),
		'today_status':safe_transform(le_today, user_context['environment']['today_status']),
		'tomorrow_status':safe_transform(le_tomorrow, user_context['environment']['tomorrow_status']),
		#'weekday':le_weekday.transform([user_context['weekday']])[0],
		'weather_desc':safe_transform(le_weather, user_context['environment']['weather_desc']),
		'mood':le_mood.transform([get_weighted_smoothed_emotion(user_context['images'], emotion_history_with_confidence)])[0],
		'tone': le_tone.transform([estimate_voice_emotion(audio_data, sr)])[0]
	}])
	pred_probs = clf.predict_proba(df)[0]
	top_indices = pred_probs.argsort()[::-1]
	top_movies = le_movie.inverse_transform(top_indices)

	final_list = []
	for movie in top_movies:
		if movie not in final_list:
			final_list.append(movie)
	for movie in primary_movies:
		if movie not in final_list:
			final_list.append(movie)
	
	return final_list


		
