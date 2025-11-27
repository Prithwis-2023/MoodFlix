from http.server import BaseHTTPRequestHandler, HTTPServer
import asyncio
import json
import os
import time
import socket
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate
from aiengine import train_on_user_data, ollama_inference, combined_recommendations
from collections import deque



HOST = "0.0.0.0"
PORT = 8000

clf_tuple = train_on_user_data("user_logs.csv")

pcs = set()        
ws_to_pc = {}      
pc_context = {}  

async def signaling(request:web.Request)-> web.WebSocketResponse:
    
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    pc = RTCPeerConnection()
    pcs.add(pc)
    ws_to_pc[ws] = pc
    pc_context[pc] = {
        "video_tracks": [],
        "audio_tracks": [],
        "frames": deque(maxlen=20),
        "audio_chunks": deque(maxlen=150),
        
    }

    print("🔗 New WebSocket connection, PeerConnection created")
    
    @pc.on("track")
    def on_track(track):
        print(f"🎥 Track received: kind={track.kind}")
        
        #video track
        if track.kind == "video":
            pc_context[pc]["video_tracks"].append(track)
            
            async def recv_video():
                while True:
                    try:
                        frame = await track.recv()  # aiortc VideoFrame
                        img = frame.to_ndarray(format="bgr24")  # numpy array (H,W,3)
                        pc_context[pc]["frames"].append(img)
                    except Exception as e:
                        print("❌ video track error:", e)
                        break

            asyncio.create_task(recv_video())
        # audio track
        elif track.kind == "audio":
            pc_context[pc]["audio_tracks"].append(track)

            async def recv_audio():
                while True:
                    try:
                        audio_frame = await track.recv()  # AudioFrame
                        pcm = audio_frame.to_ndarray()    # shape: (channels, samples)
                        pc_context[pc]["audio_chunks"].append(pcm)
                    except Exception as e:
                        print("❌ audio track error:", e)
                        break

            asyncio.create_task(recv_audio())
        

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except Exception as e:
                    print("❌ JSON parse error:", e)
                    await ws.send_json({"error": "invalid json"})
                    continue

                # 1) offer reception → create answer
                if "offer" in data:
                    offer_dict = data["offer"]
                    print("📨 Received offer from client")

                    try:
                        offer = RTCSessionDescription(
                            sdp=offer_dict["sdp"],
                            type=offer_dict["type"],
                        )
                        await pc.setRemoteDescription(offer)

                        answer = await pc.createAnswer()
                        await pc.setLocalDescription(answer)

                        answer_payload = {
                            "answer": {
                                "sdp": pc.localDescription.sdp,
                                "type": pc.localDescription.type,
                            }
                        }
                        await ws.send_json(answer_payload)
                        print("📤 Sent answer to client")
                    except Exception as e:
                        print("❌ Error handling offer:", e)
                        await ws.send_json({"error": f"offer error: {e}"})

                # 2) ICE candidate reception
                elif "ice" in data:
                    ice_dict = data["ice"]
                    print("📨 Received ICE from client")

                    try:
                        candidate = RTCIceCandidate(
                            sdpMid=ice_dict.get("sdpMid"),
                            sdpMLineIndex=ice_dict.get("sdpMLineIndex"),
                            candidate=ice_dict.get("candidate"),
                        )
                        await pc.addIceCandidate(candidate)
                        print("✅ Added remote ICE")
                    except Exception as e:
                        print("❌ Error adding ICE candidate:", e)
                        await ws.send_json({"error": f"ice error: {e}"})

                # 3) inference requset 
                elif data.get("action") == "infer_once":
                    environment = data.get("environment", {})
                    print("🧠 infer_once requested. env:", environment)

                    ctx = pc_context.get(pc, {})
                    frames = list(ctx.get("frames", []))           # [np.ndarray, ...]
                    audio_chunks = list(ctx.get("audio_chunks", []))  # [np.ndarray, ...]

                    print(f"   📸 frames collected: {len(frames)}")
                    print(f"   🎧 audio chunks collected: {len(audio_chunks)}")

                    try:
                        # TODO: aiengine 이받는형식 여기서 고려
                        model_input = {
                            "environment": environment,
                            "images": frames,        # numpy arraylist
                            "audio": audio_chunks,   # numpy arraylist
                        }

                        primary_movies = ollama_inference(model_input)
                        final_movies = combined_recommendations(
                            primary_movies, clf_tuple, model_input
                        )
                        
                        top5 = final_movies[:5]

                        await ws.send_json({
                            "inference_result":top5
                        })
                        print("📤 Sent inference_result to client:", top5)

                    except Exception as e:
                        err_msg = f"inference error: {e}"
                        print("❌", err_msg)
                        await ws.send_json({"error": err_msg})

                else:
                    print("❓ Unknown message:", data)
                    await ws.send_json({"error": "unknown message"})

            else:
                # BINARY / CLOSE 
                pass

    except Exception as e:
        print("❌ WebSocket error:", e)


    finally:
        print("🔌 WebSocket disconnected, cleaning up PeerConnection")
        if pc in pcs:
            pcs.discard(pc)
        if ws in ws_to_pc:
            del ws_to_pc[ws]
        if pc in pc_context:
            del pc_context[pc]

        await pc.close()
        await ws.close()

    return ws


async def on_shutdown(app: web.Application):
    print("🛑 Shutting down, closing all PeerConnections...")
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros, return_exceptions=True)
    pcs.clear()


def create_app():
    app = web.Application()
    app.router.add_get("/signaling", signaling)
    app.on_shutdown.append(on_shutdown)
    return app



def main():
    app = create_app()
    print(f"🚀 WebRTC signaling server running at ws://{HOST}:{PORT}/signaling")
    web.run_app(app, host=HOST, port=PORT)

if __name__ == "__main__":
    main()
