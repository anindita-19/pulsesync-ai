"""
PulseSync AI — JSON Parser Utility
Safe, robust JSON parsing for LLM outputs that may contain
extra text, markdown fences, or minor formatting issues.
"""

import json
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def safe_parse_json(raw: str) -> Optional[dict]:
    """
    Robustly parse a JSON string from an LLM response.
    Handles common LLM output quirks:
    - Markdown code fences (```json ... ```)
    - Extra whitespace or leading text
    - Trailing commas (best-effort)
    - Partial truncation (returns None if truly malformed)

    Returns parsed dict or None if parsing fails after all attempts.
    """
    if not raw:
        return None

    raw = raw.strip()

    # Attempt 1: Direct parse (happy path)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Strip markdown code fences
    # Handles ```json\n{...}\n``` or ```\n{...}\n```
    fence_pattern = r"```(?:json)?\s*([\s\S]+?)\s*```"
    match = re.search(fence_pattern, raw)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Attempt 3: Extract first JSON object {...} or array [...]
    json_pattern = r"(\{[\s\S]*\}|\[[\s\S]*\])"
    match = re.search(json_pattern, raw)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Attempt 4: Remove trailing commas (common LLM error)
    try:
        cleaned = re.sub(r",\s*([}\]])", r"\1", raw)
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    logger.warning(f"[JSONParser] Failed to parse response. Preview: {raw[:300]}")
    return None


def extract_field(data: dict, *keys, default=None):
    """
    Safely extract a nested field from a dict.
    Supports dot-notation traversal via multiple keys.

    Example:
        extract_field(data, "recommendation", "confidence", default=0)
    """
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    return current


def normalize_confidence(value) -> float:
    """
    Normalize a confidence value to a 0.0–1.0 float.
    LLMs sometimes return 0–100 integers, sometimes 0.0–1.0 floats.
    """
    try:
        val = float(value)
        if val > 1.0:
            return round(val / 100.0, 2)
        return round(val, 2)
    except (TypeError, ValueError):
        return 0.0
