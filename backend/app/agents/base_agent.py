"""
PulseSync AI — Base Agent
Abstract base class for all healthcare agents.
"""

import logging
import json
from abc import ABC, abstractmethod
from typing import Optional

from app.ai.groq_client import groq_client
from app.utils.json_parser import safe_parse_json
from app.services.agent_event_service import agent_event_service

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class that every PulseSync agent extends.

    Handles:
    - Standard Groq completion flow
    - JSON response parsing with fallback
    - Redis event publishing for live UI updates
    - Consistent error handling
    """

    # Override in each subclass
    agent_id: str = "base"
    agent_name: str = "Base Agent"
    default_temperature: float = 0.3

    async def run(
        self,
        user_message: str,
        context: dict,
        session_id: str,
        explanation_level: int = 1,
    ) -> dict:
        """
        Main entry point for every agent.

        1. Publishes "processing" event to Redis (→ WebSocket → UI)
        2. Builds system + user prompt
        3. Calls Groq API
        4. Parses JSON response
        5. Updates shared context
        6. Publishes "complete" event

        Returns:
            Parsed dict from the agent's JSON response, or an error dict.
        """
        await self._publish_event(session_id, "active", f"{self.agent_name} is analyzing...")

        try:
            system_prompt = self.get_system_prompt()
            user_prompt = self.build_user_prompt(user_message, context, explanation_level)

            raw_response = await groq_client.complete_json(
                system_prompt=system_prompt,
                user_message=user_prompt,
                temperature=self.default_temperature,
            )

            result = safe_parse_json(raw_response)

            if result is None:
                logger.warning(f"[{self.agent_name}] Failed to parse JSON response. Raw: {raw_response[:200]}")
                result = self.fallback_response()

            # Update shared context with this agent's output
            self.update_context(context, result)

            await self._publish_event(session_id, "complete", f"{self.agent_name} finished.")
            logger.info(f"[{self.agent_name}] Completed successfully.")
            return result

        except Exception as e:
            logger.error(f"[{self.agent_name}] Error: {e}")
            await self._publish_event(session_id, "error", f"{self.agent_name} encountered an issue.")
            return self.fallback_response()

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the agent's system prompt string."""
        ...

    @abstractmethod
    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        """Build the user-side prompt from message + context."""
        ...

    @abstractmethod
    def update_context(self, context: dict, result: dict) -> None:
        """Write this agent's result back into shared context."""
        ...

    def fallback_response(self) -> dict:
        """
        Default response when the agent fails. Subclasses can override
        to provide more specific fallbacks.
        """
        return {
            "error": True,
            "message": f"{self.agent_name} was unable to process your request. Please try again.",
            "confidence": 0,
        }

    async def _publish_event(self, session_id: str, status: str, message: str) -> None:
        """Publish an agent activity event to Redis Pub/Sub."""
        try:
            await agent_event_service.publish_agent_event(
                session_id=session_id,
                agent_id=self.agent_id,
                agent_name=self.agent_name,
                status=status,
                message=message,
            )
        except Exception as e:
            # Never let event publishing break the agent pipeline
            logger.warning(f"[{self.agent_name}] Event publish failed (non-fatal): {e}")
