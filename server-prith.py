#!/usr/bin/env/python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
import socket
from aiengine import train_on_user_data, ollama_inference, combined_recommendations

HOST = "0.0.0.0" 
PORT = 8080
IDLE_TIMEOUT = 60

clf_tuple = train_on_user_data("user_logs.csv")

class JetsonHandler(BaseHTTPRequestHandler):
	def _send_json(self, code, obj):
		self.send_response(code)
		self.send_header("Content-type", "application/json")
		self.end_headers()
		self.wfile.write(json.dumps(obj).encode())
	def do_POST(self):
		if self.path == "/inference":
			content_len = int(self.headers.get("Content-Length", 0))
			raw_body = self.rfile.read(content_len)
			
			try:
				payload = json.loads(raw_body.decode())
			except:
				return self._send_json(400, {"error": "Invalid JSON"})
			
			try:
				primary_movies = ollama_inference(payload)
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
