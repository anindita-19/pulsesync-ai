"""
PulseSync AI — Memory Agent
Stores conversations, health history, and prepares personalization context.
Not an LLM agent — a data persistence layer.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from app.database.mongodb import get_db

logger = logging.getLogger(__name__)


class MemoryAgent:
    """
    Handles all persistence for the AI chat ecosystem:
    - Save chat messages (user + assistant)
    - Save session context snapshots
    - Save AI recommendations
    - Log medical history events
    - Retrieve conversation history for context injection
    """

    async def save_message(
        self,
        session_id: str,
        user_id: str,
        role: str,           # "user" | "assistant"
        content: str,
        message_id: str,
        explanation_level: int = 1,
        confidence: Optional[float] = None,
        severity_level: Optional[str] = None,
        agent_used: Optional[str] = None,
    ) -> bool:
        """Persist a single chat message to MongoDB."""
        try:
            db = await get_db()
            doc = {
                "session_id": session_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "message_id": message_id,
                "explanation_level": explanation_level,
                "confidence": confidence,
                "severity_level": severity_level,
                "agent_used": agent_used,
                "sources": [],
                "created_at": datetime.now(timezone.utc),
            }
            await db.chat_messages.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to save message: {e}")
            return False

    async def get_conversation_history(
        self,
        session_id: str,
        limit: int = 10,
    ) -> list[dict]:
        """
        Retrieve recent conversation history for context injection.
        Returns list of {role, content} dicts for LLM consumption.
        """
        try:
            db = await get_db()
            cursor = db.chat_messages.find(
                {"session_id": session_id},
                {"role": 1, "content": 1, "_id": 0},
            ).sort("created_at", 1).limit(limit)

            messages = []
            async for doc in cursor:
                messages.append({"role": doc["role"], "content": doc["content"]})
            return messages
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to get history: {e}")
            return []

    async def save_session_context(self, session_id: str, user_id: str, context: dict) -> bool:
        """Upsert the session context snapshot (for session continuity)."""
        try:
            db = await get_db()
            await db.chat_sessions.update_one(
                {"_id": session_id},
                {
                    "$set": {
                        "context": context,
                        "updated_at": datetime.now(timezone.utc),
                    },
                    "$inc": {"message_count": 1},
                },
                upsert=True,
            )
            return True
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to save session context: {e}")
            return False

    async def log_health_event(
        self,
        user_id: str,
        event_type: str,
        title: str,
        description: str = "",
        metadata: dict = None,
    ) -> bool:
        """Log an event to the medical_history collection for the health timeline."""
        try:
            db = await get_db()
            await db.medical_history.insert_one({
                "user_id": user_id,
                "type": event_type,
                "title": title,
                "description": description,
                "metadata": metadata or {},
                "created_at": datetime.now(timezone.utc),
            })
            return True
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to log health event: {e}")
            return False

    async def save_ai_recommendation(
        self,
        user_id: str,
        recommendation: dict,
        session_id: str,
    ) -> bool:
        """Persist an AI recommendation to the ai_recommendations collection."""
        try:
            db = await get_db()
            severity = recommendation.get("severity", "Low").lower()
            priority = "high" if severity in ["high", "critical"] else ("medium" if severity == "moderate" else "low")

            await db.ai_recommendations.insert_one({
                "user_id": user_id,
                "title": f"AI Health Insight — {recommendation.get('possible_condition', 'General')}",
                "description": recommendation.get("simple_explanation", ""),
                "priority": priority,
                "category": "checkup",
                "source_session_id": session_id,
                "expires_at": None,
                "created_at": datetime.now(timezone.utc),
            })
            return True
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to save recommendation: {e}")
            return False

    async def get_user_health_profile(self, user_id: str) -> dict:
        """Fetch user's full health profile for agent context injection."""
        try:
            db = await get_db()
            user = await db.users.find_one(
                {"_id": user_id},
                {"profile": 1, "full_name": 1, "_id": 0},
            )
            return user.get("profile", {}) if user else {}
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to fetch user profile: {e}")
            return {}

    async def get_recent_reports(self, user_id: str, limit: int = 5) -> list[dict]:
        """Fetch recent report metadata for agent context."""
        try:
            db = await get_db()
            cursor = db.reports.find(
                {"user_id": user_id},
                {"report_type": 1, "report_date": 1, "analysis_status": 1, "_id": 1},
            ).sort("created_at", -1).limit(limit)

            reports = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                reports.append(doc)
            return reports
        except Exception as e:
            logger.error(f"[MemoryAgent] Failed to fetch reports: {e}")
            return []


# Singleton instance
memory_agent = MemoryAgent()
