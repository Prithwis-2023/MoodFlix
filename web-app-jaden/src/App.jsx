import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EmotionDetectorPage from './pages/EmotionDetectorPage';
import MovieDetailPage from './pages/MovieDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/emotion-detector" element={<EmotionDetectorPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
