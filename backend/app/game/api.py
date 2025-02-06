from fastapi import WebSocket, APIRouter, WebSocketDisconnect
import uuid
from app.game.connection_manager import ConnectionManager

router = APIRouter(prefix="/ws/game", tags=["game"])
manager = ConnectionManager()


@router.websocket("/{game_uuid}")
async def websocket_endpoint(websocket: WebSocket, game_uuid: uuid.UUID):
    await manager.connect(game_uuid, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(game_uuid, f"Client #{websocket.user} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(game_uuid, websocket)
        await manager.broadcast(game_uuid, f"Client #{game_uuid} left the chat")
