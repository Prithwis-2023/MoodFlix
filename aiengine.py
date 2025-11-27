#!/usr/bin/env/python3
import cv2
import os
import numpy as np
import csv
import pandas as pd
import time
import subprocess
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import re

user_data = "user_logs.csv"
OLLAMA_MODEL = "tinyllama"

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
	city = payload["city"]
	lat = payload["lat"]
	lon = payload["lon"]
	today_status = payload["today_status"]
	tomorrow_status = payload["tomorrow_status"]
	week_day = payload["weekday"]
	weather_desc = payload["weather_desc"]
	temperature = payload["temperature"]
	mood = payload["mood"]
	voice_tone = payload["voice_tone"]

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

	df = pd.DataFrame([{
		'latitude': user_context['lat'],
		'longitude': user_context['lon'],
                'temperature': user_context['temperature'],
		'city':safe_transform(le_city, user_context['city']),
		'today_status':safe_transform(le_today, user_context['today_status']),
		'tomorrow_status':safe_transform(le_tomorrow, user_context['tomorrow_status']),
		#'weekday':le_weekday.transform([user_context['weekday']])[0],
		'weather_desc':safe_transform(le_weather, user_context['weather_desc']),
		'mood':le_mood.transform([user_context['mood']])[0],
		'tone': le_tone.transform([user_context['voice_tone']])[0]
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


		
