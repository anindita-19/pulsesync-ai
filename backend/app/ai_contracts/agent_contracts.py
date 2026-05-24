"""
AI Agent Contracts
Defines the interface contracts between the backend and future AI agents.
These schemas will be used when integrating LangGraph pipelines.
"""
from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    PROCESSING = "processing"
    COMPLETE = "complete"
    ERROR = "error"


class AgentType(str, Enum):
    SYMPTOM = "symptom"
    MEDICAL_ANALYSIS = "analysis"
    REPORT_ANALYSIS = "report"
    NUTRITION = "nutrition"
    RECOMMENDATION = "recommendation"


class AgentEvent(BaseModel):
    """Real-time agent activity event (via Redis Pub/Sub → WebSocket)."""
    agent_id: str
    agent_type: AgentType
    status: AgentStatus
    message: str
    session_id: str
    metadata: Optional[dict] = {}


class AgentInput(BaseModel):
    """
    Input contract for any AI agent.
    LangGraph agents receive this as input state.
    """
    session_id: str
    user_id: str
    user_message: str
    explanation_level: int = 1  # 1=basic, 2=simplified, 3=detailed

    # Health context
    user_profile: Optional[dict] = None
    recent_reports: Optional[List[dict]] = None
    medical_history: Optional[List[dict]] = None
    conversation_history: Optional[List[dict]] = None

    # RAG context
    retrieved_documents: Optional[List[str]] = None


class AgentOutput(BaseModel):
    """
    Output contract for any AI agent.
    LangGraph agents return this as output state.
    """
    session_id: str
    message_id: str
    content: str
    confidence: float = 0.0
    severity_level: Optional[str] = None  # low | medium | high
    agent_used: str
    sources: Optional[List[str]] = None
    follow_up_suggestions: Optional[List[str]] = None
    requires_doctor: bool = False
    metadata: Optional[dict] = {}


class RAGQuery(BaseModel):
    """Contract for RAG (Retrieval Augmented Generation) queries."""
    query: str
    user_id: str
    collection: str  # healthcare_kb | user_reports | user_memory
    top_k: int = 5
    filter_metadata: Optional[dict] = None


class RAGResult(BaseModel):
    documents: List[str]
    scores: List[float]
    metadata: List[dict]


# ── Future LangGraph State Contract ──────────────────────────────────────────
# When LangGraph is integrated, the graph state will follow this structure:
#
# class PulseSyncAgentState(TypedDict):
#     session_id: str
#     user_id: str
#     user_message: str
#     explanation_level: int
#     user_profile: dict
#     recent_reports: list
#     medical_history: list
#     conversation_history: list
#     retrieved_context: list       # From ChromaDB RAG
#     active_agents: list
#     agent_outputs: dict
#     final_response: str
#     confidence: float
#     severity: str
#     suggestions: list
#     requires_escalation: bool
#
# Nodes in the LangGraph:
#   1. context_retriever    → RAG lookup (ChromaDB)
#   2. symptom_analyzer     → Symptom Agent
#   3. report_analyzer      → Report Analysis Agent
#   4. medical_reasoner     → Medical Analysis Agent
#   5. nutrition_advisor    → Nutrition Agent
#   6. response_synthesizer → Recommendation Agent
#   7. confidence_scorer    → Confidence calculation
#   8. response_formatter   → Explanation level formatting
