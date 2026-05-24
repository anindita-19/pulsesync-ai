"""Schemas for AI chat sessions and messages."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CreateSessionRequest(BaseModel):
    explanation_level: Optional[int] = 1
    context: Optional[dict] = {}


class SessionResponse(BaseModel):
    session_id: str
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str
    explanation_level: Optional[int] = 1
    context: Optional[dict] = {}


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    explanation_level: Optional[int] = None
    confidence: Optional[float] = None
    agent_used: Optional[str] = None
    created_at: datetime


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    session_id: str