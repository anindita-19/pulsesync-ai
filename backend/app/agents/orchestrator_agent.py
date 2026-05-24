"""
PulseSync AI — Orchestrator Agent
Master controller that initializes shared context, triggers all specialized agents
in the correct order, and coordinates the collaborative pipeline.
"""

import asyncio
import logging
from typing import Optional

from app.agents.symptom_agent import SymptomAgent
from app.agents.medical_analysis_agent import MedicalAnalysisAgent
from app.agents.report_analysis_agent import ReportAnalysisAgent
from app.agents.medication_agent import MedicationAgent
from app.agents.nutrition_agent import NutritionAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.agents.memory_agent import memory_agent
from app.services.context_manager import ContextManager
from app.services.agent_event_service import agent_event_service

logger = logging.getLogger(__name__)


class OrchestratorAgent:
    """
    The orchestrator coordinates the full multi-agent healthcare pipeline.

    Pipeline order:
    1. Initialize shared context (user profile, history, prior reports)
    2. Run Symptom Agent
    3. Run Medical Analysis Agent (parallel with Step 2 possible, but sequential for now)
    4. Run Medication Agent
    5. Run Nutrition Agent
    6. Run Recommendation Agent (synthesizes all outputs)
    7. Persist outputs via Memory Agent

    The agents share a mutable context dict that each agent reads from
    and writes back to, creating a collaborative knowledge chain.
    """

    def __init__(self):
        self.symptom_agent = SymptomAgent()
        self.medical_agent = MedicalAnalysisAgent()
        self.report_agent = ReportAnalysisAgent()
        self.medication_agent = MedicationAgent()
        self.nutrition_agent = NutritionAgent()
        self.recommendation_agent = RecommendationAgent()
        self.context_manager = ContextManager()

    async def run(
        self,
        user_message: str,
        user_id: str,
        session_id: str,
        explanation_level: int = 1,
        report_content: Optional[str] = None,
        report_type: Optional[str] = None,
    ) -> dict:
        """
        Execute the full collaborative agent pipeline.

        Args:
            user_message: The user's health query.
            user_id: Authenticated user's ID.
            session_id: Current chat session ID.
            explanation_level: 1=Basic, 2=Simple, 3=Detailed.
            report_content: Optional — extracted text from an uploaded report.
            report_type: Optional — type of the uploaded report.

        Returns:
            Complete structured response dict ready for API output.
        """
        logger.info(f"[Orchestrator] Starting pipeline | user={user_id} | session={session_id}")

        # ── Step 1: Initialize shared context ─────────────────────────────────
        await agent_event_service.publish_agent_event(
            session_id=session_id,
            agent_id="orchestrator",
            agent_name="Orchestrator",
            status="active",
            message="Initializing your health analysis...",
        )

        context = await self.context_manager.build_initial_context(
            user_id=user_id,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 2: Symptom Agent ──────────────────────────────────────────────
        symptom_result = await self.symptom_agent.run(
            user_message=user_message,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 3: Medical Analysis Agent ────────────────────────────────────
        medical_result = await self.medical_agent.run(
            user_message=user_message,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 4: Report Analysis Agent (only if report content provided) ───
        report_result = {}
        if report_content:
            context["report_type"] = report_type or "Medical Report"
            report_result = await self.report_agent.run(
                user_message=report_content,
                context=context,
                session_id=session_id,
                explanation_level=explanation_level,
            )

        # ── Step 5: Medication Agent ──────────────────────────────────────────
        medication_result = await self.medication_agent.run(
            user_message=user_message,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 6: Nutrition Agent ───────────────────────────────────────────
        nutrition_result = await self.nutrition_agent.run(
            user_message=user_message,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 7: Recommendation Agent (final synthesis) ────────────────────
        await agent_event_service.publish_agent_event(
            session_id=session_id,
            agent_id="recommendation",
            agent_name="Chief Health Advisor",
            status="active",
            message="Generating your final health summary...",
        )

        recommendation_result = await self.recommendation_agent.run(
            user_message=user_message,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )

        # ── Step 8: Persist via Memory Agent ─────────────────────────────────
        await memory_agent.save_ai_recommendation(
            user_id=user_id,
            recommendation=recommendation_result,
            session_id=session_id,
        )
        await memory_agent.log_health_event(
            user_id=user_id,
            event_type="ai_interaction",
            title="AI Health Consultation",
            description=f"Query: {user_message[:100]}...",
            metadata={"session_id": session_id, "severity": context.get("final_severity")},
        )
        await memory_agent.save_session_context(session_id, user_id, context)

        # ── Step 9: Build final structured pipeline output ───────────────────
        await agent_event_service.publish_agent_event(
            session_id=session_id,
            agent_id="orchestrator",
            agent_name="Orchestrator",
            status="complete",
            message="Analysis complete!",
        )

        return {
            "symptom_analysis": symptom_result,
            "medical_analysis": medical_result,
            "report_analysis": report_result,
            "medication_analysis": medication_result,
            "nutrition_guidance": nutrition_result,
            "recommendation": recommendation_result,
            "recommended_specialist": context.get("recommended_specialist", "General Practitioner"),
            "severity": context.get("final_severity", "Low"),
            "confidence": context.get("final_confidence", 0),
            "session_id": session_id,
        }


# Singleton instance
orchestrator = OrchestratorAgent()
