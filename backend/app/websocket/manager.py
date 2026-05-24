"""
WebSocket Connection Manager
Tracks active WebSocket connections per user/session.
"""
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        # user_id -> list of websockets
        self._connections: Dict[str, List[WebSocket]] = {}
        # websocket -> (user_id, session_id)
        self._meta: Dict[WebSocket, tuple] = {}

    async def connect(self, websocket: WebSocket, user_id: str, session_id: Optional[str] = None):
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)
        self._meta[websocket] = (user_id, session_id)
        logger.info(f"[WS] Connected: user={user_id} session={session_id}")

    async def disconnect(self, websocket: WebSocket):
        meta = self._meta.pop(websocket, None)
        if meta:
            user_id, session_id = meta
            conns = self._connections.get(user_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(user_id, None)
            logger.info(f"[WS] Disconnected: user={user_id} session={session_id}")

    async def send_to_user(self, user_id: str, data: dict):
        """Send a JSON message to all connections for a user."""
        for ws in self._connections.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.warning(f"[WS] Failed to send to user {user_id}: {e}")

    async def send_to_session(self, session_id: str, data: dict):
        """Send a JSON message to all connections matching a session."""
        for ws, (uid, sid) in list(self._meta.items()):
            if sid == session_id:
                try:
                    await ws.send_json(data)
                except Exception as e:
                    logger.warning(f"[WS] Failed to send to session {session_id}: {e}")

    async def broadcast(self, data: dict):
        """Send a JSON message to all connected clients."""
        for ws in list(self._meta.keys()):
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.warning(f"[WS] Broadcast failed: {e}")

    @property
    def active_connections_count(self) -> int:
        return len(self._meta)


# Singleton instance
ws_manager = WebSocketManager()