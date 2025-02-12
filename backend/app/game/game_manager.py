import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import WebSocket, WebSocketException
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
import random
from .connection_manager import ConnectionManager
from ..database.models import Tile, Property, User


class GameManager(ConnectionManager):
    def __init__(self):
        super().__init__()
        self.active_games: Dict[uuid.UUID, Dict[str, Any]] = {}

    async def first_init_game(self, game: uuid.UUID, session: AsyncSession):
        self.active_games[game] = {"tiles": [], "users": {}, "game_data": {}, "status": "waiting"}
        query = select(Tile).options(
            joinedload(Tile.property).joinedload(Property.group),
            joinedload(Tile.railway),
            joinedload(Tile.company),
            joinedload(Tile.special),
        )
        result = await session.execute(query)
        tiles = result.scalars().all()
        self.active_games[game]["tiles"] = jsonable_encoder(tiles)
        # TODO: Add cart data

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
        # TODO: fix if user is already in game but reconnects
        if game in self.active_games and (
                self.active_games[game]["status"] == "started" or len(self.active_games[game]["users"]) == 4):
            raise WebSocketException(code=403)

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

    async def disconnect(self, game: uuid.UUID, websocket: WebSocket, user_id: int):
        await self.broadcast_except_sender(
            game,
            self.create_data(f"{self.active_games[game]["users"][user_id]} disconnected"),
            websocket
        )
        if self.active_games[game]["status"] != "started":
            del self.active_games[game]["users"][user_id]
        super()._disconnect(game, websocket)

    async def start_game(self, game: uuid.UUID, websocket: WebSocket):
        if len(self.active_games[game]["users"]) < 2:
            await self.send_personal_message(
                self.create_data("Need at least 2 players to start the game"),
                websocket
            )
            return
        self.active_games[game]["status"] = "started"
        # TODO: Add logic for starting the game (player order, etc.)
        await self.broadcast(game, self.create_data("Game started"))

    async def roll_dice(self, game: uuid.UUID, websocket: WebSocket, user_id: int):
        # TODO: Add logic for checking if it's user's turn
        if self.active_games[game]["status"] != "started":
            await self.send_personal_message(
                self.create_data("Game not started yet"),
                websocket
            )
            return
        dice1 = random.randint(1, 6)
        dice2 = random.randint(1, 6)
        # TODO: Add logic for checking if user is in jail
        # TODO: Add separating for sending dice roll message
        await self.broadcast(
            game,
            self.create_data(f"{self.active_games[game]['users'][user_id]} rolled {dice1} {dice2}")
        )
        # TODO: Add logic for moving the user position

    async def process_game_message(self, game: uuid.UUID, websocket: WebSocket, data: dict, user_id: int):
        content = data["content"]
        match content:
            case "start":
                await self.start_game(game, websocket)
            case "roll":
                await self.roll_dice(game, websocket, user_id)

    async def process_chat_message(self, game: uuid.UUID, websocket: WebSocket, data: dict, user_id: int):
        pass

    async def process_message(self, game: uuid.UUID, websocket: WebSocket, data: dict, user_id: int):
        if data["type"] == "game":
            await self.process_game_message(game, websocket, data, user_id)
        elif data["type"] == "chat":
            await self.process_chat_message(game, websocket, data, user_id)
