"""
Authentication routes: signup, login, Google OAuth, refresh, logout, me
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import httpx
import logging
from bson import ObjectId

from app.schemas.user_schemas import (
    SignupRequest, LoginRequest, GoogleAuthRequest,
    RefreshTokenRequest, TokenResponse,
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, get_current_user,
)
from app.database.mongodb import get_database
from app.config.settings import settings
from app.services.user_service import serialize_user
from app.services.history_service import log_event

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def _make_token_response(user: dict) -> dict:
    """Build the standard token + user response."""
    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


# ── Signup ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    db = get_database()

    # Check existing email
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "full_name": payload.full_name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "auth_provider": "email",
        "is_active": True,
        "profile_completed": False,
        "profile": {},
        "settings": {
            "notifications": {"ai_recommendations": True, "report_analysis": True, "health_alerts": True, "weekly_summary": True},
            "explanation_level": 1,
            "theme": "light",
        },
        "created_at": __import__("datetime").datetime.now(timezone.utc),
        "updated_at": __import__("datetime").datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Log signup event
    await log_event(str(result.inserted_id), "profile_update", "Account created", "Welcome to PulseSync AI!")

    return _make_token_response(user_doc)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    db = get_database()

    user = await db.users.find_one({"email": payload.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("auth_provider") == "google":
        raise HTTPException(status_code=400, detail="This account uses Google sign-in. Please use Google login.")

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")

    return _make_token_response(user)


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    """Exchange Google authorization code for tokens, create or login user."""
    db = get_database()

    # Exchange code for Google access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": payload.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Google OAuth failed")

        token_data = token_response.json()
        google_access_token = token_data.get("access_token")

        # Get Google user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

        google_user = userinfo_response.json()

    google_id = google_user.get("id")
    email = google_user.get("email", "").lower()
    full_name = google_user.get("name", "")

    # Check if user exists
    user = await db.users.find_one({"$or": [{"google_id": google_id}, {"email": email}]})

    if user:
        # Update google_id if missing
        if not user.get("google_id"):
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"google_id": google_id, "auth_provider": "google"}}
            )
            user["google_id"] = google_id
    else:
        # Create new user
        user_doc = {
            "full_name": full_name,
            "email": email,
            "google_id": google_id,
            "auth_provider": "google",
            "is_active": True,
            "profile_completed": False,
            "profile": {},
            "settings": {
                "notifications": {"ai_recommendations": True, "report_analysis": True, "health_alerts": True, "weekly_summary": True},
                "explanation_level": 1,
            },
            "created_at": __import__("datetime").datetime.now(timezone.utc),
            "updated_at": __import__("datetime").datetime.now(timezone.utc),
        }
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    return _make_token_response(user)


# ── Refresh Token ─────────────────────────────────────────────────────────────

@router.post("/refresh")
async def refresh_token(payload: RefreshTokenRequest):
    db = get_database()
    decoded = decode_token(payload.refresh_token)

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = decoded.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # In production: add token to blacklist in Redis
    return {"message": "Logged out successfully"}


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)
