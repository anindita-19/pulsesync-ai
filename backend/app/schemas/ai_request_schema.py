"""
PulseSync AI — AI Request Schema
Pydantic models for incoming AI chat requests.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, validator


class UserLocation(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class AIChatRequest(BaseModel):
    """
    POST /ai/chat — Main AI query request body.
    """
    message: str = Field(..., min_length=1, max_length=2000, description="The user's health query")
    session_id: Optional[str] = Field(None, description="Existing session ID (omit to create new)")
    explanation_level: int = Field(1, ge=1, le=3, description="1=Basic, 2=Simple, 3=Detailed")
    location: Optional[UserLocation] = Field(None, description="User's current location for hospital search")

    # Optional report context
    report_content: Optional[str] = Field(None, description="Extracted text from an uploaded report")
    report_type: Optional[str] = Field(None, description="Type of uploaded report (Blood Test, X-Ray, etc.)")

    @validator("message")
    def message_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Message cannot be empty.")
        return v.strip()


class ReportAnalysisRequest(BaseModel):
    """POST /reports/{id}/analyze — Trigger AI analysis of an uploaded report."""
    report_id: str
    report_content: str = Field(..., min_length=10)
    report_type: str = Field(default="Medical Report")
    explanation_level: int = Field(1, ge=1, le=3)
