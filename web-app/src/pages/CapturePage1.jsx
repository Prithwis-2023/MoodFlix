import { useEffect, useRef, useState } from 'react';
import { useEnvironment } from '../hooks/useEnvironment';
import LoadingSpinner from '../components/LoadingSpinner';
import GetRecommendationButton from '../components/GetRecommendationButton';

const SIGNALING_URL = "ws://172.19.27.2:8000/signaling"; 

function CapturePage1({ setRecommendations, setView,setServerTitles, isLoading, setIsLoading, error, setError }) {
    const videoRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);

    const { city, weather, dayStatus, weekday, temperature } = useEnvironment();

    const [statusMessage, setStatusMessage] = useState('');
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false); // WebRTC stream condition
    const [webcamError, setWebcamError] = useState(null);
    const [audioError, setAudioError] = useState(null);

  
    useEffect(() => {
        let canceled = false;

        (async () => {
            try {
                if (
                    !navigator.mediaDevices?.getUserMedia ||
                    !navigator.mediaDevices?.enumerateDevices
                ) {
                    setError('MediaDevices API not supported in this browser.');
                    return;
                }

                // 1)connect WebSocket signaling 
                wsRef.current = new WebSocket(SIGNALING_URL);

                // message from server (answer / ice / inference_result / error)
                wsRef.current.onmessage = async (msg) => {
                    try {
                        const data = JSON.parse(msg.data);

                        if (data.answer && pcRef.current) {
                            
                            await pcRef.current.setRemoteDescription(data.answer);
                            console.log('✅ set remote answer');
                        }

                        if (data.ice && pcRef.current) {
                            try {
                                await pcRef.current.addIceCandidate(data.ice);
                                console.log('✅ added remote ICE');
                            } catch (e) {
                                console.error('Error adding remote ICE candidate', e);
                            }
                        }

                        if (data.inference_result) {
                            console.log('🎬 inference_result (titles):', data.inference_result);

                            // 서버에서 받은 "제목 배열"을 App으로 올려줌
                            setServerTitles(data.inference_result);

                            setView('recommendations');
                            setIsLoading(false);
                            setStatusMessage('inference done');
                        }

                        if (data.error) {
                            console.error('server error:', data.error);
                            setError(data.error);
                            setIsLoading(false);
                            setStatusMessage('server error');
                        }
                    } catch (e) {
                        console.error('onmessage parse error:', e);
                    }
                };

                wsRef.current.onerror = (e) => {
                    console.error('WebSocket error:', e);
                    if (!canceled) {
                        setError('failed to connect signaling server');
                        setStatusMessage('signaling error');
                    }
                };

                wsRef.current.onclose = () => {
                    console.log('WebSocket closed');
                    if (!canceled) {
                        setStatusMessage('signaling closed');
                    }
                };

                // wating WebSocket OPEN 
                await new Promise((resolve, reject) => {
                    wsRef.current.onopen = () => {
                        console.log('WebSocket signaling connected');
                        setStatusMessage('signaling connected. preparing camera...');
                        resolve();
                    };
                    wsRef.current.onerror = (e) => {
                        console.error('WebSocket error (during connect):', e);
                        setError('failed to connect signaling server');
                        reject(e);
                    };
                });

                if (canceled) return;

                // 2) create PeerConnection 
                pcRef.current = new RTCPeerConnection({
                    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
                });

                pcRef.current.onicecandidate = (event) => {
                    if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                        console.log('📨 sending local ICE to server');
                        wsRef.current.send(JSON.stringify({ ice: event.candidate }));
                    }
                };

                // 3) select camera divice
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                tempStream.getTracks().forEach((t) => t.stop());

                if (canceled) return;

                const videoDevices = devices.filter((d) => d.kind === 'videoinput');
                if (!videoDevices.length) {
                    setError('no video input devices found');
                    return;
                }

                const lower = (s) => (s || '').toLowerCase();

                let preferred =
                    // 3-1) except droidcam / virtual / obs / snap camera 
                    videoDevices.find((d) => {
                        const label = lower(d.label);
                        return (
                            !label.includes('droidcam') &&
                            !label.includes('virtual') &&
                            !label.includes('obs') &&
                            !label.includes('snap camera')
                        );
                    }) ||
                    // 3-2) integrated / webcam / hd camera 
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

                // 4) open stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: preferred.deviceId } },
                    audio: true,
                });

                if (canceled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                //connect stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                setIsWebcamOn(true);
                setIsRecording(true);
                setStatusMessage(`camera: ${preferred.label} (WebRTC streaming...)`);

               
                stream.getTracks().forEach((track) => {
                    pcRef.current.addTrack(track, stream);
                });

                // 5) create offer and send to server 
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    console.log('📨 sending offer to server');
                    wsRef.current.send(JSON.stringify({ offer }));
                } else {
                    console.warn('WebSocket not open when sending offer');
                    setStatusMessage('signaling not ready for offer');
                }
            } catch (err) {
                console.error('WebRTC init error:', err);
                if (!canceled) {
                    setError('failed to start camera or WebRTC. check permission or device setting.');
                    setWebcamError(err.message);
                }
            }
        })();

        // cleanup
        return () => {
            canceled = true;
            setIsWebcamOn(false);
            setIsRecording(false);

            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((t) => t.stop());
            }
        };
    }, [setError, setIsLoading, setRecommendations, setView]);
    
    const handleCaptureAndAnalyze = () => {
        if (isLoading) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('signaling connection is not ready');
            return;
        }

        setError(null);
        setStatusMessage('inference request sent ...');
        setIsLoading(false);

        
        const environment = {
            city,
            weather,
            dayStatus,
            weekday,
            temperature,
        };

        wsRef.current.send(
            JSON.stringify({
                action: 'infer_once',
                environment,
            })
        );
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <h1 style={styles.logo}>🎬 Moodflix</h1>
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
                        <p> audio : {isRecording ? 'streaming...' : 'idle'}</p>
                        {statusMessage && <p>ℹ️ {statusMessage}</p>}
                        {webcamError && <p style={styles.errorText}>webcam error : {webcamError}</p>}
                        {audioError && <p style={styles.errorText}>audio error : {audioError}</p>}
                        {error && <p style={styles.errorText}>app error : {error}</p>}
                    </div>

                    <div style={styles.buttonBox}>
                        <GetRecommendationButton
                            onClick={handleCaptureAndAnalyze}
                            disabled={isLoading || !isWebcamOn}
                        >
                            Get recommendations
                        </GetRecommendationButton>
                    </div>

                    {isLoading && (
                        <div style={{ marginTop: 16 }}>
                            <LoadingSpinner message="analyze emotion via WebRTC ... (up to 30 sec)" />
                        </div>
                    )}
                </section>

                <section style={styles.right}>
                    <div style={styles.videoWrapper}>
                        <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                    </div>
                    <p style={styles.hint}>• WebRTC streaming •</p>
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

export default CapturePage1;