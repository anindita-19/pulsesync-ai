"""
WebSocket Connection Manager
Handles multiple WebSocket connections, broadcasting, and Redis Pub/Sub relay.
"""
import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket
from app.redis.manager import redis_manager

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per user and session."""

    def __init__(self):
        # user_id -> Set[WebSocket]
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # session_id -> Set[WebSocket]
        self.session_connections: Dict[str, Set[WebSocket]] = {}
        # WebSocket -> {user_id, session_id}
        self.connection_meta: Dict[WebSocket, dict] = {}
        # active pubsub listeners
        self._pubsub_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: str, session_id: str = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()

        # Register by user
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        # Register by session
        if session_id:
            if session_id not in self.session_connections:
                self.session_connections[session_id] = set()
            self.session_connections[session_id].add(websocket)

        self.connection_meta[websocket] = {"user_id": user_id, "session_id": session_id}

        # Start Redis pub/sub listener for this session
        if session_id and session_id not in self._pubsub_tasks:
            task = asyncio.create_task(
                self._listen_redis_session(session_id)
            )
            self._pubsub_tasks[session_id] = task

        # Start user-level listener
        user_key = f"user_listener:{user_id}"
        if user_key not in self._pubsub_tasks:
            task = asyncio.create_task(
                self._listen_redis_user(user_id)
            )
            self._pubsub_tasks[user_key] = task

        logger.info(f"WebSocket connected: user={user_id}, session={session_id}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        meta = self.connection_meta.pop(websocket, {})
        user_id = meta.get("user_id")
        session_id = meta.get("session_id")

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                # Cancel user listener if no more connections
                user_key = f"user_listener:{user_id}"
                if user_key in self._pubsub_tasks:
                    self._pubsub_tasks[user_key].cancel()
                    del self._pubsub_tasks[user_key]

        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
                # Cancel session listener
                if session_id in self._pubsub_tasks:
                    self._pubsub_tasks[session_id].cancel()
                    del self._pubsub_tasks[session_id]

        logger.info(f"WebSocket disconnected: user={user_id}")

    async def send_to_session(self, session_id: str, message: dict):
        """Broadcast a message to all WebSockets in a session."""
        connections = self.session_connections.get(session_id, set()).copy()
        dead = set()
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            await self.disconnect(ws)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a user."""
        connections = self.user_connections.get(user_id, set()).copy()
        dead = set()
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            await self.disconnect(ws)

    async def _listen_redis_session(self, session_id: str):
        """Relay Redis Pub/Sub messages to WebSocket clients for a session."""
        channels = [
            f"agent_activity:{session_id}",
            f"chat_events:{session_id}",
        ]
        try:
            ps = await redis_manager.subscribe(*channels)
            async for message in ps.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        event_type = data.get("type", "event")
                        payload = {k: v for k, v in data.items() if k != "type"}
                        await self.send_to_session(session_id, {
                            "type": event_type,
                            "payload": payload,
                        })
                    except Exception as e:
                        logger.error(f"Redis relay error (session {session_id}): {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Session pubsub listener error: {e}")

    async def _listen_redis_user(self, user_id: str):
        """Relay Redis Pub/Sub messages to a user's WebSocket connections."""
        channels = [f"notifications:{user_id}", f"health_updates:{user_id}"]
        try:
            ps = await redis_manager.subscribe(*channels)
            async for message in ps.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await self.send_to_user(user_id, data)
                    except Exception as e:
                        logger.error(f"Redis relay error (user {user_id}): {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"User pubsub listener error: {e}")


# Singleton
ws_manager = ConnectionManager()
