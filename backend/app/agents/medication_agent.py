"""
PulseSync AI — Medication Agent
Analyzes medications for interactions, risks, and precautions.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.medication_prompt import MEDICATION_SYSTEM_PROMPT, build_medication_prompt


class MedicationAgent(BaseAgent):
    agent_id = "medication"
    agent_name = "Medication Safety Advisor"
    default_temperature = 0.2

    def get_system_prompt(self) -> str:
        return MEDICATION_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        return build_medication_prompt(user_message, context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store medication analysis in shared context."""
        context["medications"] = json.dumps(result, indent=2)
        context["medication_risk"] = result.get("overall_risk_level", "Unknown")

    def fallback_response(self) -> dict:
        return {
            "medications_reviewed": [],
            "interactions": [],
            "precautions": [],
            "general_safety_note": "Medication review is currently unavailable. Please consult your pharmacist.",
            "confidence": 0,
            "overall_risk_level": "Unknown",
            "pharmacist_consultation_recommended": True,
            "error": True,
        }
