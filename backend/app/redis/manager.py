"""
Redis connection and Pub/Sub manager.
Used for real-time agent activity broadcasting via WebSocket.
"""
import redis.asyncio as aioredis
import json
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

# ─── Channel names ────────────────────────────────────────────────────────────
CHANNEL_AGENT_ACTIVITY = "agent_activity"
CHANNEL_CHAT_EVENTS = "chat_events:{session_id}"
CHANNEL_NOTIFICATIONS = "notifications:{user_id}"
CHANNEL_HEALTH_UPDATES = "health_updates:{user_id}"


class RedisManager:
    """Manages Redis connections and Pub/Sub."""

    def __init__(self):
        self.redis: aioredis.Redis = None
        self.pubsub = None

    async def connect(self):
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD or None,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
            )
            await self.redis.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            raise

    async def disconnect(self):
        if self.redis:
            await self.redis.aclose()
            logger.info("Redis connection closed")

    # ── Publish ──────────────────────────────────────────────────────────────
    async def publish(self, channel: str, data: dict):
        """Publish a JSON message to a Redis channel."""
        try:
            await self.redis.publish(channel, json.dumps(data))
        except Exception as e:
            logger.error(f"Redis publish error on {channel}: {e}")

    async def publish_agent_event(self, session_id: str, agent_id: str, status: str, message: str):
        """Publish agent activity event."""
        channel = f"agent_activity:{session_id}"
        await self.publish(channel, {
            "type": "agent_activity",
            "agent_id": agent_id,
            "status": status,
            "message": message,
            "session_id": session_id,
        })

    async def publish_chat_token(self, session_id: str, message_id: str, token: str):
        """Publish a streaming chat token."""
        channel = f"chat_events:{session_id}"
        await self.publish(channel, {
            "type": "chat_token",
            "message_id": message_id,
            "token": token,
            "session_id": session_id,
        })

    async def publish_chat_complete(self, session_id: str, message_id: str, full_content: str, confidence: float = None, suggestions: list = None):
        """Publish chat completion event."""
        channel = f"chat_events:{session_id}"
        await self.publish(channel, {
            "type": "chat_complete",
            "message_id": message_id,
            "full_content": full_content,
            "confidence": confidence,
            "suggestions": suggestions or [],
            "session_id": session_id,
        })

    async def publish_notification(self, user_id: str, notification: dict):
        """Publish a user notification."""
        channel = f"notifications:{user_id}"
        await self.publish(channel, {
            "type": "notification",
            "payload": notification,
        })

    # ── Cache helpers ────────────────────────────────────────────────────────
    async def set(self, key: str, value, expire: int = 3600):
        """Set a cached value with optional TTL (seconds)."""
        try:
            data = json.dumps(value) if not isinstance(value, str) else value
            await self.redis.set(key, data, ex=expire)
        except Exception as e:
            logger.error(f"Redis SET error: {e}")

    async def get(self, key: str):
        """Get a cached value."""
        try:
            value = await self.redis.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
        return None

    async def delete(self, key: str):
        """Delete a cached key."""
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self.redis.exists(key))
        except Exception:
            return False

    # ── Subscribe ────────────────────────────────────────────────────────────
    async def subscribe(self, *channels):
        """Return a pubsub object subscribed to the given channels."""
        ps = self.redis.pubsub()
        await ps.subscribe(*channels)
        return ps


# Singleton instance
redis_manager = RedisManager()
