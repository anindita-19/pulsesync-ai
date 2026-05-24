"""
Pydantic schemas for request/response validation.
Users, auth, profiles.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    code: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ── Profile ───────────────────────────────────────────────────────────────────

class EmergencyContact(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relation: Optional[str] = None


class Lifestyle(BaseModel):
    activity_level: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    diet_type: Optional[str] = None
    sleep_hours: Optional[str] = None


class HealthProfile(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = None
    height: Optional[float] = Field(None, ge=50, le=300)  # cm
    weight: Optional[float] = Field(None, ge=1, le=500)   # kg
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    existing_diseases: Optional[List[str]] = []
    emergency_contact: Optional[EmergencyContact] = None
    lifestyle: Optional[Lifestyle] = None


class CompleteProfileRequest(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    existing_diseases: Optional[List[str]] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    activity_level: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    diet_type: Optional[str] = None
    sleep_hours: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    profile: Optional[HealthProfile] = None


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    profile_completed: bool
    created_at: Optional[datetime] = None
    profile: Optional[HealthProfile] = None


# ── Settings ──────────────────────────────────────────────────────────────────

class NotificationSettings(BaseModel):
    ai_recommendations: bool = True
    report_analysis: bool = True
    health_alerts: bool = True
    weekly_summary: bool = True


class UserSettingsRequest(BaseModel):
    notifications: Optional[NotificationSettings] = None
    theme: Optional[str] = "light"
    explanation_level: Optional[int] = Field(1, ge=1, le=3)
