"""
MongoDB connection using Motor (async driver).
Provides a singleton client and database accessor.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db = None


db = Database()


async def connect_db():
    """Connect to MongoDB Atlas."""
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.db = db.client[settings.MONGODB_DB_NAME]
        # Ping to verify connection
        await db.client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        await create_indexes()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def disconnect_db():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create database indexes for performance."""
    database = db.db

    # Users
    await database.users.create_index("email", unique=True)
    await database.users.create_index("google_id", sparse=True)

    # Reports
    await database.reports.create_index("user_id")
    await database.reports.create_index([("user_id", 1), ("created_at", -1)])
    await database.reports.create_index([("user_id", 1), ("report_type", 1)])

    # Chat sessions
    await database.chat_sessions.create_index("user_id")
    await database.chat_sessions.create_index([("user_id", 1), ("created_at", -1)])

    # Chat messages
    await database.chat_messages.create_index("session_id")
    await database.chat_messages.create_index([("session_id", 1), ("created_at", 1)])

    # Medical history / timeline
    await database.medical_history.create_index("user_id")
    await database.medical_history.create_index([("user_id", 1), ("created_at", -1)])

    # Notifications
    await database.notifications.create_index("user_id")
    await database.notifications.create_index([("user_id", 1), ("read", 1)])

    # Health metrics
    await database.health_metrics.create_index("user_id")
    await database.health_metrics.create_index([("user_id", 1), ("recorded_at", -1)])

    logger.info("MongoDB indexes created")


def get_database():
    """Return the active database instance."""
    return db.db
