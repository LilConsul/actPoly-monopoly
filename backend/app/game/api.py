from fastapi import WebSocket, APIRouter, WebSocketDisconnect
import uuid
from app.game.connection_manager import ConnectionManager
from app.user.tokens import decode_token

router = APIRouter(prefix="/ws/game", tags=["game"])
manager = ConnectionManager()


@router.websocket("/{game_uuid}")
async def websocket_endpoint(websocket: WebSocket, game_uuid: uuid.UUID):
    token: str = websocket.cookies.get("access_token")
    if not token or "Bearer" not in token:
        return WebSocketDisconnect(403)

    try:
        payload = decode_token(token.split(" ")[1])
    except Exception:
        return WebSocketDisconnect(403)

    await manager.connect(game_uuid, websocket)
    user_id = int(payload.get("sub"))

    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(game_uuid, f"Client #{user_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(game_uuid, websocket)
        await manager.broadcast(game_uuid, f"Client #{user_id} left the chat")
