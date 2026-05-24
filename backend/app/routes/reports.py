"""Medical reports routes."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.core.security import get_current_user
from app.database.mongodb import get_database
from app.integrations.cloudinary_service import upload_report, delete_report
from app.services.history_service import log_event
from app.config.settings import settings

router = APIRouter(prefix="/reports", tags=["Medical Reports"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]


def serialize_report(r: dict) -> dict:
    r["id"] = str(r.pop("_id"))
    return r


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_medical_report(
    file: UploadFile = File(...),
    report_type: str = Form(...),
    report_date: str = Form(...),
    notes: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    hospital_name: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Read file content
    content = await file.read()

    # Size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")

    # Upload to Cloudinary
    upload_result = await upload_report(
        file_content=content,
        file_name=file.filename,
        file_type=file.content_type,
        user_id=user_id,
    )

    # Save to MongoDB
    doc = {
        "user_id": user_id,
        "file_url": upload_result["file_url"],
        "public_id": upload_result["public_id"],
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_size": upload_result.get("file_size"),
        "report_type": report_type,
        "report_date": report_date,
        "notes": notes,
        "doctor_name": doctor_name,
        "hospital_name": hospital_name,
        "analysis_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.reports.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Log to history
    await log_event(
        user_id,
        "report_upload",
        f"Uploaded {report_type}",
        f"Report from {report_date}" + (f" by Dr. {doctor_name}" if doctor_name else ""),
        {"report_id": str(result.inserted_id), "report_type": report_type},
    )

    return serialize_report(doc)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("")
async def get_reports(
    page: int = 1,
    limit: int = 10,
    type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    query = {"user_id": user_id}
    if type:
        query["report_type"] = type
    if search:
        query["$or"] = [
            {"report_type": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}},
            {"doctor_name": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.reports.find(query).sort("created_at", -1).skip(skip).limit(limit)
    reports = []
    async for r in cursor:
        reports.append(serialize_report(r))

    total = await db.reports.count_documents(query)
    return {"reports": reports, "total": total, "page": page, "limit": limit}


# ── Get single ────────────────────────────────────────────────────────────────

@router.get("/timeline")
async def get_report_timeline(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    cursor = db.reports.find({"user_id": user_id}).sort("report_date", 1)
    timeline = []
    async for r in cursor:
        timeline.append({
            "id": str(r["_id"]),
            "report_type": r.get("report_type"),
            "report_date": r.get("report_date"),
            "doctor_name": r.get("doctor_name"),
            "analysis_status": r.get("analysis_status"),
        })
    return {"timeline": timeline}


@router.get("/{report_id}")
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    report = await db.reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return serialize_report(report)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{report_id}")
async def delete_report_route(report_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    report = await db.reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Delete from Cloudinary
    try:
        resource_type = "raw" if report.get("file_type") == "application/pdf" else "image"
        await delete_report(report["public_id"], resource_type)
    except Exception:
        pass  # Continue even if Cloudinary delete fails

    await db.reports.delete_one({"_id": ObjectId(report_id)})
    return {"success": True, "message": "Report deleted"}


# ── Analysis placeholder ──────────────────────────────────────────────────────

@router.post("/{report_id}/analyze")
async def request_analysis(report_id: str, current_user: dict = Depends(get_current_user)):
    """Request AI analysis for a report. LangGraph pipeline to be integrated here."""
    db = get_database()
    user_id = str(current_user["_id"])

    report = await db.reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Mark as processing
    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"analysis_status": "processing", "updated_at": datetime.now(timezone.utc)}},
    )

    # TODO: Trigger LangGraph pipeline via Celery/background task
    # For now: return accepted status
    return {"status": "processing", "message": "Analysis queued"}


@router.get("/{report_id}/analysis")
async def get_report_analysis(report_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    analysis = await db.report_analysis.find_one({"report_id": report_id, "user_id": user_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not available yet")

    analysis["id"] = str(analysis.pop("_id"))
    return analysis
