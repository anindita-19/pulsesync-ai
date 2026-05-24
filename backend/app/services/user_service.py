"""User service utilities."""
from datetime import datetime
from bson import ObjectId
from app.database.mongodb import get_database


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to API response format."""
    return {
        "id": str(user["_id"]),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "auth_provider": user.get("auth_provider", "email"),
        "profile_completed": user.get("profile_completed", False),
        "profile": user.get("profile", {}),
        "settings": user.get("settings", {}),
        "created_at": user.get("created_at"),
    }


async def calculate_bmi(user: dict) -> float | None:
    """Calculate BMI from user profile."""
    profile = user.get("profile", {})
    height = profile.get("height")
    weight = profile.get("weight")
    if height and weight and height > 0:
        return round(weight / ((height / 100) ** 2), 1)
    return None


async def calculate_health_score(user_id: str) -> int:
    """
    Calculate a dynamic health score (0-100) based on:
    - Profile completeness
    - BMI range
    - Number of reports
    - Recent AI interactions
    - Risk factors

    This is a placeholder — replace with ML model output when available.
    """
    db = await get_database()
    oid = ObjectId(user_id)

    score = 60  # base score

    user = await db.users.find_one({"_id": oid})
    if not user:
        return score

    profile = user.get("profile", {})
    fields = ["age", "gender", "height", "weight", "blood_group"]
    filled = sum(1 for f in fields if profile.get(f))
    score += filled * 3  # up to +15

    bmi = await calculate_bmi(user)
    if bmi and 18.5 <= bmi <= 24.9:
        score += 10
    elif bmi and 25 <= bmi <= 29.9:
        score += 5

    report_count = await db.reports.count_documents({"user_id": user_id})
    score += min(report_count * 2, 10)

    return max(0, min(100, score))