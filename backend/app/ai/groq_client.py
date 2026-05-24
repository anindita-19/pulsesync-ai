"""
PulseSync AI — Groq API Client
Async, retry-capable, environment-configured Groq client.
"""

import os
import asyncio
import logging
from typing import Optional
from groq import AsyncGroq, APIError, RateLimitError, APITimeoutError

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_TEMPERATURE = 0.3
DEFAULT_MAX_TOKENS = 2048
MAX_RETRIES = 3
RETRY_DELAY = 1.5  # seconds


class GroqClient:
    """
    Singleton-style async Groq client with:
    - Retry logic on rate limits / timeouts
    - Per-agent temperature control
    - Structured JSON response support
    - Clean error propagation
    """

    def __init__(self):
        if not GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set — AI calls will fail.")
        self._client = AsyncGroq(api_key=GROQ_API_KEY)

    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        response_format: Optional[dict] = None,
    ) -> str:
        """
        Send a chat completion request to Groq and return the response text.

        Args:
            system_prompt: The agent's role/instructions.
            user_message: The user's input or assembled context.
            model: Groq model identifier.
            temperature: Creativity level (lower = more deterministic).
            max_tokens: Max response length.
            response_format: Optional {"type": "json_object"} for JSON mode.

        Returns:
            Raw string response from the model.

        Raises:
            RuntimeError: On exhausted retries or fatal API errors.
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await self._client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content
                logger.debug(f"[GroqClient] Attempt {attempt} success. Tokens used: {response.usage.total_tokens}")
                return content

            except RateLimitError as e:
                logger.warning(f"[GroqClient] Rate limit hit (attempt {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * attempt)
                else:
                    raise RuntimeError("Groq rate limit exceeded after retries.") from e

            except APITimeoutError as e:
                logger.warning(f"[GroqClient] Timeout (attempt {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    raise RuntimeError("Groq API timed out after retries.") from e

            except APIError as e:
                logger.error(f"[GroqClient] API error: {e}")
                raise RuntimeError(f"Groq API error: {str(e)}") from e

            except Exception as e:
                logger.error(f"[GroqClient] Unexpected error: {e}")
                raise RuntimeError(f"Unexpected error calling Groq: {str(e)}") from e

    async def complete_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        """
        Convenience wrapper that forces JSON output mode.
        Always use this for agent calls.
        """
        return await self.complete(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )


# Global singleton instance
groq_client = GroqClient()
