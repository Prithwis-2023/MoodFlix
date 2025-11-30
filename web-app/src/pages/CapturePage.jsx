import { useEffect, useState } from 'react';
import { useWebcamCapture } from '../hooks/useWebcamCapture';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useEnvironment } from '../hooks/useEnvironment';
import { sendInferenceRequest } from '../api/inferenceAPI';
import LoadingSpinner from '../components/LoadingSpinner';
import GetRecommendationButton from '../components/GetRecommendationButton';
import RecommendationCard from '../components/RecommendationCard';

function CapturePage({ setRecommendations, setView, isLoading, setIsLoading, error, setError }) {
    const { videoRef, isWebcamOn, error: webcamError, startWebcam, stopWebcam, captureFrames } =
        useWebcamCapture();
    const { isRecording, error: audioError, startRecording, stopRecording } = useAudioRecorder();
    const { city,weekday, temperature,
        weather_desc,
        today_status,
        tomorrow_status,
        lat,
        lon, } = useEnvironment();

    const [statusMessage, setStatusMessage] = useState('');

    // automatically choose camera
    useEffect(() => {
        let canceled = false;

        (async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.enumerateDevices) {
                    setError('MediaDevices API not supported in this browser.');
                    return;
                }

                
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                tempStream.getTracks().forEach((t) => t.stop());

                if (canceled) return;

                const videoDevices = devices.filter((d) => d.kind === 'videoinput');

                if (!videoDevices.length) {
                    setError('no video input devices found');
                    return;
                }

                // 2) execption another camera
                const lower = (s) => (s || '').toLowerCase();
                let preferred =
                    videoDevices.find((d) => {
                        const label = lower(d.label);
                        return (
                            !label.includes('droidcam') &&
                            !label.includes('virtual') &&
                            !label.includes('obs') &&
                            !label.includes('snap camera')
                        );
                    }) ||
                    // internal webcam
                    videoDevices.find((d) => {
                        const label = lower(d.label);
                        return (
                            label.includes('integrated') ||
                            label.includes('webcam') ||
                            label.includes('hd camera')
                        );
                    }) ||
                    
                    videoDevices[0];

                console.log('auto selected camera:', preferred.label, preferred.deviceId);

                await startWebcam(preferred.deviceId);
                setStatusMessage(`camera: ${preferred.label}`);
            } catch (err) {
                console.error('auto camera select error:', err);
                setError('failed to start camera. check permission or device setting.');
            }
        })();

        return () => {
            canceled = true;
            stopWebcam();
        };
    }, [startWebcam, stopWebcam, setError]);

    //capture + recording + analyze in server
    const handleCaptureAndAnalyze = async () => {
        if (isLoading) return;

        setError(null);
        setStatusMessage('capture & record started ...');
        setIsLoading(true);

        try {
            if (!isWebcamOn) {
                throw new Error('webcam is not on');
            }

            //eviroment data
            const environment = {
                city,
                weather_desc,
                today_status,
                weekday,
                temperature,
                tomorrow_status,
                lat,
                lon,
            };

            
            await startRecording();

            //capture frame
            const frames = await captureFrames(20, 250); // 20, 250ms

            // convert to base64
            const audioBase64 = await stopRecording();

            setStatusMessage(
                `capture done. frames: ${frames.length}, audio length: ${audioBase64?.length || 0}`
            );


            //***************
            // 4) payload structure
            //******************* 

            const payload = {
                environment,       
                images: frames,    // base64 string array
                audio: audioBase64 // base64 string
            };

            const result = await sendInferenceRequest(payload);

            if (!result) {
                throw new Error('no response from server');
            }

            const movieTitles = result.recommendations || result.movies;

            if (!movieTitles) {
                console.warn('server response:', result);
                throw new Error('no movies or recommendations field found');
            }

            setRecommendations(movieTitles);
            setView('recommendations');
        } catch (err) {
            console.error('handleCaptureAndAnalyze error:', err);
            setError(err.message || 'unknown error');
            setView('recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    
    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <h1 style={styles.logo}>🎬 Moodflix AI</h1>
            </header>

            <main style={styles.main}>
                <section style={styles.left}>
                    <h2 style={styles.title}>CAPTURE YOUR EMOTION</h2>

                    <p style={styles.subtitle}>
                        Capture your emotion,
                        <br />
                        and recommendation movies.
                    </p>

                    <div style={styles.statusBox}>
                        <p> webcam : {isWebcamOn ? 'ON' : 'OFF'}</p>
                        <p> audio : {isRecording ? 'recording...' : 'idle'}</p>
                        {statusMessage && <p>ℹ️ {statusMessage}</p>}
                        {webcamError && <p style={styles.errorText}>webcam error : {webcamError}</p>}
                        {audioError && <p style={styles.errorText}>audio error : {audioError}</p>}
                        {error && <p style={styles.errorText}>app error : {error}</p>}
                    </div>

                    <div style={styles.buttonBox}>
                        <GetRecommendationButton 
                        onClick={handleCaptureAndAnalyze}
                        isabled={isLoading || !isWebcamOn}
                        >
                            
                            Get recommendations
                        </GetRecommendationButton>
                    </div>

                    {isLoading && (
                        <div style={{ marginTop: 16 }}>
                            <LoadingSpinner message="analyze emotion ... (up to 30 sec)" />
                        </div>
                    )}
                </section>

                <section style={styles.right}>
                    <div style={styles.videoWrapper}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={styles.video}
                        />
                    </div>
                    <p style={styles.hint}>
                        • 
                        <br />
                        • 
                    </p>
                </section>
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', // Target gradient
        color: '#fff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)', // Subtle header bg
    },
    logo: {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 700,
        letterSpacing: '1px',
        color: '#fff',
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#ff6b6b', // Accent color
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
    main: {
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: '72px',
        padding: '2rem',
    },
    container: {
        width: '100%',
        maxWidth: '1100px',
        display: 'flex',
        flexWrap: 'wrap', // Responsive wrap
        gap: '3rem',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Left Section Styles
    leftSection: {
        flex: '1 1 400px', // Grow, Shrink, Basis
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    titleBox: {
        borderBottom: '3px solid #ff6b6b', // Section title style
        paddingBottom: '1rem',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        margin: '0 0 0.5rem 0',
        lineHeight: 1.1,
    },
    subtitle: {
        fontSize: '1rem',
        color: 'rgba(255,255,255,0.7)',
        margin: 0,
        lineHeight: 1.6,
    },
    infoCard: {
        background: 'rgba(255, 255, 255, 0.05)', // Info card style
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
    },
    statusRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.8rem',
        fontSize: '0.95rem',
    },
    statusLabel: {
        color: '#ccc',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontSize: '0.85rem',
    },
    statusOn: { color: '#4caf50', fontWeight: 'bold' },
    statusOff: { color: '#f44336', fontWeight: 'bold' },
    statusRecording: { color: '#ff6b6b', fontWeight: 'bold', animation: 'pulse 1.5s infinite' },
    statusIdle: { color: '#888' },

    messageBox: {
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#eee',
    },
    errorBox: {
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        border: '1px solid #f44336',
        borderRadius: '8px',
        color: '#ff8a80',
        fontSize: '0.85rem',
    },
    buttonWrapper: {
        marginTop: '0.5rem',
        display: 'flex',
        justifyContent: 'flex-start',
    },
    loaderBox: {
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'center',
    },

    // Right Section Styles (Video)
    rightSection: {
        flex: '1 1 400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
    },
    cameraContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 107, 107, 0.5)', // The red border from CSS
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
    },
    video: {
        width: '100%',
        display: 'block',
        transform: 'scaleX(-1)', // Mirror effect (optional, standard for webcams)
        backgroundColor: '#000',
        minHeight: '300px',
        borderRadius: '12px',
    },
    hint: {
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 1.5,
    },

    // Styles for internal components
    
    spinner: {
        width: '24px',
        height: '24px',
        border: '3px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        borderTopColor: '#ff6b6b',
        animation: 'spin 0.8s linear infinite',
    }
};

export default CapturePage;