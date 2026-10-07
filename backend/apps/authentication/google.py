"""
Google ID Token verification service.
Uses standard library urllib (no third-party dependencies required).
Calls Google's tokeninfo HTTPS endpoint.
"""
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
VALID_ISSUERS = ("accounts.google.com", "https://accounts.google.com")


def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Google ID token server-side via Google's tokeninfo endpoint.
    Returns token payload containing sub, email, name, etc.
    Raises AuthenticationFailed on verification error.
    """
    if not id_token or not isinstance(id_token, str):
        raise AuthenticationFailed("Google ID token is required.")

    # In test environment, allow mock tokens for deterministic testing
    if getattr(settings, "TESTING", False) or getattr(settings, "ENVIRONMENT", "") == "test" or os.getenv('PYTEST_CURRENT_TEST'):
        if id_token.startswith("mock_google_token:"):
            # Format: mock_google_token:<email>:<sub_id>
            parts = id_token.split(":")
            email = parts[1] if len(parts) > 1 else "test@example.com"
            sub = parts[2] if len(parts) > 2 else "mock_sub_123"
            return {
                "sub": sub,
                "email": email,
                "email_verified": "true",
                "name": "Mock User",
                "aud": getattr(settings, "GOOGLE_CLIENT_ID", ""),
                "iss": "https://accounts.google.com",
            }

    url = f"{GOOGLE_TOKENINFO_URL}?id_token={urllib.parse.quote(id_token)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "SchoolSaaS-Auth/1.0"},
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.warning(f"Google tokeninfo HTTP error: {e.code}")
        raise AuthenticationFailed("Invalid or expired Google ID token.")
    except Exception as e:
        logger.error(f"Google tokeninfo connection error: {str(e)}")
        raise AuthenticationFailed("Unable to verify Google credentials at this time.")

    # 1. Validate issuer
    if data.get("iss") not in VALID_ISSUERS:
        raise AuthenticationFailed("Google token issuer is invalid.")

    # 2. Validate audience if client ID is configured
    expected_aud = getattr(settings, "GOOGLE_CLIENT_ID", "")
    if expected_aud and data.get("aud") != expected_aud:
        raise AuthenticationFailed("Google token audience does not match.")

    # 3. Validate expiration
    exp = int(data.get("exp", 0))
    if exp < int(time.time()):
        raise AuthenticationFailed("Google token has expired.")

    # 4. Validate email verified
    email_verified = data.get("email_verified")
    if email_verified not in (True, "true", "True"):
        raise AuthenticationFailed("Google account email is not verified.")

    return data
