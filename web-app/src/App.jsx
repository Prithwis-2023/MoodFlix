import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import './App.css'


import { useWebcamCapture } from './hooks/useAudioRecorder';
import { useAudioRecorder } from './hooks/useWebcamCapture';
import { useEnvironment } from './hooks/useEnvironment';

import { sendInferenceRequest } from './api/inferenceAPI';

import LoadingSpinner from './components/LoadingSpinner';
import RecommendationCard from './components/RecommendationCard';
import GetRecommendationButton from './components/GetRecommendationButton';

function App() {
  // 'recommendations' (메인) 또는 'capture' (분석)
  const [view, setView] = useState('recommendations');

  // API 응답으로 받은 추천 목록
  const [recommendations, setRecommendations] = useState([
    // --- 개발용 Mock 데이터 (디자인 확인용) ---
    // { id: 1, title: "Enetah the Crimson SK", rating: 7.2, posterUrl: "https://placehold.co/600x900/4a4e69/ffffff?text=Enetah" },
    // { id: 2, title: "The Last Starfall", rating: 7.7, posterUrl: "https://placehold.co/600x900/4a4e69/ffffff?text=Starfall" },
  ]);

  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ------------------------------------------------
  // 뷰 렌더링 로직 (조건부 "라우팅")
  // ------------------------------------------------

  if (view === 'capture') {
    // "캡처 페이지" 렌더링
    return (
      <CapturePage
        setRecommendations={setRecommendations}
        setView={setView}
        setIsLoading={setIsLoading}
        setError={setError}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // "메인 추천 페이지" 렌더링 (기본값)
  return (
    <RecommendationsPage
      recommendations={recommendations}
      setView={setView}
    />
  );
}

// ------------------------------------------------
// 1. 메인 추천 페이지 (RecommendationsPage)
// (App.jsx 파일 내부에 선언)
// ------------------------------------------------
function RecommendationsPage({ recommendations, setView }) {
  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🎬 Moodflix</h1>
        <GetRecommendationButton onClick={() => setView('capture')}>
          Get AI Recommendations
        </GetRecommendationButton>
      </header>

      <main style={styles.mainContent}>
        <h2 style={styles.sectionTitle}>★ MOVIE RECOMMENDATIONS</h2>
        <div style={styles.grid}>
          {recommendations.length > 0 ? (
            recommendations.map((movie) => (
              <RecommendationCard
                key={movie.id || movie.title}
                title={movie.title}
                rating={movie.rating}
                posterUrl={movie.posterUrl}
              />
            ))
          ) : (
            <p style={styles.emptyText}>
              AI 추천을 받아보세요! (Get AI Recommendations)
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// ------------------------------------------------
// 2. 캡처/분석 페이지 (CapturePage)
// (App.jsx 파일 내부에 선언)
// ------------------------------------------------
function CapturePage({ setRecommendations, setView, setIsLoading, setError, isLoading, error }) {

  // --- 3가지 훅 모두 호출 ---
  const { videoRef, captureFrames, stopCapture } = useWebcamCapture({ numFrames: 20 });
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const { city, weather, dayStatus, weekday, temperature } = useEnvironment();

  /**
   * @description "분석 시작" 버튼 클릭 시 실행되는 메인 함수
   */
  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // --- 모든 데이터 수집 (Phase 7, Step 4) ---

      // 1. 환경 데이터
      const envData = { city, weather, dayStatus, weekday, temperature };
      console.log("1. Environment data:", envData);

      // 2. 오디오 녹음 시작
      await startRecording();
      console.log("2. Audio recording started...");

      // 3. 웹캠 프레임 캡처
      const frames = await captureFrames();
      console.log("3. Webcam frames captured:", frames.length);

      // 4. 오디오 녹음 중지 및 Base64 변환
      const audioBase64 = await stopRecording();
      console.log("4. Audio recording stopped, Base64 created.");

      // 5. 웹캠 스트림 정리
      stopCapture();

      // --- 데이터 전송 ---
      const payload = {
        ...envData,
        frames: frames,
        audio: audioBase64
      };

      console.log("5. Sending payload to server...", payload);
      const results = await sendInferenceRequest(payload);

      // --- 결과 처리 ---
      if (results && results.recommendations) {
        console.log("6. Success! Recommendations received.");
        setRecommendations(results.recommendations);
        setView('recommendations'); // 성공 시 메인 페이지로 이동
      } else {
        throw new Error(results?.error || "서버에서 유효한 추천을 받지 못했습니다.");
      }

    } catch (err) {
      console.error("Analysis failed:", err);
      setError(`분석 실패: ${err.message}. (서버 IP, CORS, 훅 권한을 확인하세요)`);
      stopCapture(); // 오류 시에도 웹캠 정리
    } finally {
      setIsLoading(false);
    }

  }, [
    city, weather, dayStatus, weekday, temperature,
    startRecording, captureFrames, stopRecording, stopCapture,
    setRecommendations, setView, setIsLoading, setError
  ]);

  // --- 캡처 페이지 UI 렌더링 ---
  return (
    <div style={styles.captureContainer}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🎬 Moodflix AI</h1>
      </header>

      <div style={styles.captureContent}>
        <h2 style={styles.sectionTitle}>CAPTURE YOUR EMOTION</h2>

        {/* 로딩 중일 때 스피너 표시 */}
        {isLoading && (
          <LoadingSpinner message="얼굴과 음성을 분석 중입니다... (약 30초)" />
        )}

        {/* 에러 발생 시 메시지 표시 */}
        {error && !isLoading && (
          <div style={styles.errorBox}>
            <p>🚫 {error}</p>
          </div>
        )}

        {/* 기본 캡처 UI (로딩 중이 아닐 때) */}
        {!isLoading && (
          <Fragment>
            <div style={styles.videoBox}>
              <video
                ref={videoRef}
                style={styles.videoPreview}
                autoPlay
                playsInline
                muted
              />
            </div>
            <GetRecommendationButton onClick={handleAnalyze} disabled={isRecording}>
              {isRecording ? "녹음 중..." : "AI 분석 시작"}
            </GetRecommendationButton>
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------
// 스타일 객체 (디자인 시안 기반)
// ------------------------------------------------
const styles = {
  // --- Global ---
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#1F202E', // 메인 배경색
    color: 'white',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid #333652',
  },
  logo: {
    margin: 0,
    fontSize: '1.5em',
  },
  sectionTitle: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#E0E0E0',
    borderBottom: '2px solid #FF4A6F', // 핑크색 밑줄
    paddingBottom: '8px',
    marginBottom: '24px',
  },

  // --- RecommendationsPage ---
  mainContent: {
    padding: '20px 40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '24px',
  },
  emptyText: {
    color: '#888',
    fontSize: '1.1em',
  },

  // --- CapturePage ---
  captureContainer: {
    minHeight: '100vh',
    backgroundColor: '#1F202E',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  captureContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '20px 40px',
  },
  videoBox: {
    width: '100%',
    maxWidth: '640px',
    minHeight: '480px', // 디자인 시안의 빈 네모칸 높이
    backgroundColor: '#111',
    borderRadius: '12px',
    border: '2px solid #333652',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24px',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    transform: 'scaleX(-1)', // 거울 모드
  },
  errorBox: {
    width: '100%',
    maxWidth: '640px',
    padding: '20px',
    backgroundColor: 'rgba(255, 74, 111, 0.1)', // 핑크 배경
    border: '1px solid #FF4A6F',
    borderRadius: '8px',
    color: '#FFCDD2',
    marginBottom: '20px',
  },
};


export default App
