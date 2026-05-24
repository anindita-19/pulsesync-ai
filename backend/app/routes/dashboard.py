"""Dashboard data routes."""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from app.core.security import get_current_user
from app.database.mongodb import get_database
from app.services.user_service import calculate_health_score, calculate_bmi

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = str(current_user["_id"])

    health_score = await calculate_health_score(user_id)
    bmi = await calculate_bmi(current_user)

    recent_reports = []
    cursor = db.reports.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    async for r in cursor:
        r["_id"] = str(r["_id"])
        recent_reports.append(r)

    total_reports = await db.reports.count_documents({"user_id": user_id})
    ai_interactions = await db.chat_sessions.count_documents({"user_id": user_id})

    profile = current_user.get("profile", {})
    risk_indicators = _calculate_risk_indicators(profile, bmi)

    return {
        "summary": {
            "health_score": health_score,
            "bmi": bmi,
            "bmi_trend": 0,
            "total_reports": total_reports,
            "ai_interactions": ai_interactions,
        },
        "recent_reports": recent_reports,
        "risk_indicators": risk_indicators,
    }


@router.get("/health-score")
async def get_health_score(current_user: dict = Depends(get_current_user)):
    score = await calculate_health_score(str(current_user["_id"]))
    return {"score": score, "max": 100}


@router.get("/metrics")
async def get_health_metrics(
    period: str = "30d",
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user["_id"])

    days = {"7d": 7, "30d": 30, "90d": 90, "180d": 180, "1y": 365}.get(period, 30)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    cursor = db.health_metrics.find(
        {"user_id": user_id, "recorded_at": {"$gte": since}}
    ).sort("recorded_at", 1)

    chart_data = []
    async for m in cursor:
        chart_data.append({
            "date": m["recorded_at"].strftime("%b %d"),
            "score": m.get("health_score", 0),
            "bmi": m.get("bmi"),
        })

    return {"chart_data": chart_data, "period": period}


@router.get("/recommendations")
async def get_ai_recommendations(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = str(current_user["_id"])

    cursor = db.ai_recommendations.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    recommendations = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        recommendations.append(r)

    return {"recommendations": recommendations}


@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user["_id"])

    cursor = db.medical_history.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    activities = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        activities.append(a)

    return {"activities": activities}


@router.get("/risk-indicators")
async def get_risk_indicators(current_user: dict = Depends(get_current_user)):
    profile = current_user.get("profile", {})
    bmi = await calculate_bmi(current_user)
    indicators = _calculate_risk_indicators(profile, bmi)
    return {"risk_indicators": indicators}


def _calculate_risk_indicators(profile: dict, bmi: float | None) -> list:
    indicators = []

    if bmi:
        if bmi < 18.5:
            indicators.append({"label": "BMI", "level": "medium", "value": bmi})
        elif 18.5 <= bmi <= 24.9:
            indicators.append({"label": "BMI", "level": "low", "value": bmi})
        elif 25 <= bmi <= 29.9:
            indicators.append({"label": "BMI", "level": "medium", "value": bmi})
        else:
            indicators.append({"label": "BMI", "level": "high", "value": bmi})

    lifestyle = profile.get("lifestyle", {})
    smoking = lifestyle.get("smoking_status", "")
    if "Regular" in smoking or "Occasional" in smoking:
        indicators.append({"label": "Smoking", "level": "high" if "Regular" in smoking else "medium"})
    elif smoking:
        indicators.append({"label": "Smoking", "level": "low"})

    diseases = profile.get("existing_diseases", [])
    high_risk_conditions = ["diabetes", "hypertension", "heart disease", "cancer"]
    for disease in diseases:
        if any(c in disease.lower() for c in high_risk_conditions):
            indicators.append({"label": disease, "level": "high"})

    if not indicators:
        indicators.append({"label": "Overall Health", "level": "low"})

    return indicators