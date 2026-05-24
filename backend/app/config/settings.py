"""
PulseSync AI — Application Settings
Pydantic-based environment configuration.
"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "PulseSync AI"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api/v1"
    allowed_origins: str = "http://localhost:3000"

    # JWT
    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "pulsesync_ai"

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_password: str = ""

    # Groq
    groq_api_key: str = ""

    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/auth/google/callback"
    google_places_api_key: str = ""

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_upload_folder: str = "pulsesync/reports"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_data"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
