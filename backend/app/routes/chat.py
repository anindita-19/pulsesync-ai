"""Chat session and messaging routes."""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from datetime import datetime, timezone
from bson import ObjectId
import json
import logging

from app.core.security import get_current_user, get_current_user_ws
from app.database.mongodb import get_database
from app.schemas.chat_schemas import CreateSessionRequest, SendMessageRequest
from app.websocket.manager import ws_manager
from app.redis.manager import redis_manager
from app.services.history_service import log_event
from app.services.mock_agent_service import trigger_mock_agents

router = APIRouter(prefix="/chat", tags=["AI Chat"])
logger = logging.getLogger(__name__)


def serialize_msg(m: dict) -> dict:
    m["id"] = str(m.pop("_id", ""))
    return m


# ── REST: Session management ──────────────────────────────────────────────────

@router.post("/sessions")
async def create_session(
    payload: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    doc = {
        "user_id": user_id,
        "explanation_level": payload.explanation_level,
        "context": payload.context,
        "message_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.chat_sessions.insert_one(doc)
    session_id = str(result.inserted_id)

    await log_event(user_id, "ai_interaction", "Started AI session", "New conversation with AI ecosystem.")

    return {"session_id": session_id, "created_at": doc["created_at"]}


@router.get("/sessions")
async def get_sessions(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])
    skip = (page - 1) * limit

    cursor = db.chat_sessions.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    sessions = []
    async for s in cursor:
        s["id"] = str(s.pop("_id"))
        sessions.append(s)

    total = await db.chat_sessions.count_documents({"user_id": user_id})
    return {"sessions": sessions, "total": total}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])
    await db.chat_sessions.delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"success": True}


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    # Verify session belongs to user
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    skip = (page - 1) * limit
    cursor = db.chat_messages.find({"session_id": session_id}).sort("created_at", 1).skip(skip).limit(limit)

    messages = []
    async for m in cursor:
        messages.append(serialize_msg(m))

    total = await db.chat_messages.count_documents({"session_id": session_id})
    return {"messages": messages, "total": total, "session_id": session_id}


@router.post("/sessions/{session_id}/messages")
async def send_message_rest(
    session_id: str,
    payload: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """REST fallback for sending a message (non-streaming)."""
    db = get_database()
    user_id = str(current_user["_id"])

    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = {
        "session_id": session_id,
        "role": "user",
        "content": payload.content,
        "explanation_level": payload.explanation_level,
        "created_at": datetime.now(timezone.utc),
    }
    await db.chat_messages.insert_one(user_msg)

    # Placeholder AI response — replace with LangGraph pipeline
    ai_content = f"[AI response to: {payload.content[:80]}...]\n\nNote: LLM integration pending. This is a placeholder response from the PulseSync AI backend."

    ai_msg = {
        "session_id": session_id,
        "role": "assistant",
        "content": ai_content,
        "explanation_level": payload.explanation_level,
        "confidence": 0.85,
        "agent_used": "placeholder",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.chat_messages.insert_one(ai_msg)
    ai_msg["_id"] = result.inserted_id

    return serialize_msg(ai_msg)


@router.get("/sessions/{session_id}/suggestions")
async def get_suggestions(session_id: str, current_user: dict = Depends(get_current_user)):
    """Return conversation suggestion chips based on session context."""
    # TODO: Generate dynamically based on recent messages and health profile
    return {
        "suggestions": [
            "What does my latest report say?",
            "Do I have any health risks?",
            "Suggest a diet based on my profile",
            "Explain my blood test results",
        ]
    }


# ── WebSocket: Real-time chat ─────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_chat(
    websocket: WebSocket,
    token: str = Query(...),
    session_id: str = Query(None),
):
    """
    WebSocket endpoint for real-time AI chat streaming.
    Relays Redis Pub/Sub events (agent activity, tokens) to the client.
    """
    user = await get_current_user_ws(token)
    if not user:
        await websocket.close(code=4001)
        return

    user_id = str(user["_id"])

    await ws_manager.connect(websocket, user_id, session_id)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                event_type = data.get("type")
                payload = data.get("payload", {})

                if event_type == "chat_message":
                    await handle_chat_message(
                        user=user,
                        session_id=payload.get("session_id") or session_id,
                        content=payload.get("content", ""),
                        explanation_level=payload.get("explanation_level", 1),
                        message_id=payload.get("message_id"),
                    )

            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "payload": {"message": "Invalid JSON"}})

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await ws_manager.disconnect(websocket)


async def handle_chat_message(
    user: dict,
    session_id: str,
    content: str,
    explanation_level: int,
    message_id: str,
):
    """
    Process a WebSocket chat message:
    1. Save user message to MongoDB
    2. Trigger mock agent activity via Redis Pub/Sub
    3. Publish streaming tokens (placeholder)
    4. Save AI response and publish completion event
    """
    db = get_database()
    user_id = str(user["_id"])

    # 1. Save user message
    user_msg = {
        "session_id": session_id,
        "role": "user",
        "content": content,
        "explanation_level": explanation_level,
        "created_at": datetime.now(timezone.utc),
    }
    await db.chat_messages.insert_one(user_msg)

    # 2. Trigger mock agents (publishes to Redis)
    await trigger_mock_agents(session_id, content)

    # 3. Build placeholder AI response
    # TODO: Replace with actual LangGraph / LLM streaming call
    placeholder_response = (
        f"This is a placeholder AI response.\n\n"
        f"You asked: \"{content[:100]}\"\n\n"
        f"The AI agent pipeline (LangGraph + LLM) will be integrated here. "
        f"Your health profile and uploaded reports will be used as context for a fully personalized response."
    )

    # 4. Publish tokens word by word (simulating streaming)
    words = placeholder_response.split(" ")
    for word in words:
        await redis_manager.publish_chat_token(session_id, message_id, word + " ")

    # 5. Save AI message
    ai_msg = {
        "session_id": session_id,
        "role": "assistant",
        "content": placeholder_response,
        "explanation_level": explanation_level,
        "confidence": 0.85,
        "message_id": message_id,
        "created_at": datetime.now(timezone.utc),
    }
    await db.chat_messages.insert_one(ai_msg)

    # Update session message count
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$inc": {"message_count": 2}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    # 6. Publish completion event
    await redis_manager.publish_chat_complete(
        session_id,
        message_id,
        full_content=placeholder_response,
        confidence=0.85,
        suggestions=[
            "Tell me more about this",
            "What should I do next?",
            "Show me related reports",
        ],
    )
