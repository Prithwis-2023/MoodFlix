import React from 'react';


const JETSON_IP = "172.19.27.2";

const API_URL = `http://${JETSON_IP}:8000/inference`;

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