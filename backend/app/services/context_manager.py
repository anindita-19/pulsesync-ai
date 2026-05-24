"""
PulseSync AI — Context Manager
Builds and maintains the shared context dict that all agents read/write.
"""

import logging
from typing import Optional

from app.agents.memory_agent import memory_agent

logger = logging.getLogger(__name__)


class ContextManager:
    """
    Responsible for creating the initial shared context before the agent pipeline starts.
    Pulls user profile, recent reports, and session history from MongoDB/Redis.
    """

    async def build_initial_context(
        self,
        user_id: str,
        session_id: str,
        explanation_level: int = 1,
    ) -> dict:
        """
        Build the initial shared context dict.
        Fetches:
        - User's full health profile
        - Recent medical reports (metadata only)
        - Recent conversation history

        Returns the context dict that all agents will share and mutate.
        """
        try:
            # Fetch user profile
            user_profile = await memory_agent.get_user_health_profile(user_id)

            # Fetch recent reports
            recent_reports = await memory_agent.get_recent_reports(user_id, limit=5)

            # Fetch conversation history for multi-turn context
            conversation_history = await memory_agent.get_conversation_history(
                session_id=session_id,
                limit=8,
            )

            context = {
                # Identity
                "user_id": user_id,
                "session_id": session_id,
                "explanation_level": explanation_level,

                # User health profile (read by all agents)
                "user_profile": user_profile,

                # Agent output slots (filled progressively by each agent)
                "symptoms": "",
                "medical_history": "",
                "reports": "",
                "medications": "",
                "nutrition": "",
                "recommendation": "",

                # Quick-access fields set by agents
                "severity": "",
                "final_severity": "Low",
                "final_confidence": 0,
                "symptom_confidence": 0,
                "medication_risk": "Low",
                "report_severity": "Unknown",
                "risk_summary": "",
                "recommended_specialist": "General Practitioner",

                # Rich context for agents
                "recent_reports": recent_reports,
                "conversation_history": conversation_history,

                # Location (populated by API request)
                "location": {},
            }

            logger.debug(f"[ContextManager] Built context for user={user_id}, session={session_id}")
            return context

        except Exception as e:
            logger.error(f"[ContextManager] Failed to build context: {e}")
            # Return minimal viable context on failure
            return self._empty_context(user_id, session_id, explanation_level)

    def _empty_context(self, user_id: str, session_id: str, explanation_level: int) -> dict:
        """Minimal context fallback when data fetching fails."""
        return {
            "user_id": user_id,
            "session_id": session_id,
            "explanation_level": explanation_level,
            "user_profile": {},
            "symptoms": "",
            "medical_history": "",
            "reports": "",
            "medications": "",
            "nutrition": "",
            "recommendation": "",
            "severity": "",
            "final_severity": "Low",
            "final_confidence": 0,
            "symptom_confidence": 0,
            "medication_risk": "Low",
            "report_severity": "Unknown",
            "risk_summary": "",
            "recommended_specialist": "General Practitioner",
            "recent_reports": [],
            "conversation_history": [],
            "location": {},
        }
