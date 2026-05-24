"""
PulseSync AI — Symptom Agent
Analyzes user-reported symptoms and returns structured findings.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.symptom_prompt import SYMPTOM_SYSTEM_PROMPT, build_symptom_prompt


class SymptomAgent(BaseAgent):
    agent_id = "symptom"
    agent_name = "Symptom Specialist"
    default_temperature = 0.25

    def get_system_prompt(self) -> str:
        return SYMPTOM_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        return build_symptom_prompt(user_message, context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store symptom analysis in shared context for downstream agents."""
        context["symptoms"] = json.dumps(result, indent=2)
        # Surface key severity and confidence for quick access
        context["severity"] = result.get("severity", "Unknown")
        context["symptom_confidence"] = result.get("confidence", 0)

    def fallback_response(self) -> dict:
        return {
            "possible_conditions": [],
            "severity": "Unknown",
            "confidence": 0,
            "symptom_summary": "Unable to analyze symptoms at this time.",
            "simple_explanation": "I had trouble analyzing your symptoms. Please try describing them again or consult a doctor directly.",
            "warning_signs": [],
            "when_to_see_doctor": "If you're feeling unwell, please consult a healthcare professional.",
            "follow_up_questions": ["Can you describe your symptoms in more detail?"],
            "error": True,
        }
