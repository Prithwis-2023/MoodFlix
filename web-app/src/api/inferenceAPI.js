import React from 'react';


const JETSON_IP = "172.19.8.143";

const API_URL = `http://${JETSON_IP}:8000/inference`;
const LOG_API_URL = `http://${JETSON_IP}:8000/inference/log`;

export async function sendInferenceRequest(payload) {
    console.log("Sending request to AI server...", API_URL);

    console.log("=== [DEBUG] Final Payload Sent to Server ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("================================================");

    try {
        const startTime = Date.now();

        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const endTime = Date.now();
        console.log(`Server responded in ${(endTime - startTime) / 1000}s`);

        if (!response.ok) {
           
            const errorBody = await response.json().catch(() => response.text());
            console.error(`Server error (${response.status}):`, errorBody);
            throw new Error(`Server returned ${response.status}`);
        }

        // 200 OK 응답
        const result = await response.json();
        console.log("Inference successful:", result);
        return result;

    } catch (error) {
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error("Fetch failed. Is the server running? Is CORS configured? Is the IP correct?");
        } else {
            console.error("Error sending inference request:", error);
        }
        return null; 
    }
}

export async function sendInferenceLog({clientSentAt,env,movieTitle,mood,tone}) {

    console.log("Sending inference log to server...", LOG_API_URL);
    const logPayload = {
        clientSentAt,
        env,
        movieTitle,
        mood,
        tone,
    };
    console.log("=== [DEBUG] Log Payload Sent to Server ===");
    console.log(JSON.stringify(logPayload, null, 2));
    console.log("==========================================");

    try {
        const response = await fetch(LOG_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(logPayload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => response.text());
            console.error(`Log server error (${response.status}):`, errorBody);
            throw new Error(`Log server returned ${response.status}`);
        }

        const result = await response.json().catch(() => null);
        console.log("Log saved successfully:", result);
        return result;

    } catch (error) {
        console.error("Error sending inference log:", error);
        return null;
    }
}

export async function fetchInferenceLogs(limit = 50) {
    console.log("Fetching inference logs from server...", LOG_API_URL);

    try {
        const response = await fetch(`${LOG_API_URL}?limit=${limit}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => response.text());
            console.error(`Log fetch error (${response.status}):`, errorBody);
            throw new Error(`Log fetch returned ${response.status}`);
        }

        const logs = await response.json();
        console.log("Logs fetched:", logs);
        return logs;

    } catch (error) {
        console.error("Error fetching inference logs:", error);
        return null;
    }
}

 