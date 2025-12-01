#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
import socket
import csv
from urllib.parse import urlparse, parse_qs
from aiengine import train_on_user_data, ollama_inference, combined_recommendations, emotion_history_with_confidence, SESSION_EMOTION, SESSION_TONE

HOST = "0.0.0.0" 
PORT = 8000
IDLE_TIMEOUT = 60
CSV_FILE = "tmp/user_logs.csv"

clf_tuple = train_on_user_data(CSV_FILE)

timestamp = ""
temp = ""
lat = ""
lon = ""
city = ""
weather_desc = ""
today_status = ""
tomorrow_status = ""
weekday = ""
mood = ""
tone= ""
title = ""

class JetsonHandler(BaseHTTPRequestHandler):

    def _send_json(self, code, obj):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/inference/log":
            qs = parse_qs(parsed.query)
            try:
                limit = int(qs.get("limit", ["50"])[0])
            except ValueError:
                limit = 50

            logs = []
            if os.path.exists(CSV_FILE):
                with open(CSV_FILE, mode="r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    rows = list(reader)

                    # 마지막 limit개만 사용
                    rows = rows[-limit:]

                    for row in rows:
                        # CSV 컬럼 순서:
                        # [0] timestamp
                        # [1] city
                        # [2] lat
                        # [3] lon
                        # [4] today_status
                        # [5] tomorrow_status
                        # [6] weekday
                        # [7] weather_desc
                        # [8] temp
                        # [9] mood
                        # [10] tone
                        # [11] movie_title
                        if len(row) < 12:
                            continue
                        logs.append({
                            "clientSentAt": row[0],
                            "city": row[1],
                            "lat": row[2],
                            "lon": row[3],
                            "today_status": row[4],
                            "tomorrow_status": row[5],
                            "weekday": row[6],
                            "weather_desc": row[7],
                            "temperature": row[8],
                            "mood": row[9],
                            "tone": row[10],
                            "movieTitle": row[11],
                        })

            return self._send_json(200, logs)
        return self._send_json(404, {"error": "Unknown endpoint"})

    def do_POST(self):
        if self.path == "/inference":
            emotion_history_with_confidence.clear()  # clearing per request
            content_len = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_len)
            
            try:
                payload = json.loads(raw_body.decode())
            except:
                return self._send_json(400, {"error": "Invalid JSON"})
            
            try:
                primary_movies = ollama_inference(payload)
                global mood, tone
                mood = SESSION_EMOTION
                tone = SESSION_TONE
            except Exception as e:
                return self._send_json(500, {"error": f"Ollama failed: {e}"})

            try:
                final_movies = combined_recommendations(primary_movies, clf_tuple, payload)
            except Exception as e:
                return self._send_json(500, {"error": f"Model combine error: {e}"})

            return self._send_json(200, {
                "movies": final_movies,
                "primary_llm": primary_movies
            })
   
        if self.path == "/inference/log":
            content_len = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_len)

            try:
                log_payload = json.loads(raw_body.decode())
            except:
                return self._send_json(400, {"error": "Invalid JSON"})

        
            if "movieTitle" not in log_payload:
                return self._send_json(400, {"error": "movieTitle is required"})

            try:
                #append_log_to_csv(log_payload)
                global timestamp, temp, lat, lon, city, weather_desc, today_status, tomorrow_status, weekday,title
                timestamp = log_payload.get("clientSentAt", "")
                env = log_payload.get("env") or {}
                temp = env.get("temperature", "")
                lat = env.get("lat", "")
                lon = env.get("lon", "")
                city = env.get("city", "")
                weather_desc = env.get("weather_desc", "")
                today_status = env.get("today_status", "")
                tomorrow_status = env.get("tomorrow_status", "")
                weekday = env.get("weekday", "")
                title = log_payload.get("movieTitle", "")
 		#CREATE CSV ROW
                row = [timestamp,city,lat,lon,today_status,tomorrow_status,weekday,weather_desc,temp,mood,tone,title]

		# WRITE IMMEDIATELY
                with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(row)
            except PermissionError as e:
                return self._send_json(500, {
                    "error":"Permission Error: Cannot write to csv",
                    "details": str(e)
                })
            except Exception as e:
                return self._send_json(500, {"error": f"Failed to write CSV: {e}"})

        
            return self._send_json(200, {"status": "ok", "message": "log saved"})
        
        return self._send_json(404, {"error": "Unknown endpoint"})

def run_server():
    server = HTTPServer((HOST, PORT), JetsonHandler)
    print(f"Server running on http://{HOST}:{PORT}")
    server.socket.settimeout(IDLE_TIMEOUT)

    try:
        while True:
            try:
                server.handle_request()
            except socket.timeout:
                print("No Request, exiting...")
                break
    except KeyboardInterrupt:
        pass
    
    print("Server stopped")

if __name__ == "__main__":
    run_server()
