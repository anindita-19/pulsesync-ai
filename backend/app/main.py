"""
PulseSync AI - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from app.config.settings import settings
from app.database.mongodb import connect_db, disconnect_db
from app.redis.manager import redis_manager

# Routes
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.reports import router as reports_router
from app.routes.dashboard import router as dashboard_router
from app.routes.chat import router as chat_router
from app.routes.history import router as history_router
from app.routes.hospitals import router as hospitals_router

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup/shutdown) ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name}...")
    await connect_db()
    try:
        await redis_manager.connect()
    except Exception as e:
        logger.warning(f"Redis not available: {e} — real-time features disabled")
    yield
    logger.info("Shutting down...")
    await disconnect_db()
    try:
        await redis_manager.disconnect()
    except Exception:
        pass


# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=f"{settings.app_name} API",
    description="AI-Powered Healthcare Intelligence Platform API",
    version="1.0.0",
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 2)
    response.headers["X-Response-Time"] = f"{elapsed}ms"
    return response


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Routes ────────────────────────────────────────────────────────────────────
PREFIX = settings.api_prefix

app.include_router(auth_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)
app.include_router(reports_router, prefix=PREFIX)
app.include_router(dashboard_router, prefix=PREFIX)
app.include_router(chat_router, prefix=PREFIX)
app.include_router(history_router, prefix=PREFIX)
app.include_router(hospitals_router, prefix=PREFIX)


# ── WebSocket route (separate from REST prefix) ───────────────────────────────
from app.routes.chat import router as ws_router
# WebSocket is defined on /ws directly in the chat router


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
    }


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "docs": "/api/docs",
        "version": "1.0.0",
    }