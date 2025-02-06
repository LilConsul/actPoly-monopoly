import uuid
from typing import List, Dict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Dictionary mapping room names to a list of WebSocket connections.
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, game: uuid.UUID, websocket: WebSocket):
        """Accept a new WebSocket connection and add it to the specified room."""
        await websocket.accept()
        if game not in self.active_connections:
            self.active_connections[game] = []
        self.active_connections[game].append(websocket)

    def disconnect(self, game: uuid.UUID, websocket: WebSocket):
        """Remove a WebSocket connection from a room."""
        if game in self.active_connections:
            self.active_connections[game].remove(websocket)
            # Optionally, remove the room if empty
            if not self.active_connections[game]:
                del self.active_connections[game]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a single WebSocket connection."""
        await websocket.send_text(message)

    async def broadcast(self, game: uuid.UUID, message: str):
        """Broadcast a message to all connections in a room."""
        if game in self.active_connections:
            for connection in self.active_connections[game]:
                await connection.send_text(message)

