"""
PulseSync AI — Redis Client
Async Redis connection with connection pooling and health checks.
"""

import os
import logging
import asyncio
from typing import Optional

import redis.asyncio as aioredis
from redis.asyncio import Redis, ConnectionPool

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)


class RedisClient:
    """
    Manages the async Redis connection pool.
    Provides a single shared client instance with automatic reconnection.
    """

    def __init__(self):
        self._pool: Optional[ConnectionPool] = None
        self._client: Optional[Redis] = None

    async def connect(self) -> None:
        """Initialize Redis connection pool."""
        try:
            self._pool = aioredis.ConnectionPool.from_url(
                REDIS_URL,
                password=REDIS_PASSWORD,
                max_connections=20,
                decode_responses=True,
            )
            self._client = aioredis.Redis(connection_pool=self._pool)
            # Test the connection
            await self._client.ping()
            logger.info("[Redis] Connected successfully.")
        except Exception as e:
            logger.warning(f"[Redis] Connection failed: {e}. Redis features will be disabled.")
            self._client = None

    async def disconnect(self) -> None:
        """Close Redis connections gracefully."""
        if self._client:
            await self._client.aclose()
            logger.info("[Redis] Disconnected.")

    @property
    def client(self) -> Optional[Redis]:
        return self._client

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    async def get(self, key: str) -> Optional[str]:
        if not self._client:
            return None
        try:
            return await self._client.get(key)
        except Exception as e:
            logger.warning(f"[Redis] GET failed for key={key}: {e}")
            return None

    async def set(self, key: str, value: str, ttl: int = None) -> bool:
        if not self._client:
            return False
        try:
            if ttl:
                await self._client.setex(key, ttl, value)
            else:
                await self._client.set(key, value)
            return True
        except Exception as e:
            logger.warning(f"[Redis] SET failed for key={key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        if not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"[Redis] DELETE failed for key={key}: {e}")
            return False

    async def publish(self, channel: str, message: str) -> int:
        """Publish to a Pub/Sub channel. Returns subscriber count."""
        if not self._client:
            return 0
        try:
            return await self._client.publish(channel, message)
        except Exception as e:
            logger.warning(f"[Redis] PUBLISH failed on channel={channel}: {e}")
            return 0

    async def get_pubsub(self):
        """Return a new Pub/Sub instance for subscribing to channels."""
        if not self._client:
            return None
        return self._client.pubsub()


# Global singleton
redis_client = RedisClient()
