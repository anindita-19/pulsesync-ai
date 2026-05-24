"""
PulseSync AI — Hospital Service
Uses Google Places API to find nearby hospitals, clinics, and emergency centers.
No LLM reasoning involved — pure backend geo-service layer.
"""

import os
import logging
import asyncio
from typing import Optional

import httpx

from app.services.maps_service import maps_service

logger = logging.getLogger(__name__)

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"

# Specialist → search keyword mapping
SPECIALIST_KEYWORD_MAP = {
    "cardiologist": "cardiology hospital",
    "neurologist": "neurology hospital",
    "orthopedic": "orthopedic hospital",
    "dermatologist": "dermatology clinic",
    "gastroenterologist": "gastroenterology hospital",
    "pulmonologist": "pulmonology respiratory hospital",
    "endocrinologist": "endocrinology diabetes hospital",
    "psychiatrist": "psychiatry mental health hospital",
    "gynecologist": "gynecology women hospital",
    "urologist": "urology hospital",
    "ophthalmologist": "eye hospital ophthalmology",
    "ent": "ent ear nose throat hospital",
    "pediatrician": "pediatric children hospital",
    "general practitioner": "hospital clinic",
    "oncologist": "cancer hospital oncology",
    "rheumatologist": "rheumatology arthritis hospital",
    "nephrologist": "nephrology kidney hospital",
}


class HospitalService:
    """
    Finds nearby healthcare facilities using Google Places API.
    Accepts a specialist type from the Recommendation Agent
    and returns relevant nearby facilities with distance/travel info.
    """

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=10.0)

    async def find_nearby_hospitals(
        self,
        lat: float,
        lng: float,
        specialist: str = "General Practitioner",
        radius: int = 5000,  # meters
    ) -> list[dict]:
        """
        Find nearby hospitals filtered by specialist type.

        Args:
            lat/lng: User's location.
            specialist: Specialist type from Recommendation Agent.
            radius: Search radius in meters (default 5km).

        Returns:
            List of hospital dicts with name, address, rating, travel info.
        """
        if not GOOGLE_PLACES_API_KEY:
            return self._mock_hospitals(specialist)

        keyword = self._get_search_keyword(specialist)

        try:
            params = {
                "location": f"{lat},{lng}",
                "radius": radius,
                "type": "hospital",
                "keyword": keyword,
                "key": GOOGLE_PLACES_API_KEY,
            }
            response = await self._client.get(PLACES_NEARBY_URL, params=params)
            data = response.json()

            if data.get("status") not in ("OK", "ZERO_RESULTS"):
                logger.warning(f"[Hospital] Places API status: {data.get('status')}")
                return self._mock_hospitals(specialist)

            hospitals = self._parse_places(data.get("results", []))

            # Enrich with travel info from Maps Service
            hospitals = await maps_service.get_directions_for_hospitals(lat, lng, hospitals)

            return hospitals

        except httpx.TimeoutException:
            logger.error("[Hospital] Places API timed out.")
            return []
        except Exception as e:
            logger.error(f"[Hospital] Error fetching hospitals: {e}")
            return []

    async def find_emergency_hospitals(self, lat: float, lng: float) -> list[dict]:
        """Find the nearest emergency/A&E hospitals."""
        if not GOOGLE_PLACES_API_KEY:
            return self._mock_hospitals("Emergency")

        try:
            params = {
                "location": f"{lat},{lng}",
                "radius": 10000,  # 10km for emergencies
                "type": "hospital",
                "keyword": "emergency hospital",
                "key": GOOGLE_PLACES_API_KEY,
                "rankby": "prominence",
            }
            response = await self._client.get(PLACES_NEARBY_URL, params=params)
            data = response.json()
            hospitals = self._parse_places(data.get("results", []))
            hospitals = await maps_service.get_directions_for_hospitals(lat, lng, hospitals)
            return hospitals[:5]
        except Exception as e:
            logger.error(f"[Hospital] Emergency search error: {e}")
            return []

    async def search_hospitals(self, query: str, lat: float = None, lng: float = None) -> list[dict]:
        """Free-text hospital search."""
        if not GOOGLE_PLACES_API_KEY:
            return []
        try:
            params = {
                "query": f"{query} hospital clinic",
                "type": "hospital",
                "key": GOOGLE_PLACES_API_KEY,
            }
            if lat and lng:
                params["location"] = f"{lat},{lng}"
                params["radius"] = 20000
            response = await self._client.get(PLACES_TEXT_SEARCH_URL, params=params)
            data = response.json()
            return self._parse_places(data.get("results", []))[:10]
        except Exception as e:
            logger.error(f"[Hospital] Text search error: {e}")
            return []

    async def get_hospital_details(self, place_id: str) -> dict:
        """Fetch full details for a specific hospital by Place ID."""
        if not GOOGLE_PLACES_API_KEY:
            return {}
        try:
            params = {
                "place_id": place_id,
                "fields": "name,formatted_address,formatted_phone_number,website,rating,opening_hours,geometry",
                "key": GOOGLE_PLACES_API_KEY,
            }
            response = await self._client.get(PLACES_DETAILS_URL, params=params)
            data = response.json()

            if data.get("status") != "OK":
                return {}

            result = data.get("result", {})
            return {
                "name": result.get("name", ""),
                "address": result.get("formatted_address", ""),
                "phone": result.get("formatted_phone_number", "Not available"),
                "website": result.get("website", ""),
                "rating": result.get("rating", 0),
                "place_id": place_id,
                "opening_hours": result.get("opening_hours", {}).get("weekday_text", []),
                "location": result.get("geometry", {}).get("location", {}),
            }
        except Exception as e:
            logger.error(f"[Hospital] Details fetch error: {e}")
            return {}

    def _parse_places(self, results: list) -> list[dict]:
        """Convert raw Google Places results to clean dicts."""
        hospitals = []
        for place in results[:10]:
            hospitals.append({
                "name": place.get("name", "Unknown Hospital"),
                "address": place.get("vicinity", place.get("formatted_address", "Address not available")),
                "rating": place.get("rating", 0),
                "user_ratings_total": place.get("user_ratings_total", 0),
                "place_id": place.get("place_id", ""),
                "location": place.get("geometry", {}).get("location", {}),
                "open_now": place.get("opening_hours", {}).get("open_now", None),
                "types": place.get("types", []),
                "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id', '')}",
                "travel_info": {
                    "distance": "Calculating...",
                    "duration": "Calculating...",
                    "maps_url": "",
                },
            })
        return hospitals

    def _get_search_keyword(self, specialist: str) -> str:
        """Map a specialist type to an appropriate Places API search keyword."""
        specialist_lower = specialist.lower().strip()
        for key, keyword in SPECIALIST_KEYWORD_MAP.items():
            if key in specialist_lower:
                return keyword
        return "hospital"

    def _mock_hospitals(self, specialist: str) -> list[dict]:
        """
        Fallback mock data when Google Places API key is not configured.
        Useful for development/testing.
        """
        return [
            {
                "name": f"City General Hospital (Demo)",
                "address": "123 Health Street, City Center",
                "rating": 4.2,
                "user_ratings_total": 450,
                "place_id": "demo_place_1",
                "location": {"lat": 0, "lng": 0},
                "open_now": True,
                "specialist_focus": specialist,
                "maps_url": "https://maps.google.com",
                "travel_info": {"distance": "2.5 km", "duration": "12 min", "maps_url": ""},
                "note": "Demo data — configure GOOGLE_PLACES_API_KEY for real results",
            }
        ]

    async def close(self):
        await self._client.aclose()


# Singleton
hospital_service = HospitalService()
