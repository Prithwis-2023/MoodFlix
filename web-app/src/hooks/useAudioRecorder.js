import { useState, useRef, useCallback, useEffect} from 'react';



export const useWebcamCapture = ({ numFrames = 20, frameInterval = 100, deviceId = null }) => {

    // State
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [error, setError] = useState(null);

    // Refs
    // (Refactor) The hook now creates and returns the videoRef
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    // Internal canvas for capturing images
    const canvasRef = useRef(document.createElement('canvas'));

    // (Refactor) Start webcam automatically when the hook is used (on mount)
    useEffect(() => {
        async function startWebcam() {
            setError(null);
            try {
                // 1. Get user media stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });
                streamRef.current = stream;

                // 2. Attach stream to video element
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsWebcamOn(true);
                }
            } catch (err) {
                console.error("Error starting webcam:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Webcam access was denied.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('No webcam was found.');
                } else {
                    setError('Failed to start webcam.');
                }
                setIsWebcamOn(false);
            }
        }

        startWebcam();

        // 3. Cleanup function: stop stream when component unmounts
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Empty array ensures this runs only once on mount

    /**
     * @description Stops the webcam stream and clears the video element.
     * This is the function App.jsx expects to call.
     */
    // (Refactor) Renamed 'stopWebcam' to 'stopCapture' to match App.jsx
    const stopCapture = useCallback(() => {
        if (streamRef.current) {
            // 1. Stop all media tracks
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // 2. Clear the video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsWebcamOn(false);
    }, []); // No dependencies, refs are stable

    /**
     * @description Captures a specified number of frames from the webcam.
     * @returns {Promise<string[]>} A promise that resolves with an array of Base64-encoded image strings.
     */
    // (Refactor) Renamed 'captureBase64Image' to 'captureFrames'
    // Now loops 'numFrames' times
    const captureFrames = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isWebcamOn || !videoRef.current.videoWidth) {
            const errText = "Cannot capture: Webcam not ready or refs not set.";
            console.warn(errText);
            setError(errText);
            throw new Error(errText);
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        const frames = [];

        for (let i = 0; i < numFrames; i++) {
            if (!streamRef.current) { // Check if webcam was stopped during capture
                throw new Error("Webcam stream stopped during capture.");
            }

            // 1. Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 2. Get data URL (as JPEG)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // 3. Get only the Base64 part (as in your original code)
            frames.push(dataUrl.split(',')[1]);

            // 4. Wait for the interval (if not the last frame)
            if (i < numFrames - 1) {
                await new Promise(resolve => setTimeout(resolve, frameInterval));
            }
        }

        return frames; // Return the array of base64 strings

    }, [isWebcamOn, numFrames, frameInterval]); // Dependencies


    // Return the values expected by App.jsx
    return {
        videoRef,     // (React.Ref) Ref to be attached to the <video> element.
        isWebcamOn,   // (boolean) Is the webcam currently streaming?
        error,        // (string | null) Any error message.
        stopCapture,  // (function) Call to stop the webcam stream.
        captureFrames // (function) Call to capture frames (returns Promise<string[]>)
    };
}