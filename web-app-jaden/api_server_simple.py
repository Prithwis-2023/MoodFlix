"""
Moodflix Simple API Server (Without Heavy AI Dependencies)
For full AI features, install: deepface, opencv-python, tensorflow, etc.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Mock data for testing without AI
EMOTIONS = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear']
CITIES = ['Seoul', 'New York', 'London', 'Tokyo', 'Paris']
WEATHER_CONDITIONS = ['clear', 'cloudy', 'rainy', 'sunny', 'snowy']

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "API server is running"}), 200

@app.route('/api/context', methods=['GET'])
def get_context():
    """Get user context (mock data)"""
    try:
        weekday = datetime.now().strftime('%A')
        is_weekend = weekday in ['Saturday', 'Sunday']
        
        context = {
            "city": random.choice(CITIES),
            "weather": random.choice(WEATHER_CONDITIONS),
            "temperature": round(random.uniform(10, 30), 2),
            "today_status": "Weekend" if is_weekend else "Weekday",
            "tomorrow_status": "Weekend" if not is_weekend else "Weekday",
            "weekday": weekday
        }
        return jsonify(context), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/emotion', methods=['POST'])
def detect_emotion():
    """Detect emotion from image (mock implementation)"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image provided"}), 400
        
        # Mock emotion detection
        emotion = random.choice(EMOTIONS)
        confidence = round(random.uniform(0.7, 0.95), 2)
        
        result = {
            "emotion": emotion,
            "confidence": confidence,
            "voice_tone": emotion  # Mock voice tone
        }
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def recommend_movies():
    """Get movie recommendations (mock implementation)"""
    try:
        data = request.get_json()
        emotion = data.get('emotion', 'neutral')
        available_movies = data.get('available_movies', [])
        
        # Simple recommendation logic based on emotion
        recommendations = []
        if available_movies:
            # Select random movies from available ones
            num_recommendations = min(5, len(available_movies))
            recommendations = random.sample(available_movies, num_recommendations)
        
        reasoning = f"Based on your {emotion} mood and current context, we recommend these movies."
        
        result = {
            "recommendations": recommendations,
            "emotion": emotion,
            "reasoning": reasoning
        }
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/log-selection', methods=['POST'])
def log_selection():
    """Log user movie selection"""
    try:
        data = request.get_json()
        # In a real app, save to database or CSV
        print(f"User selected: {data.get('movie')}")
        return jsonify({"status": "logged"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🎬 Moodflix Simple API Server Starting...")
    print("=" * 50)
    print("⚠️  NOTE: Running in SIMPLE MODE (without AI)")
    print("    Emotion detection and recommendations are mocked")
    print("    To enable full AI features:")
    print("    1. Enable Windows Long Paths (see SETUP.md)")
    print("    2. Install: pip install -r requirements-full.txt")
    print("=" * 50)
    print("✅ Server running on http://localhost:5000")
    print("   Health check: http://localhost:5000/api/health")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
