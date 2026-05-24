"""
Mock AI Agent Service
Simulates multi-agent activity via Redis Pub/Sub.
Replace with actual LangGraph agent orchestration.
"""
import asyncio
from app.redis.manager import redis_manager

AGENT_SEQUENCE = [
    ("symptom", "Symptom Agent", "active", "Analyzing symptoms and health context..."),
    ("analysis", "Medical Analysis Agent", "processing", "Cross-referencing with medical database..."),
    ("report", "Report Analysis Agent", "active", "Scanning uploaded reports for context..."),
    ("nutrition", "Nutrition Agent", "processing", "Generating dietary suggestions..."),
    ("recommendation", "Recommendation Agent", "active", "Preparing personalized response..."),
]


async def trigger_mock_agents(session_id: str, user_message: str):
    """
    Simulate multi-agent activity by publishing events to Redis.
    Each agent activates in sequence with short delays.
    """
    async def run_agents():
        for agent_id, agent_name, status, message in AGENT_SEQUENCE:
            await redis_manager.publish_agent_event(
                session_id=session_id,
                agent_id=agent_id,
                status=status,
                message=message,
            )
            await asyncio.sleep(0.6)

        # Mark all as complete
        for agent_id, agent_name, _, _ in AGENT_SEQUENCE:
            await redis_manager.publish_agent_event(
                session_id=session_id,
                agent_id=agent_id,
                status="complete",
                message="Analysis complete ✓",
            )

    # Run agents concurrently without blocking the response
    asyncio.create_task(run_agents())
