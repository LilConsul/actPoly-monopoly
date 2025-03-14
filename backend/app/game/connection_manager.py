import uuid
from typing import List, Dict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Dictionary mapping room names to a list of WebSocket connections.
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def _connect(self, game: uuid.UUID, websocket: WebSocket):
        """Accept a new WebSocket connection and add it to the specified room."""
        await websocket.accept()
        if game not in self.active_connections:
            self.active_connections[game] = []
        self.active_connections[game].append(websocket)

    def _disconnect(self, game: uuid.UUID, websocket: WebSocket):
        """Remove a WebSocket connection from a room."""
        if game in self.active_connections:
            self.active_connections[game].remove(websocket)
            # Optionally, remove the room if empty
            if not self.active_connections[game]:
                del self.active_connections[game]

    async def send_personal_message(self, data, websocket: WebSocket):
        """Send a message to a single WebSocket connection."""
        await websocket.send_json(data)

    async def broadcast(self, game: uuid.UUID, data):
        """Broadcast a message to all connections in a room."""
        if game in self.active_connections:
            for connection in self.active_connections[game]:
                await connection.send_json(data)

    async def broadcast_except_sender(self, game: uuid.UUID, data, sender: WebSocket):
        """Broadcast a message to all connections in a room except the sender."""
        if game in self.active_connections:
            for connection in self.active_connections[game]:
                if connection != sender:
                    await connection.send_json(data)
