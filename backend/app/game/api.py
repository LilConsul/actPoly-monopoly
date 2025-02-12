from datetime import datetime, timezone
from fastapi import WebSocket, APIRouter, WebSocketDisconnect, Depends
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import db_helper
from app.database.models import Tile, Property
from app.game.game_manager import GameManager
from app.user.tokens import decode_token

router = APIRouter(prefix="/ws/game", tags=["game"])
manager = GameManager()


@router.get("/")
async def get(session: AsyncSession = Depends(db_helper.session_dependency)):
    query = select(Tile).options(
        joinedload(Tile.property).joinedload(Property.group),
        joinedload(Tile.railway),
        joinedload(Tile.company),
        joinedload(Tile.special),
    )
    result = await session.execute(query)
    tiles = result.scalars().all()
    return tiles


@router.websocket("/{game_uuid}")
async def websocket_endpoint(
        websocket: WebSocket,
        game_uuid: uuid.UUID,
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    token: str = websocket.cookies.get("access_token")
    if not token or "Bearer" not in token:
        return WebSocketDisconnect(403)

    try:
        payload = decode_token(token.split(" ")[1])
    except Exception:
        return WebSocketDisconnect(403)

    user_id = int(payload.get("sub"))
    await manager.connect(game_uuid, websocket, user_id, session)

    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(game_uuid,
                                    {"message": f"Client #{user_id} says: {data['content']}", "type": "game",
                                     "timestamp": round(datetime.now(timezone.utc).timestamp())})
    except WebSocketDisconnect:
        manager.disconnect(game_uuid, websocket)
        await manager.broadcast(game_uuid, {"message": f"Client #{user_id} left the chat", "type": "game",
                                            "timestamp": round(datetime.now(timezone.utc).timestamp())})
