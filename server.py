#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
import socket
import csv
from urllib.parse import urlparse, parse_qs
from aiengine import train_on_user_data, ollama_inference, combined_recommendations, emotion_history_with_confidence

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
tone = ""
title = ""

def compute_file_hash(path):
    if not os.path.exists(path):
        return None
    
    with open(path, "rb") as f:
        data = f.read()

    return hashlib.sha256(data).hexdigest()

def make_response(message_type, payload, sender="server", code=200):
    return code, {
        "protocol" : "MFNP",
        "version" : 1.0,
        "sender" : sender,
        "message_type" : message_type,
        "payload" : payload,
    }


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

            status, response = make_response("inference-log", logs)
            return self._send_json(status, response)
        
        status, response = make_response("error", {"reason": "unknown endpoint"}, code=404)
        return self._send_json(status, response)

    def do_POST(self):
        if self.path == "/inference":
            emotion_history_with_confidence.clear()  # clearing per request
            content_len = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_len)
            
            # step 1: validating JSON
            try:
                request_obj = json.loads(raw_body.decode())
            except:
                status, response = make_response("error", {"reason": "Invalid JSON"}, code=400)
                return self._send_json(status, response)
            
            # step 2: validate MFNP format
            required_keys = ["protocol", "version", "sender", "message_type", "payload"]
            if not all(k in request_obj for k in required_keys):
                status, response = make_response("error", {"reason": "Invalid MNFP message format"}, code=400)
                return self._send_json(status, response)
            
            if request_obj["protocol"] != "MFNP":
                status, response = make_response("error", {"reason": "Unsupported protocol"}, code=400)
                return self._send_json(status, response)

            if request_obj["message_type"] != "inference":
                status, response = make_response("error", {"reason": "Wrong message type for /inference"}, code=400)
                return self._send_json(status, response)
            
            # data client intended to send
            try:
                primary_movies, mood, tone = ollama_inference(request_obj["payload"])
            except Exception as e:
                status, response = make_response("Ollama error", {"reason": e}, code=500)
                return self._send_json(status, response)

            try:
                final_movies = combined_recommendations(primary_movies, clf_tuple, request_obj["payload"])
            except Exception as e:
                status, response = make_response("Model combine error", {"reason": e}, code=500)
                return self._send_json(status, response)

            status, response = make_response(
                "inference",
                {
                    "movies" : final_movies,
                    "primary_llm" : primary_movies,
                    "mood" : mood,
                    "tone" : tone
                },
                sender="server"
            )
            return self._send_json(status, response)
   
        if self.path == "/inference/log":
            content_len = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_len)

            # validate json
            try:
                request_obj = json.loads(raw_body.decode())
            except:
                status, response = make_response("error", {"reason": "Invalid JSON"}, code=400)
                return self._send_json(status, response)

            # validate MFNP format
            required_keys = ["protocol", "version", "sender", "message_type", "payload"]
            if not all(k in request_obj for k in required_keys):
                status, response = make_response("error", {"reason": "Invalid MNFP message format"}, code=400)
                return self._send_json(status, response)
            
            if request_obj["protocol"] != "MFNP":
                status, response = make_response("error", {"reason": "Unsupported protocol"}, code=400)
                return self._send_json(status, response)

            if request_obj["message_type"] != "inference-log":
                status, response = make_response("error", {"reason": "Wrong message type for /inference/log"}, code=400)
                return self._send_json(status, response)
        
            if "movieTitle" not in request_obj["payload"]:
                status, response = make_response("payload error", {"reason": "movieTitle is required"}, code=400)
                return self._send_json(status, response)

            # data client intended to send
            try:
                global timestamp, temp, lat, lon, city, weather_desc, today_status, tomorrow_status, weekday, title
                timestamp = request_obj["payload"].get("clientSentAt", "")
                env = request_obj["payload"].get("env") or {}
                temp = env.get("temperature", "")
                lat = env.get("lat", "")
                lon = env.get("lon", "")
                city = env.get("city", "")
                weather_desc = env.get("weather_desc", "")
                today_status = env.get("today_status", "")
                tomorrow_status = env.get("tomorrow_status", "")
                weekday = env.get("weekday", "")
                mood = request_obj["payload"].get("mood", "")
                tone = request_obj["payload"].get("tone", "")
                title = request_obj["payload"].get("movieTitle", "")
 		        
                #CREATE CSV ROW
                row = [timestamp,city,lat,lon,today_status,tomorrow_status,weekday,weather_desc,temp,mood,tone,title]

		        # WRITE IMMEDIATELY
                with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(row)
            except PermissionError as e:
                status, response = make_response("error", {"reason": "Permission Error: Cannot write to csv"}, code=500)
                return self._send_json(status, response)
            except Exception as e:
                status, response = make_response("error", {"reason": f"Failed to write CSV: {e}"}, code=500)
                return self._send_json(status, response)

            status, response = make_response("success", {"reason": "log saved in user_logs.csv"}, code=200)
            return self._send_json(status, response)
        
        status, response = make_response("error", {"reason": "unknown endpoint"}, code=404)
        return self._send_json(status, response)

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
