#!/usr/bin/env/python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
import socket
import hashlib
from aiengine import train_on_user_data, ollama_inference, combined_recommendations, emotion_history_with_confidence

HOST = "0.0.0.0" 
PORT = 8000
IDLE_TIMEOUT = 60
NODE_ID = socket.gethostname().replace(".local", "").lower()
DATA_FILE = "user_logs.csv"

clf_tuple = train_on_user_data(DATA_FILE)

def compute_file_hash(path):
	if not os.path.exists(path):
		return None
	
	with open(path, "rb") as f:
		data = f.read()
	
	# SHA256 ensures consistency across nodes
	return hashlib.sha256(data).hexdigest()

def make_response(message_type, payload, role="server", code=200):
	return {
		"protocol":"MFNP",
		"version":  1.0,
		"role": role,
		"message_type": message_type,
		"sender_id": NODE_ID,
		"payload": payload
	}, code

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

	def do_POST(self):
		if self.path == "/inference":
			try:
				content_len = int(self.headers.get("Content-Length", 0))
				body = self.rfile.read(content_len)
				messgae = json.loads(body.decode())
			except:
				return self._send_json({"error" : "Invalid or missing JSON"}, 400)
			
			# validate protocol
			if message.get("protocol") != "MFNP":
				return self._send_json({"error": "Unknown or missing protocol (expected 'MFNP')" }, 400)
			
			role = message.get("role")
			msg_type = message.get("message_type")

			# client->server inference request
			if role == "client" and msg_type == "payload":
				emotion_history_with_confidence.clear()  # clearing per request
				try:
					primary_movies = ollama_inference(message["payload"])
					final = combined_recommendations(primary, clf_tuple, message["payload"])

					response_body, status = make_response (
						message_type="inference_response",
						payload={
							"movies": final,
							"primary_llm": primary
						}
					)

					return self._send_json(response_body, status)
				
				except Exception as e:
					error_body, status = make_response (
						message_type="error",
						payload={"details": str(e)},
						code=500
					)
					return self._send_json(error_body, 500)

			# node -> node sync request
			elif role == "node" and msg_type == "sync_request":
				
				requested_hash = message.get("payload", {}).get("hash")

				if not os.path.exists(DATA_FILE):
					response, status = make_response (
						"sync_ack",
						{"status": "file_missing_on_receiver"}
					)
					return self._send_json(response, status)

				with open(DATA_FILE, "rb") as f:
					file_data = f.read()
				
				local_hash = str(compute_file_hash(DATA_FILE))

				# files match, no need to sync
				if requested_hash == local_hash:
					response, status = make_response (
						"sync_ack",
						{"status":"up_to_date"}
					)
					return self._send_json(response, status)
				
				#send updated file
				encoded = base64.b64eecode(file_data).decode()
				response, status = make_response (
					"sync_ack",
					{"status":"update_available", "file_content_b64":encoded}
				)
				return self._send_json(response, status)

			# unknown message type
			else:
				return self._send_json({"error": f"Unkown role/message_type combination: {role}/{msg_type}"}, 400)

def run_server():
	server = HTTPServer((HOST, PORT), JetsonHandler)
	print(f"🌐 MoodFlix Node Online @ http://{HOST}:{PORT} (ID: {NODE_ID})")
	#print(f"Server running on http://{HOST}:{PORT}")
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
