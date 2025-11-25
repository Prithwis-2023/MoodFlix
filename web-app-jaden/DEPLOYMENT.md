# Moodflix Backend Deployment

## Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `jaden769/MoodFlix`
4. Configure:
   - **Name**: moodflix-api
   - **Root Directory**: `web-app-jaden`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn api_server_simple:app`
5. Click "Create Web Service"

Your API will be live at: `https://moodflix-api.onrender.com`

## Update Frontend

After deployment, update the API URL in `src/api/apiService.js`:

```javascript
const API_BASE_URL = 'https://moodflix-api.onrender.com';
```

Then rebuild and redeploy:
```bash
npm run build
git add .
git commit -m "Update API URL to Render deployment"
git push origin main
```

## Alternative: Railway

1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select `jaden769/MoodFlix`
4. Railway will auto-detect Python and deploy
5. Add domain in Settings

Your API will be at: `https://moodflix-api.up.railway.app`
