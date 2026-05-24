"""
PulseSync AI — Socket Events
Handles incoming WebSocket message routing and dispatching.
"""

import json
import logging
import uuid

from app.agents.memory_agent import memory_agent
from app.services.agent_event_service import agent_event_service

logger = logging.getLogger(__name__)


class SocketEventHandler:
    """
    Routes incoming WebSocket messages to the appropriate handlers.
    Acts as the server-side dispatcher for the WebSocket protocol
    defined in SYSTEM_ARCHITECTURE.md.
    """

    async def handle_message(
        self,
        raw_message: str,
        user_id: str,
        session_id: str,
        orchestrator,
    ) -> dict | None:
        """
        Parse and route an incoming WebSocket message.

        Expected message shape:
        {
            "type": "chat_message",
            "payload": {
                "session_id": "string",
                "content": "string",
                "explanation_level": 1,
                "message_id": "string"
            }
        }

        Returns the orchestrator pipeline result dict, or None for non-chat events.
        """
        try:
            message = json.loads(raw_message)
        except json.JSONDecodeError:
            logger.warning(f"[SocketEvents] Malformed message from user {user_id}")
            return None

        msg_type = message.get("type", "")
        payload = message.get("payload", {})

        if msg_type == "chat_message":
            return await self._handle_chat_message(payload, user_id, session_id, orchestrator)

        elif msg_type == "ping":
            # Keepalive — client wants to confirm connection
            return {"type": "pong", "payload": {"status": "alive"}}

        else:
            logger.debug(f"[SocketEvents] Unhandled message type: {msg_type}")
            return None

    async def _handle_chat_message(
        self,
        payload: dict,
        user_id: str,
        session_id: str,
        orchestrator,
    ) -> dict | None:
        """Handle incoming chat messages from the user."""
        content = payload.get("content", "").strip()
        explanation_level = int(payload.get("explanation_level", 1))
        message_id = payload.get("message_id", str(uuid.uuid4()))

        if not content:
            logger.warning(f"[SocketEvents] Empty chat message from user {user_id}")
            return None

        # Save user message to MongoDB
        await memory_agent.save_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=content,
            message_id=message_id,
            explanation_level=explanation_level,
        )

        # Run the full agent pipeline
        try:
            result = await orchestrator.run(
                user_message=content,
                user_id=user_id,
                session_id=session_id,
                explanation_level=explanation_level,
            )
            return result
        except Exception as e:
            logger.error(f"[SocketEvents] Orchestrator error: {e}")
            await agent_event_service.publish_chat_error(
                session_id=session_id,
                message="Something went wrong during health analysis. Please try again.",
            )
            return None


socket_event_handler = SocketEventHandler()
