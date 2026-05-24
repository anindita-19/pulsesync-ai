"""Schemas for medical reports."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ReportResponse(BaseModel):
    id: str
    user_id: str
    file_url: str
    public_id: str
    file_name: str
    file_type: str
    file_size: Optional[int] = None
    report_type: str
    report_date: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    notes: Optional[str] = None
    analysis_status: str = "pending"
    created_at: datetime


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    limit: int


class ReportTimelineResponse(BaseModel):
    timeline: List[dict]
