import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from webrtc_server import create_app

@pytest.mark.asyncio
async def test_signaling_infer_without_media(aiohttp_client):
    # 1) 테스트용 서버/클라이언트 생성
    app = create_app()
    client: TestClient = await aiohttp_client(app)

    # 2) WebSocket 연결
    ws = await client.ws_connect("/signaling")

    # 3) 가짜 offer 보냄 (실제 WebRTC는 아니지만, 서버 JSON/분기 테스트용)
    fake_offer = {
        "offer": {
            "sdp": "v=0\r\n...",   # 그냥 더미 스트링
            "type": "offer"
        }
    }
    await ws.send_json(fake_offer)

    # 4) 서버가 뭔가 답을 줘야 함 (answer or error)
    msg = await ws.receive_json()
    assert "answer" in msg or "error" in msg

    # 5) infer_once 요청 보내보기 (env만 넣고, frames/audio는 빈 상태)
    await ws.send_json({
        "action": "infer_once",
        "environment": {"temp": 24, "noise": 0.1}
    })

    msg2 = await ws.receive_json()
    # inference_result 또는 error 둘 중 하나는 와야 정상
    assert "inference_result" in msg2 or "error" in msg2