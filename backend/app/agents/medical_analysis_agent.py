"""
PulseSync AI — Medical Analysis Agent
Analyzes medical history, chronic conditions, lifestyle, and risk factors.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.medical_prompt import MEDICAL_SYSTEM_PROMPT, build_medical_prompt


class MedicalAnalysisAgent(BaseAgent):
    agent_id = "analysis"
    agent_name = "Medical History Analyst"
    default_temperature = 0.2

    def get_system_prompt(self) -> str:
        return MEDICAL_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        return build_medical_prompt(user_message, context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store medical analysis in shared context."""
        context["medical_history"] = json.dumps(result, indent=2)
        # Extract risk factors summary for downstream agents
        risk_factors = result.get("risk_factors", [])
        if risk_factors:
            context["risk_summary"] = ", ".join(r.get("factor", "") for r in risk_factors)

    def fallback_response(self) -> dict:
        return {
            "risk_factors": [],
            "relevant_history_points": [],
            "lifestyle_insights": [],
            "follow_up_questions": ["Could you share more about your medical history?"],
            "medical_summary": "Medical history analysis unavailable at this time.",
            "confidence": 0,
            "doctor_consultation_urgency": "Routine",
            "error": True,
        }
