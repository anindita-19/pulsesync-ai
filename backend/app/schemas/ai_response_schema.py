"""
PulseSync AI — AI Response Schema
Pydantic models for structured API responses from the AI pipeline.
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class HealthcareAnalysis(BaseModel):
    possible_condition: str = ""
    confidence: float = 0.0
    severity: str = "Unknown"
    recommended_specialist: str = "General Practitioner"
    simple_explanation: str = ""
    key_points: List[str] = []
    immediate_actions: List[str] = []
    what_to_tell_doctor: str = ""
    requires_emergency_care: bool = False
    disclaimer: str = "This is an AI-generated health insight, not a medical diagnosis. Always consult a qualified healthcare professional."


class NutritionGuidance(BaseModel):
    recommended_foods: List[dict] = []
    foods_to_avoid: List[dict] = []
    hydration_advice: str = ""
    lifestyle_tips: List[str] = []


class MedicationPrecaution(BaseModel):
    medications_reviewed: List[str] = []
    interactions: List[dict] = []
    precautions: List[dict] = []
    overall_risk_level: str = "Unknown"
    pharmacist_consultation_recommended: bool = True


class TravelInfo(BaseModel):
    distance: str = ""
    duration: str = ""
    maps_url: str = ""


class NearbyHospital(BaseModel):
    name: str
    address: str
    rating: float = 0.0
    place_id: str = ""
    open_now: Optional[bool] = None
    maps_url: str = ""
    travel_info: TravelInfo = Field(default_factory=TravelInfo)


class AIChatResponse(BaseModel):
    """
    Final structured response from POST /ai/chat.
    Matches the FINAL API RESPONSE FORMAT in the architecture spec.
    """
    session_id: str
    message_id: str = ""

    healthcare_analysis: HealthcareAnalysis = Field(default_factory=HealthcareAnalysis)
    symptom_analysis: dict = {}
    medical_analysis: dict = {}
    report_analysis: dict = {}
    nutrition_guidance: NutritionGuidance = Field(default_factory=NutritionGuidance)
    medication_precautions: MedicationPrecaution = Field(default_factory=MedicationPrecaution)

    nearby_hospitals: List[NearbyHospital] = []
    routes: List[dict] = []
    travel_information: dict = {}

    # Meta
    confidence: float = 0.0
    severity: str = "Low"
    recommended_specialist: str = "General Practitioner"
    explanation_level: int = 1
    processing_time_ms: Optional[int] = None
