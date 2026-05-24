"""
PulseSync AI — Maps Service
Google Maps API integration for routing and directions.
"""

import os
import logging
import asyncio
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
DIRECTIONS_BASE_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODING_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class MapsService:
    """
    Handles Google Maps APIs for:
    - Directions between user location and a hospital
    - Address geocoding
    - Travel time and distance calculation
    """

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=10.0)

    async def get_directions(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_place_id: str,
        mode: str = "driving",
    ) -> dict:
        """
        Get driving/transit directions from user to a hospital.

        Args:
            origin_lat/lng: User's current coordinates.
            destination_place_id: Google Place ID of the hospital.
            mode: driving | walking | transit | bicycling

        Returns:
            Structured directions dict with steps, distance, duration.
        """
        if not GOOGLE_MAPS_API_KEY:
            return self._unavailable_response("Google Maps API key not configured.")

        try:
            params = {
                "origin": f"{origin_lat},{origin_lng}",
                "destination": f"place_id:{destination_place_id}",
                "mode": mode,
                "key": GOOGLE_MAPS_API_KEY,
            }
            response = await self._client.get(DIRECTIONS_BASE_URL, params=params)
            data = response.json()

            if data.get("status") != "OK":
                logger.warning(f"[Maps] Directions API returned: {data.get('status')}")
                return self._unavailable_response(f"Directions unavailable: {data.get('status')}")

            route = data["routes"][0]
            leg = route["legs"][0]

            return {
                "distance": leg["distance"]["text"],
                "duration": leg["duration"]["text"],
                "distance_meters": leg["distance"]["value"],
                "duration_seconds": leg["duration"]["value"],
                "start_address": leg["start_address"],
                "end_address": leg["end_address"],
                "steps": [
                    {
                        "instruction": step["html_instructions"],
                        "distance": step["distance"]["text"],
                        "duration": step["duration"]["text"],
                    }
                    for step in leg["steps"][:10]  # Limit steps for response size
                ],
                "polyline": route["overview_polyline"]["points"],
                "maps_url": f"https://www.google.com/maps/dir/?api=1&origin={origin_lat},{origin_lng}&destination_place_id={destination_place_id}&travelmode={mode}",
            }

        except httpx.TimeoutException:
            logger.error("[Maps] Directions API timed out.")
            return self._unavailable_response("Directions request timed out.")
        except Exception as e:
            logger.error(f"[Maps] Directions error: {e}")
            return self._unavailable_response("Unable to fetch directions.")

    async def geocode_address(self, address: str) -> Optional[dict]:
        """Convert an address string to lat/lng coordinates."""
        if not GOOGLE_MAPS_API_KEY:
            return None
        try:
            params = {"address": address, "key": GOOGLE_MAPS_API_KEY}
            response = await self._client.get(GEOCODING_BASE_URL, params=params)
            data = response.json()

            if data.get("status") == "OK" and data["results"]:
                location = data["results"][0]["geometry"]["location"]
                return {"lat": location["lat"], "lng": location["lng"]}
            return None
        except Exception as e:
            logger.error(f"[Maps] Geocoding error: {e}")
            return None

    async def get_directions_for_hospitals(
        self,
        origin_lat: float,
        origin_lng: float,
        hospitals: list[dict],
    ) -> list[dict]:
        """
        Fetch directions for a list of hospitals concurrently.
        Attaches travel info to each hospital dict.
        """
        async def fetch_one(hospital: dict) -> dict:
            place_id = hospital.get("place_id", "")
            if not place_id:
                return hospital

            directions = await self.get_directions(origin_lat, origin_lng, place_id)
            hospital["travel_info"] = {
                "distance": directions.get("distance", "Unknown"),
                "duration": directions.get("duration", "Unknown"),
                "maps_url": directions.get("maps_url", ""),
            }
            return hospital

        # Limit concurrency to avoid hitting API rate limits
        results = await asyncio.gather(*[fetch_one(h) for h in hospitals[:5]], return_exceptions=True)
        return [r for r in results if isinstance(r, dict)]

    def _unavailable_response(self, reason: str) -> dict:
        return {
            "error": True,
            "message": reason,
            "distance": "Unknown",
            "duration": "Unknown",
            "steps": [],
        }

    async def close(self):
        await self._client.aclose()


# Singleton
maps_service = MapsService()
