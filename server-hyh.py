#!/usr/bin/env/python3

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
import base64
import io

import numpy as np
import cv2
import librosa


from ai_module import run_emotion_movie_pipeline


HOST = "0.0.0.0"
PORT = 8080

LAST_CONTEXT = {
    "city": None,
    "temperature": None,
    "weather_desc": None,
    "today_status": None,
    "tomorrow_status": None,
    "weekday": None,
    "time": None, 
}

class JetsonHandler(BaseHTTPRequestHandler):

    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.end_headers()

    def do_GET(self):
        if self.path == "/telemetry":
            try:
                
                global LAST_CONTEXT

                
                data = {
                    "city": LAST_CONTEXT["city"],
                    "temperature": LAST_CONTEXT["temperature"],
                    "weather_desc": LAST_CONTEXT["weather_desc"],
                    "today_status": LAST_CONTEXT["today_status"],
                    "tomorrow_status": LAST_CONTEXT["tomorrow_status"],
                    "weekday": LAST_CONTEXT["weekday"],
                    "time": LAST_CONTEXT["time"],  # latest update
                    "status": "OK"
                }

                self._set_headers(200)
                self.wfile.write(json.dumps(data).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))



    def do_POST(self):
        if self.path != "/inference":
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Invalid POST path"}).encode("utf-8"))
            return

        try:
            # 1. 요청 바디 읽기
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Empty request body"}).encode("utf-8"))
                return

            raw_body = self.rfile.read(content_length)
            body = json.loads(raw_body.decode("utf-8"))

            # [REFACTOR] 1.5. 환경 정보 파싱 및 전역 컨텍스트 업데이트
            env = body.get("env", {})
            city = env.get("city")
            temperature = env.get("temperature")
            weather_desc = env.get("weather_desc")
            today_status = env.get("today_status")
            tomorrow_status = env.get("tomorrow_status")
            weekday = env.get("weekday")
            lat = env.get("lat") # 위도 (추가)
            lon = env.get("lon") # 경도 (추가)

            # 전역 컨텍스트 업데이트
            global LAST_CONTEXT
            LAST_CONTEXT.update({
                "city": city,
                "temperature": temperature,
                "weather_desc": weather_desc,
                "today_status": today_status,
                "tomorrow_status": tomorrow_status,
                "weekday": weekday,
                "time": time.ctime(), # 서버가 받은 시간
            })

            # 2. 필수 필드 체크
            if "audio_base64" not in body or "frames" not in body:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    "error": "Missing 'audio_base64' or 'frames' in JSON body"
                }).encode("utf-8"))
                return

            sample_rate = int(body.get("sample_rate", 16000))

            #audio Decode (base64-> bytes-> librosa.load → audio_data)
            audio_b64 = body["audio_base64"]
            try:
                audio_bytes = base64.b64decode(audio_b64)
            except Exception:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Invalid audio_base64"}).encode("utf-8"))
                return

            audio_file = io.BytesIO(audio_bytes)
            audio_data, sr = librosa.load(audio_file, sr=sample_rate)  # float32 1D numpy array

            
            # 4. frame decoding: base64 JPEG list → OpenCV BGR image list
            
            frames_b64 = body["frames"]
            if not isinstance(frames_b64, list) or len(frames_b64) == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "frames must be a non-empty list"}).encode("utf-8"))
                return

            frames = []
            for fb64 in frames_b64:
                try:
                    img_bytes = base64.b64decode(fb64)
                    arr = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)  # BGR 이미지
                    if img is not None:
                        frames.append(img)
                except Exception as e:
                    print(f"[WARN] Failed to decode one frame: {e}")
                    continue

            if not frames:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "No valid frames decoded"}).encode("utf-8"))
                return

            # create env_context dictionary
            env_context = {
                "city": city,
                "temperature": temperature,
                "weather_desc": weather_desc,
                "today_status": today_status,
                "tomorrow_status": tomorrow_status,
                "weekday": weekday,
                "lat": lat,
                "lon": lon
            }
            
            print("[INFO] Running emotion + movie pipeline with env context...")


            result = run_emotion_movie_pipeline(frames, audio_data, sample_rate,env_context)
            # 6. result
            self._set_headers(200)
            self.wfile.write(json.dumps(result).encode("utf-8"))

        except Exception as e:
            print(f"[ERR] /inference error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))



def run():
    server = HTTPServer((HOST, PORT), JetsonHandler)
    print(f"[INFO] Server running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[INFO] Shutting down server...")
        server.server_close()


if __name__ == "__main__":
    run()
