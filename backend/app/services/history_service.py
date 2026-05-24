"""Medical history / timeline event service."""
from datetime import datetime, timezone
from app.database.mongodb import get_database


async def log_event(
    user_id: str,
    event_type: str,
    title: str,
    description: str = None,
    metadata: dict = None,
):
    """Add an event to the user's medical history timeline."""
    db = get_database()
    doc = {
        "user_id": user_id,
        "type": event_type,
        "title": title,
        "description": description,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc),
    }
    await db.medical_history.insert_one(doc)
