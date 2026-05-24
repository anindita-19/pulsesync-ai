"""User profile and settings routes."""
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.core.security import get_current_user
from app.database.mongodb import get_database
from app.schemas.user_schemas import CompleteProfileRequest, UpdateProfileRequest, UserSettingsRequest
from app.services.user_service import serialize_user, calculate_health_score, calculate_bmi
from app.services.history_service import log_event

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)


@router.post("/profile/complete")
async def complete_profile(
    payload: CompleteProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user["_id"])

    profile = {
        "age": payload.age,
        "gender": payload.gender,
        "height": payload.height,
        "weight": payload.weight,
        "blood_group": payload.blood_group,
        "allergies": payload.allergies or [],
        "existing_diseases": payload.existing_diseases or [],
        "emergency_contact": {
            "name": payload.emergency_contact_name,
            "phone": payload.emergency_contact_phone,
            "relation": payload.emergency_contact_relation,
        },
        "lifestyle": {
            "activity_level": payload.activity_level,
            "smoking_status": payload.smoking_status,
            "alcohol_consumption": payload.alcohol_consumption,
            "diet_type": payload.diet_type,
            "sleep_hours": payload.sleep_hours,
        },
    }

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "profile": profile,
                "profile_completed": True,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    await log_event(user_id, "profile_update", "Profile completed", "Health profile is now complete.")

    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)


@router.put("/profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    update_fields = {"updated_at": datetime.now(timezone.utc)}

    if payload.full_name:
        update_fields["full_name"] = payload.full_name

    if payload.profile:
        profile_data = payload.profile.model_dump(exclude_none=True)
        for k, v in profile_data.items():
            update_fields[f"profile.{k}"] = v

    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_fields})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)


@router.get("/profile/completion")
async def get_profile_completion(current_user: dict = Depends(get_current_user)):
    profile = current_user.get("profile", {})
    fields = {
        "basic": ["age", "gender", "height", "weight"],
        "medical": ["blood_group"],
        "emergency": ["emergency_contact"],
        "lifestyle": ["lifestyle"],
    }

    completed_groups = 0
    total_groups = len(fields)

    for group, group_fields in fields.items():
        group_complete = all(
            profile.get(f) or (isinstance(profile.get(f), dict) and any(profile[f].values()))
            for f in group_fields
        )
        if group_complete:
            completed_groups += 1

    pct = round((completed_groups / total_groups) * 100)
    return {"completion_percentage": pct, "profile_completed": current_user.get("profile_completed", False)}


@router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    return current_user.get("settings", {})


@router.put("/settings")
async def update_settings(
    payload: UserSettingsRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    update_data = payload.model_dump(exclude_none=True)
    set_fields = {f"settings.{k}": v for k, v in update_data.items()}
    set_fields["updated_at"] = datetime.now(timezone.utc)

    await db.users.update_one({"_id": current_user["_id"]}, {"$set": set_fields})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return updated.get("settings", {})


@router.get("/notifications")
async def get_notifications(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    notifications = []
    async for n in cursor:
        n["_id"] = str(n["_id"])
        notifications.append(n)

    total = await db.notifications.count_documents({"user_id": user_id})
    unread = await db.notifications.count_documents({"user_id": user_id, "read": False})

    return {"notifications": notifications, "total": total, "unread_count": unread}


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user["_id"])
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True}},
    )
    return {"success": True}


@router.patch("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = str(current_user["_id"])
    await db.notifications.update_many({"user_id": user_id}, {"$set": {"read": True}})
    return {"success": True}