"""
ChromaDB Integration
Vector database for RAG - healthcare knowledge, user memory, report embeddings.
Collections are pre-defined and ready for LangGraph pipeline integration.
"""
import logging
from typing import List, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Lazy import to avoid startup crash if chromadb not installed
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    logger.warning("ChromaDB not installed — vector search disabled")


class ChromaDBManager:
    """Manages ChromaDB collections for PulseSync AI RAG pipeline."""

    def __init__(self):
        self.client = None
        self._collections = {}

    def connect(self):
        if not CHROMA_AVAILABLE:
            return
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._init_collections()
            logger.info("ChromaDB connected")
        except Exception as e:
            logger.error(f"ChromaDB connection failed: {e}")

    def _init_collections(self):
        """Initialize all required collections."""
        collections = {
            # Global healthcare knowledge base (pre-populated)
            "healthcare_kb": {
                "metadata": {"description": "Healthcare knowledge base for RAG"},
            },
            # Per-user report embeddings
            "user_reports": {
                "metadata": {"description": "User medical report embeddings"},
            },
            # Per-user conversation memory
            "user_memory": {
                "metadata": {"description": "User interaction memory for context"},
            },
            # AI context embeddings
            "ai_context": {
                "metadata": {"description": "AI session context embeddings"},
            },
        }
        for name, config in collections.items():
            self._collections[name] = self.client.get_or_create_collection(
                name=name,
                metadata=config["metadata"],
            )

    def get_collection(self, name: str):
        return self._collections.get(name)

    async def add_report_embedding(
        self,
        user_id: str,
        report_id: str,
        text_content: str,
        metadata: dict = None,
    ):
        """Store a report's text embedding for RAG retrieval."""
        collection = self.get_collection("user_reports")
        if not collection:
            return
        try:
            collection.upsert(
                ids=[f"{user_id}_{report_id}"],
                documents=[text_content],
                metadatas=[{
                    "user_id": user_id,
                    "report_id": report_id,
                    **(metadata or {}),
                }],
            )
        except Exception as e:
            logger.error(f"ChromaDB upsert error: {e}")

    async def query_user_reports(
        self,
        user_id: str,
        query: str,
        top_k: int = 5,
    ) -> List[str]:
        """Query user's report embeddings for relevant context."""
        collection = self.get_collection("user_reports")
        if not collection:
            return []
        try:
            results = collection.query(
                query_texts=[query],
                n_results=top_k,
                where={"user_id": user_id},
            )
            return results.get("documents", [[]])[0]
        except Exception as e:
            logger.error(f"ChromaDB query error: {e}")
            return []

    async def query_healthcare_kb(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[str]:
        """Query global healthcare knowledge base."""
        collection = self.get_collection("healthcare_kb")
        if not collection:
            return []
        try:
            results = collection.query(query_texts=[query], n_results=top_k)
            return results.get("documents", [[]])[0]
        except Exception as e:
            logger.error(f"ChromaDB KB query error: {e}")
            return []

    async def add_conversation_memory(
        self,
        user_id: str,
        session_id: str,
        content: str,
        role: str,
    ):
        """Store conversation turn in user memory for future context."""
        collection = self.get_collection("user_memory")
        if not collection:
            return
        try:
            doc_id = f"{user_id}_{session_id}_{__import__('time').time()}"
            collection.upsert(
                ids=[doc_id],
                documents=[content],
                metadatas=[{"user_id": user_id, "session_id": session_id, "role": role}],
            )
        except Exception as e:
            logger.error(f"ChromaDB memory store error: {e}")


# Singleton
chroma_manager = ChromaDBManager()
