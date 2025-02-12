import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi.websockets import WebSocketDisconnect

from .connection_manager import ConnectionManager
from ..database.models import Tile, Property, User


class GameManager(ConnectionManager):
    def __init__(self):
        super().__init__()
        self.active_games: Dict[uuid.UUID, Dict[str, Any]] = {}

    async def first_init_game(self, game: uuid.UUID, session: AsyncSession):
        self.active_games[game] = {"tiles": [], "users": {}, "game_data": {}, "status": str}
        query = select(Tile).options(
            joinedload(Tile.property).joinedload(Property.group),
            joinedload(Tile.railway),
            joinedload(Tile.company),
            joinedload(Tile.special),
        )
        result = await session.execute(query)
        tiles = result.scalars().all()
        self.active_games[game]["tiles"] = jsonable_encoder(tiles)

    async def get_username(self, game: uuid.UUID, user_id: int, session: AsyncSession):
        username = await User.find_username_by_id(session, user_id)
        self.active_games[game]["users"][user_id] = username

    def create_data(self, data):
        return {
            "content": data,
            "type": "game",
            "timestamp": round(datetime.now(timezone.utc).timestamp())
        }

    async def connect(self, game: uuid.UUID, websocket: WebSocket, user_id: int, session: AsyncSession):
        if game in self.active_games and (
                self.active_games[game]["status"] == "started" or len(self.active_games[game]["users"]) == 4):
            return WebSocketDisconnect(403)

        await super()._connect(game, websocket)
        if game not in self.active_games:
            await self.first_init_game(game, session)

        await self.send_personal_message(
            self.create_data(self.active_games[game]["tiles"]),
            websocket
        )

        if user_id not in self.active_games[game]["users"]:  # If user firstly connect
            await self.get_username(game, user_id, session)
            await self.broadcast_except_sender(
                game,
                self.create_data(f"{self.active_games[game]["users"][user_id]} joined"),
                websocket
            )
