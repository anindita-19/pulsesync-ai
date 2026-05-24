"""
Cloudinary integration for medical report storage.
Handles secure upload, deletion, and URL signing.
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_report(
    file_content: bytes,
    file_name: str,
    file_type: str,
    user_id: str,
) -> dict:
    """
    Upload a medical report to Cloudinary.
    Returns upload result including secure_url and public_id.
    """
    is_pdf = file_type == "application/pdf"

    folder = f"{settings.CLOUDINARY_UPLOAD_FOLDER}/{user_id}"

    upload_options = {
        "folder": folder,
        "resource_type": "raw" if is_pdf else "image",
        "access_mode": "authenticated",  # Private, signed URL required
        "use_filename": True,
        "unique_filename": True,
        "overwrite": False,
        "tags": [f"user:{user_id}", "medical_report"],
    }

    try:
        result = cloudinary.uploader.upload(
            file_content,
            **upload_options,
        )
        logger.info(f"Uploaded to Cloudinary: {result['public_id']}")
        return {
            "file_url": result["secure_url"],
            "public_id": result["public_id"],
            "file_size": result.get("bytes"),
            "resource_type": result["resource_type"],
        }
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise Exception(f"File upload failed: {str(e)}")


async def delete_report(public_id: str, resource_type: str = "image"):
    """Delete a file from Cloudinary."""
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        logger.info(f"Deleted from Cloudinary: {public_id}")
        return result
    except Exception as e:
        logger.error(f"Cloudinary delete failed: {e}")
        raise


def get_signed_url(public_id: str, resource_type: str = "image", expires_at: int = 3600) -> str:
    """Generate a time-limited signed URL for private assets."""
    try:
        return cloudinary.utils.private_download_url(
            public_id,
            resource_type=resource_type,
            expires_at=int(__import__("time").time()) + expires_at,
        )
    except Exception as e:
        logger.error(f"Failed to generate signed URL: {e}")
        return ""
