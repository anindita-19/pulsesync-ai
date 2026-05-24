"""Nearby hospitals and specialist recommendations routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import httpx
import logging

from app.core.security import get_current_user
from app.database.mongodb import get_database
from app.config.settings import settings

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])
logger = logging.getLogger(__name__)

PLACES_BASE = "https://maps.googleapis.com/maps/api/place"


def _format_hospital(place: dict, user_lat: float = None, user_lng: float = None) -> dict:
    """Normalize Google Places result to our API contract."""
    location = place.get("geometry", {}).get("location", {})
    phone = place.get("formatted_phone_number", "")
    return {
        "place_id": place.get("place_id"),
        "name": place.get("name"),
        "address": place.get("vicinity") or place.get("formatted_address"),
        "phone": phone,
        "rating": place.get("rating"),
        "open_now": place.get("opening_hours", {}).get("open_now"),
        "type": _infer_type(place.get("types", [])),
        "specialists": [],
        "lat": location.get("lat"),
        "lng": location.get("lng"),
        "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}",
    }


def _infer_type(types: list) -> str:
    if "hospital" in types:
        return "Hospital"
    if "doctor" in types:
        return "Clinic"
    if "pharmacy" in types:
        return "Pharmacy"
    return "Healthcare"


async def _places_nearby(lat: float, lng: float, type_kw: str, radius: int = 10000) -> list:
    """Call Google Places Nearby Search."""
    if not settings.GOOGLE_PLACES_API_KEY:
        return []

    url = f"{PLACES_BASE}/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": type_kw,
        "key": settings.GOOGLE_PLACES_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            logger.error(f"Places API error: {resp.text}")
            return []
        data = resp.json()
        return data.get("results", [])


async def _places_text_search(query: str, lat: float = None, lng: float = None) -> list:
    """Call Google Places Text Search."""
    if not settings.GOOGLE_PLACES_API_KEY:
        return []

    url = f"{PLACES_BASE}/textsearch/json"
    params = {"query": f"{query} hospital clinic", "key": settings.GOOGLE_PLACES_API_KEY}
    if lat and lng:
        params["location"] = f"{lat},{lng}"
        params["radius"] = 20000

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return []
        return resp.json().get("results", [])


@router.get("/nearby")
async def get_nearby_hospitals(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(10, ge=1, le=50),
    type: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    type_kw = type or "hospital"
    raw = await _places_nearby(lat, lng, type_kw, radius * 1000)

    hospitals = [_format_hospital(p, lat, lng) for p in raw]
    start = (page - 1) * limit
    return {"hospitals": hospitals[start:start + limit], "total": len(hospitals)}


@router.get("/search")
async def search_hospitals(
    query: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    raw = await _places_text_search(query, lat, lng)
    hospitals = [_format_hospital(p) for p in raw]
    start = (page - 1) * limit
    return {"hospitals": hospitals[start:start + limit], "total": len(hospitals)}


@router.get("/emergency")
async def get_emergency_hospitals(
    lat: float = Query(...),
    lng: float = Query(...),
    current_user: dict = Depends(get_current_user),
):
    raw = await _places_nearby(lat, lng, "hospital", 5000)
    hospitals = [_format_hospital(p, lat, lng) for p in raw[:5]]
    return {"hospitals": hospitals}


@router.get("/specialist-recommendations")
async def get_specialist_recommendations(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    current_user: dict = Depends(get_current_user),
):
    """Return specialist recommendations based on user's health profile."""
    profile = current_user.get("profile", {})
    diseases = profile.get("existing_diseases", [])
    recommendations = []

    disease_specialist_map = {
        "diabetes": ("Endocrinologist", "Monitor blood sugar and manage insulin"),
        "hypertension": ("Cardiologist", "Regular blood pressure monitoring recommended"),
        "heart disease": ("Cardiologist", "Cardiac evaluation and monitoring required"),
        "asthma": ("Pulmonologist", "Lung function tests and inhaler management"),
        "depression": ("Psychiatrist", "Mental health evaluation and therapy"),
        "arthritis": ("Orthopedic", "Joint care and physical therapy"),
        "vision": ("Ophthalmologist", "Annual eye exam recommended"),
    }

    for disease in diseases:
        for key, (specialty, reason) in disease_specialist_map.items():
            if key in disease.lower():
                recommendations.append({
                    "specialty": specialty,
                    "reason": reason,
                    "urgency": "soon",
                    "based_on": disease,
                })

    # Always recommend GP
    if not recommendations:
        recommendations.append({
            "specialty": "General Practitioner",
            "reason": "Annual health check-up recommended",
            "urgency": "routine",
        })

    return {"recommendations": recommendations}


@router.get("/{hospital_id}")
async def get_hospital(
    hospital_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get detailed info for a specific hospital by place_id."""
    if not settings.GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=503, detail="Google Places API not configured")

    url = f"{PLACES_BASE}/details/json"
    params = {
        "place_id": hospital_id,
        "fields": "name,formatted_address,formatted_phone_number,opening_hours,rating,geometry,website,types",
        "key": settings.GOOGLE_PLACES_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Hospital not found")
        data = resp.json()
        if data.get("status") != "OK":
            raise HTTPException(status_code=404, detail="Hospital not found")

        return _format_hospital(data.get("result", {}))
