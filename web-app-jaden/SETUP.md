# Setup Instructions for Moodflix React App

## Important: Enable PowerShell Scripts

If you get an error about "running scripts is disabled", run this command in PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then type `Y` to confirm.

## Installation Steps

### 1. Install Node.js Dependencies
```powershell
npm install
```

This will install:
- React 18
- React DOM
- React Router DOM
- Vite
- Bootstrap 5
- Bootstrap Icons

### 2. Start the Backend Server
Open a terminal and run:
```powershell
python api_server.py
```

Keep this running in the background.

### 3. Start the React Development Server
Open **another terminal** and run:
```powershell
npm run dev
```

### 4. Open Your Browser
Navigate to: `http://localhost:5500`

## Troubleshooting

### Error: "npm command not found"
- Install Node.js from https://nodejs.org/ (LTS version recommended)
- Restart your terminal after installation

### Error: "Cannot find module 'react'"
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Error: "Port 5500 already in use"
- Stop any other servers running on that port
- Or change the port in `vite.config.js`:
  ```js
  server: {
    port: 3000, // Change to any available port
    ...
  }
  ```

### Backend API Errors
- Make sure `api_server.py` is running
- Check if Flask is installed: `pip install flask flask-cors`
- Ensure the backend is running on port 5000

### Webcam Not Working
- Allow camera permissions in your browser
- Make sure no other app is using the webcam
- Try using HTTPS (Vite provides this with `npm run dev`)

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `python api_server.py` | Start Flask backend |

## Project URLs

- **Frontend:** http://localhost:5500
- **Backend API:** http://localhost:5000/api
- **API Health Check:** http://localhost:5000/api/health

## Development Tips

1. **Hot Reload:** Vite automatically reloads when you save files
2. **Console Errors:** Open browser DevTools (F12) to see React errors
3. **API Calls:** Check Network tab in DevTools to debug API requests
4. **State Management:** Use React DevTools browser extension

## File Locations

- **Components:** `src/pages/`
- **Styles:** `src/styles/MoodflixStyles.css`
- **API Services:** `src/api/`
- **Data:** `src/data/content.js`
- **Config:** `vite.config.js`, `package.json`

## Next Steps

1. ✅ Install dependencies
2. ✅ Start backend server
3. ✅ Start frontend server
4. ✅ Test emotion detection
5. ✅ Test movie recommendations
6. 🎉 Enjoy your React-powered Moodflix!

---

Need help? Check `REACT_MIGRATION.md` or the main `README.md` file.
