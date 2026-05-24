"""
PulseSync AI — Report Analysis Agent
Analyzes uploaded medical reports and extracts structured insights.
"""

import json
from app.agents.base_agent import BaseAgent
from app.ai.prompts.report_prompt import REPORT_SYSTEM_PROMPT, build_report_prompt


class ReportAnalysisAgent(BaseAgent):
    agent_id = "report"
    agent_name = "Report Analyst"
    default_temperature = 0.15  # Very low — precision matters for report analysis

    def get_system_prompt(self) -> str:
        return REPORT_SYSTEM_PROMPT

    def build_user_prompt(self, user_message: str, context: dict, explanation_level: int) -> str:
        """
        For report analysis, user_message contains the report text/content.
        report_type comes from context.
        """
        report_content = user_message
        report_type = context.get("report_type", "Medical Report")
        return build_report_prompt(report_content, report_type, context, explanation_level)

    def update_context(self, context: dict, result: dict) -> None:
        """Store report analysis in shared context."""
        context["reports"] = json.dumps(result, indent=2)
        context["report_severity"] = result.get("severity", "Unknown")

    def fallback_response(self) -> dict:
        return {
            "report_summary": "Report analysis is currently unavailable.",
            "findings": [],
            "abnormal_count": 0,
            "overall_impression": "Unknown",
            "key_insights": [],
            "recommendations": ["Please consult your doctor to review this report."],
            "confidence": 0,
            "severity": "Unknown",
            "error": True,
        }

    async def analyze_report(
        self,
        report_content: str,
        report_type: str,
        context: dict,
        session_id: str,
        explanation_level: int = 1,
    ) -> dict:
        """
        Specialized entry point for direct report analysis calls
        (from the /reports/{id}/analyze endpoint).
        Wraps run() with report-specific context setup.
        """
        context["report_type"] = report_type
        return await self.run(
            user_message=report_content,
            context=context,
            session_id=session_id,
            explanation_level=explanation_level,
        )
