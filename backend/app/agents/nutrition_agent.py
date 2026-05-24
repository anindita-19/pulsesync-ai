"""
PulseSync AI — Nutrition Agent
Generates personalized nutrition and lifestyle guidance.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.nutrition_prompt import NUTRITION_SYSTEM_PROMPT, build_nutrition_prompt


class NutritionAgent(BaseAgent):
    agent_id = "nutrition"
    agent_name = "Nutrition Guide"
    default_temperature = 0.4  # Slightly higher for more creative, practical suggestions

    def get_system_prompt(self) -> str:
        return NUTRITION_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        return build_nutrition_prompt(user_message, context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store nutrition guidance in shared context."""
        context["nutrition"] = json.dumps(result, indent=2)

    def fallback_response(self) -> dict:
        return {
            "recommended_foods": [],
            "foods_to_avoid": [],
            "hydration_advice": "Aim to drink 8 glasses of water per day.",
            "lifestyle_tips": ["Get regular light exercise", "Maintain a consistent sleep schedule"],
            "meal_timing_tips": [],
            "diet_note": "Personalized nutrition guidance is temporarily unavailable.",
            "confidence": 0,
            "error": True,
        }
