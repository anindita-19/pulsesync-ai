"""Medical history, symptoms, medications, trends routes."""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel

from app.core.security import get_current_user
from app.database.mongodb import get_database
from app.services.history_service import log_event

router = APIRouter(prefix="/history", tags=["Medical History"])


class SymptomLogRequest(BaseModel):
    symptom: str
    severity: Optional[str] = "mild"
    duration: Optional[str] = None
    notes: Optional[str] = None


class MedicationRequest(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_by: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    active: bool = True
    notes: Optional[str] = None


@router.get("/timeline")
async def get_timeline(
    page: int = 1,
    limit: int = 20,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    query = {"user_id": user_id}
    if type:
        query["type"] = type

    cursor = db.medical_history.find(query).sort("created_at", -1).skip(skip).limit(limit)
    events = []
    async for e in cursor:
        e["_id"] = str(e["_id"])
        events.append(e)

    total = await db.medical_history.count_documents(query)
    return {"events": events, "total": total}


@router.post("/symptoms")
async def log_symptom(
    payload: SymptomLogRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    doc = {
        "user_id": user_id,
        "symptom": payload.symptom,
        "severity": payload.severity,
        "duration": payload.duration,
        "notes": payload.notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.symptoms.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_event(user_id, "symptom", f"Symptom logged: {payload.symptom}", payload.notes, {"severity": payload.severity})
    return doc


@router.get("/symptoms")
async def get_symptoms(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    cursor = db.symptoms.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    symptoms = []
    async for s in cursor:
        s["_id"] = str(s["_id"])
        symptoms.append(s)

    total = await db.symptoms.count_documents({"user_id": user_id})
    return {"symptoms": symptoms, "total": total}


@router.post("/medications")
async def add_medication(
    payload: MedicationRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    doc = {
        "user_id": user_id,
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.medications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_event(user_id, "medication", f"Medication added: {payload.name}", f"{payload.dosage or ''} {payload.frequency or ''}")
    return doc


@router.get("/medications")
async def get_medications(
    page: int = 1,
    limit: int = 20,
    active: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    query = {"user_id": user_id}
    if active is not None:
        query["active"] = active

    cursor = db.medications.find(query).sort("created_at", -1).skip(skip).limit(limit)
    medications = []
    async for m in cursor:
        m["_id"] = str(m["_id"])
        medications.append(m)

    total = await db.medications.count_documents(query)
    return {"medications": medications, "total": total}


@router.get("/trends")
async def get_health_trends(
    period: str = "90d",
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    days = {"30d": 30, "90d": 90, "180d": 180, "1y": 365}.get(period, 90)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    cursor = db.health_metrics.find(
        {"user_id": user_id, "recorded_at": {"$gte": since}}
    ).sort("recorded_at", 1)

    chart_data = []
    async for m in cursor:
        chart_data.append({
            "date": m["recorded_at"].strftime("%b %d"),
            "health_score": m.get("health_score"),
            "bmi": m.get("bmi"),
            "reports": m.get("report_count", 0),
            "symptoms": m.get("symptom_count", 0),
            "ai_sessions": m.get("ai_session_count", 0),
        })

    return {"chart_data": chart_data, "period": period}


@router.get("/risk-analytics")
async def get_risk_analytics(current_user: dict = Depends(get_current_user)):
    """Return risk factors for the user based on profile and history."""
    profile = current_user.get("profile", {})
    risk_factors = []

    diseases = profile.get("existing_diseases", [])
    for d in diseases:
        risk_factors.append({"factor": d, "score": 65, "description": "Known existing condition"})

    lifestyle = profile.get("lifestyle", {})
    if lifestyle.get("smoking_status") and "Regular" in lifestyle["smoking_status"]:
        risk_factors.append({"factor": "Smoking", "score": 80, "description": "Regular smoking increases cardiovascular and respiratory risks."})
    elif lifestyle.get("smoking_status") and "Occasional" in lifestyle["smoking_status"]:
        risk_factors.append({"factor": "Smoking", "score": 45, "description": "Occasional smoking still carries health risks."})

    if lifestyle.get("activity_level") == "Sedentary":
        risk_factors.append({"factor": "Physical Inactivity", "score": 55, "description": "Sedentary lifestyle increases metabolic risk."})

    return {"risk_factors": risk_factors}
