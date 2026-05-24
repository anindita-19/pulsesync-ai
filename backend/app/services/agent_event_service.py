"""
PulseSync AI — Agent Event Service
Publishes real-time agent status events to Redis Pub/Sub.
These events are consumed by the WebSocket manager and forwarded to the frontend.
"""

import json
import logging
from datetime import datetime, timezone

from app.redis.pubsub_manager import pubsub_manager

logger = logging.getLogger(__name__)


class AgentEventService:
    """
    Publishes agent lifecycle events to Redis channels.
    The frontend's Agent Activity Panel listens for these via WebSocket.

    Redis channel: agent_activity:{session_id}
    """

    async def publish_agent_event(
        self,
        session_id: str,
        agent_id: str,
        agent_name: str,
        status: str,   # idle | active | processing | complete | error
        message: str,
    ) -> None:
        """
        Publish an agent status event.

        Event shape (matches SYSTEM_ARCHITECTURE.md WebSocket contract):
        {
            "type": "agent_activity",
            "payload": {
                "agent_id": "symptom",
                "status": "active",
                "message": "Symptom Specialist is analyzing...",
                "session_id": "abc123"
            }
        }
        """
        event = {
            "type": "agent_activity",
            "payload": {
                "agent_id": agent_id,
                "agent_name": agent_name,
                "status": status,
                "message": message,
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        }
        channel = f"agent_activity:{session_id}"
        await pubsub_manager.publish(channel, json.dumps(event))

    async def publish_chat_token(
        self,
        session_id: str,
        message_id: str,
        token: str,
    ) -> None:
        """
        Publish a streaming token for real-time response rendering.
        Used when streaming LLM output word-by-word to the frontend.
        """
        event = {
            "type": "chat_token",
            "payload": {
                "message_id": message_id,
                "token": token,
                "session_id": session_id,
            },
        }
        channel = f"chat_events:{session_id}"
        await pubsub_manager.publish(channel, json.dumps(event))

    async def publish_chat_complete(
        self,
        session_id: str,
        message_id: str,
        full_content: str,
        confidence: float = 0.0,
        suggestions: list = None,
    ) -> None:
        """
        Publish the chat completion event with the full assembled response.
        """
        event = {
            "type": "chat_complete",
            "payload": {
                "message_id": message_id,
                "full_content": full_content,
                "confidence": confidence,
                "suggestions": suggestions or [],
                "session_id": session_id,
            },
        }
        channel = f"chat_events:{session_id}"
        await pubsub_manager.publish(channel, json.dumps(event))

    async def publish_chat_error(
        self,
        session_id: str,
        message: str,
    ) -> None:
        """Publish an error event to the chat channel."""
        event = {
            "type": "chat_error",
            "payload": {
                "message": message,
                "session_id": session_id,
            },
        }
        channel = f"chat_events:{session_id}"
        await pubsub_manager.publish(channel, json.dumps(event))

    async def publish_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "ai_recommendation",
    ) -> None:
        """Push a user notification (appears as toast in the frontend)."""
        event = {
            "type": "notification",
            "payload": {
                "title": title,
                "message": message,
                "type": notification_type,
            },
        }
        channel = f"notifications:{user_id}"
        await pubsub_manager.publish(channel, json.dumps(event))


# Singleton
agent_event_service = AgentEventService()
