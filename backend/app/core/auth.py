"""
PulseSync AI — Auth Core
JWT token verification helpers used by route dependencies.
"""

import os
import logging
from typing import Optional
from datetime import datetime, timezone

from jose import jwt, JWTError

logger = logging.getLogger(__name__)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


async def get_current_user_id(token: str) -> Optional[str]:
    """
    Decode a JWT access token and return the user_id (sub claim).
    Returns None if invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        token_type = payload.get("type", "")
        if token_type != "access":
            logger.warning("[Auth] Non-access token used in get_current_user_id")
            return None
        user_id: str = payload.get("sub")
        return user_id
    except JWTError as e:
        logger.warning(f"[Auth] JWT decode failed: {e}")
        return None


async def verify_token(token: str) -> Optional[str]:
    """
    Alias for get_current_user_id — used by WebSocket endpoint
    where we can't use FastAPI's Depends() injection.
    """
    return await get_current_user_id(token)
