import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null); // for debugging

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('startRecording error:', err);
            setError('cant start recording, check audio authority');
            setIsRecording(false);
            
            throw err;
        }
    }, []);

    const stopRecording = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                if (!mediaRecorderRef.current) {
                    throw new Error('MediaRecorder is not initialized');
                }

                const mediaRecorder = mediaRecorderRef.current;

                if (mediaRecorder.state !== 'recording') {
                    throw new Error(`Recorder state is "${mediaRecorder.state}", not "recording"`);
                }

                mediaRecorder.onstop = async () => {
                    try {
                        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        setAudioBlob(blob);

                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const dataUrl = reader.result; // "data:audio/webm;base64,..."
                            const base64 = dataUrl.split(',')[1];
                            resolve(base64);
                        };
                        reader.onerror = (e) => {
                            console.error('FileReader error:', e);
                            reject(new Error('failed audio to base64'));
                        };
                        reader.readAsDataURL(blob);
                    } catch (err) {
                        reject(err);
                    } finally {
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach((t) => t.stop());
                            streamRef.current = null;
                        }
                        mediaRecorderRef.current = null;
                        audioChunksRef.current = [];
                        setIsRecording(false);
                    }
                };

                mediaRecorder.stop();
            } catch (err) {
                console.error('stopRecording error:', err);
                setError(err.message);
                setIsRecording(false);
                reject(err);
            }
        });
    }, []); 

    
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    return {
        isRecording,
        error,
        audioBlob,
        startRecording,
        stopRecording,
    };
};