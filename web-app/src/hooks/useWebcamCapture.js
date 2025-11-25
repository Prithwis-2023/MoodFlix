import { useState, useRef, useCallback, useEffect} from 'react';


export const useAudioRecorder = () => {
    // State to track if recording is currently active
    const [isRecording, setIsRecording] = useState(false);
    // State to store any error message
    const [error, setError] = useState(null);
    // State to store the most recent audio blob (still useful for debugging/local state)
    const [audioBlob, setAudioBlob] = useState(null);

    // Ref to hold the MediaRecorder instance
    const mediaRecorderRef = useRef(null);
    // Ref to hold the array of audio chunks
    const audioChunksRef = useRef([]);
    // Ref to hold the media stream
    const streamRef = useRef(null);

    /**
     * @description Starts the audio recording process.
     * Asks for microphone permission and sets up media recorder.
     */
    const startRecording = useCallback(async () => {
        // 1. Initialize state
        setAudioBlob(null);
        audioChunksRef.current = [];
        setError(null);

        try {
            // 2. Get user media stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream; // Save stream to stop it later
            setIsRecording(true);

            // 3. Create MediaRecorder instance
            const options = { mimeType: 'audio/webm;codecs=opus' };
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            // 4. Set up 'dataavailable' listener to collect chunks
            mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            });

            // 5. Start recording
            mediaRecorder.start();

        } catch (err) {
            console.error("Error starting audio recording:", err);
            // 6. Handle specific errors
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone access was denied.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No microphone was found.');
            } else {
                setError('Failed to start recording.');
            }
            setIsRecording(false); // Rollback state on error
        }
    }, []);

    /**
     * @description Stops the audio recording and converts it to a Base64 string.
     * @returns {Promise<string>} A promise that resolves with the PURE Base64-encoded audio string (no prefix).
     */
    // (Refactored) This now returns a Promise<string> (Base64)
    const stopRecording = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                reject(new Error('Recorder is not active or already stopped.'));
                return;
            }

            // 1. Set up 'stop' listener *before* calling stop()
            mediaRecorderRef.current.onstop = () => {
                // 2. Create Blob from chunks
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob); // Update internal state (still useful)

                // 3. Stop media stream tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                setIsRecording(false);
                audioChunksRef.current = []; // Clear chunks

                // 4. (NEW) Convert Blob to Base64
                const reader = new FileReader();

                reader.onloadend = () => {
                    // 5. Resolve the promise with the PURE base64 string
                    // "data:audio/webm;base64,ABC..." -> "ABC..."
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };

                reader.onerror = (error) => {
                    console.error("Error converting blob to Base64:", error);
                    reject(error);
                };

                // 6. Start the conversion
                reader.readAsDataURL(blob);
            };

            // 7. Set up 'error' listener
            mediaRecorderRef.current.onerror = (event) => {
                console.error("MediaRecorder error:", event.error);
                setError("An error occurred during recording.");
                setIsRecording(false);
                reject(event.error);
            };

            // 8. Call stop() to trigger the 'onstop' event
            mediaRecorderRef.current.stop();
        });
    }, []); // Dependencies are empty, all logic uses refs or setters

    // Return the state and control functions
    return {
        isRecording,    // (boolean) Is recording currently active?
        error,          // (string | null) Any error message.
        audioBlob,      // (Blob | null) The most recent completed audio blob (for debugging).
        startRecording, // (function) Call to start recording.
        stopRecording   // (function) Call to stop recording (returns Promise<string>).
    };
};