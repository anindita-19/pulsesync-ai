"""
PulseSync AI — MongoDB Connection
Async MongoDB client using Motor driver.
"""

import os
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "pulsesync_ai")

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongodb() -> None:
    """Initialize MongoDB connection."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Verify connection
        await _client.admin.command("ping")
        _db = _client[MONGODB_DB_NAME]
        logger.info(f"[MongoDB] Connected to database: {MONGODB_DB_NAME}")
        await _create_indexes()
    except Exception as e:
        logger.error(f"[MongoDB] Connection failed: {e}")
        raise


async def disconnect_from_mongodb() -> None:
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        logger.info("[MongoDB] Disconnected.")


async def get_db() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if _db is None:
        raise RuntimeError("MongoDB not connected. Call connect_to_mongodb() first.")
    return _db


async def _create_indexes() -> None:
    """Create all required collection indexes for performance."""
    try:
        db = _db

        # users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("google_id", sparse=True)

        # reports
        await db.reports.create_index("user_id")
        await db.reports.create_index([("user_id", 1), ("created_at", -1)])

        # chat_sessions
        await db.chat_sessions.create_index("user_id")
        await db.chat_sessions.create_index([("user_id", 1), ("created_at", -1)])

        # chat_messages
        await db.chat_messages.create_index("session_id")
        await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])

        # medical_history
        await db.medical_history.create_index("user_id")
        await db.medical_history.create_index([("user_id", 1), ("created_at", -1)])

        # notifications
        await db.notifications.create_index("user_id")
        await db.notifications.create_index([("user_id", 1), ("read", 1)])

        # ai_recommendations
        await db.ai_recommendations.create_index("user_id")
        await db.ai_recommendations.create_index([("user_id", 1), ("created_at", -1)])

        logger.info("[MongoDB] Indexes created successfully.")
    except Exception as e:
        logger.warning(f"[MongoDB] Index creation warning: {e}")
