"""
PulseSync AI — Recommendation Agent
Final synthesis: combines all agent outputs into one structured recommendation.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.recommendation_prompt import RECOMMENDATION_SYSTEM_PROMPT, build_recommendation_prompt


class RecommendationAgent(BaseAgent):
    agent_id = "recommendation"
    agent_name = "Chief Health Advisor"
    default_temperature = 0.3

    def get_system_prompt(self) -> str:
        return RECOMMENDATION_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        """
        Recommendation agent reads from context (all previous agent outputs),
        not from the raw user message.
        """
        return build_recommendation_prompt(context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store the final recommendation and extract specialist for hospital lookup."""
        context["recommendation"] = json.dumps(result, indent=2)
        # This is the key field the Hospital Service reads
        context["recommended_specialist"] = result.get("recommended_specialist", "General Practitioner")
        context["final_severity"] = result.get("severity", "Low")
        context["final_confidence"] = result.get("confidence", 0)

    def fallback_response(self) -> dict:
        return {
            "possible_condition": "Unable to determine",
            "confidence": 0,
            "severity": "Unknown",
            "recommended_specialist": "General Practitioner",
            "simple_explanation": "I was unable to generate a full health recommendation. Please consult a General Practitioner for proper evaluation.",
            "key_points": ["Consult a doctor for proper evaluation"],
            "immediate_actions": ["Schedule an appointment with a General Practitioner"],
            "what_to_tell_doctor": "Describe your current symptoms and any medications you are taking.",
            "requires_emergency_care": False,
            "disclaimer": "This is an AI-generated health insight, not a medical diagnosis. Always consult a qualified healthcare professional.",
            "error": True,
        }
