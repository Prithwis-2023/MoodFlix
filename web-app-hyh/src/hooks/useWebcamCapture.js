import { useState, useRef, useCallback, useEffect } from 'react';

export const useWebcamCapture = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const canvasRef = useRef(document.createElement('canvas'));
    
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [error, setError] = useState(null);

    const startWebcam = useCallback(async (deviceId = null) => {
        try {
            setError(null);

            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }

            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: false,
            };

            console.log('startWebcam with deviceId:', deviceId, 'constraints:', constraints);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsWebcamOn(true);
        } catch (err) {
            console.error('startWebcam error:', err);
            setError('error check camera athority');
            setIsWebcamOn(false);
        }
    }, []);

    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsWebcamOn(false);
    }, []);

    const captureFrames = useCallback(
        async (numFrames = 20, interval = 150) => {
            if (!isWebcamOn || !videoRef.current) {
                throw new Error('webcam is not on');
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const frames = [];

            for (let i = 0; i < numFrames; i++) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // "data:image/jpeg;base64,..."
                const base64 = dataUrl.split(',')[1]; //base64
                frames.push(base64);

                if (i < numFrames - 1) {
                    await new Promise((resolve) => setTimeout(resolve, interval));
                }
            }

            return frames;
        },
        [isWebcamOn]
    );

    
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    return {
        videoRef,
        isWebcamOn,
        error,
        startWebcam,
        stopWebcam,
        captureFrames,
    };
};