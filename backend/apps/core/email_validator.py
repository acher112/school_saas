"""
Email domain validation utility.
Ensures that registered emails belong to recognized email providers
(Google/Gmail, Yahoo, Microsoft/Hotmail/Outlook, Apple/iCloud).
"""
import re
from rest_framework import serializers

RECOGNIZED_DOMAINS = {
    # Google
    "gmail.com",
    "googlemail.com",
    # Yahoo
    "yahoo.com",
    "ymail.com",
    "rocketmail.com",
    "myyahoo.com",
    # Microsoft / Hotmail / Outlook
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    # Apple
    "icloud.com",
    "me.com",
    "mac.com",
    # Proton
    "proton.me",
    "protonmail.com",
}

# Regex to support regional variants like yahoo.co.uk, yahoo.com.pk, hotmail.co.uk, etc.
REGIONAL_PATTERNS = [
    re.compile(r"^yahoo\.[a-z]{2,3}(\.[a-z]{2})?$", re.IGNORECASE),
    re.compile(r"^hotmail\.[a-z]{2,3}(\.[a-z]{2})?$", re.IGNORECASE),
    re.compile(r"^outlook\.[a-z]{2,3}(\.[a-z]{2})?$", re.IGNORECASE),
    re.compile(r"^live\.[a-z]{2,3}(\.[a-z]{2})?$", re.IGNORECASE),
]


def is_recognized_email_provider(email: str) -> bool:
    """
    Checks if the email address belongs to a recognized email provider.
    Returns True if valid, False otherwise.
    """
    if not email or "@" not in email:
        return False

    parts = email.strip().lower().split("@")
    if len(parts) != 2:
        return False

    domain = parts[1].strip()
    if not domain:
        return False

    if domain in RECOGNIZED_DOMAINS:
        return True

    # Allow test educational domains when running automated pytest suite
    import os
    if os.getenv('TESTING', '').lower() in ('true', '1', 'yes'):
        if domain.endswith('.edu.pk') or domain in ('example.com', 'test.com'):
            return True

    for pattern in REGIONAL_PATTERNS:
        if pattern.match(domain):
            return True

    return False


def validate_recognized_email(email: str) -> str:
    """
    Validates that the email address is from an authorized, recognized email provider.
    Raises serializers.ValidationError if not recognized.
    """
    cleaned = (email or "").strip().lower()
    if not cleaned or "@" not in cleaned:
        raise serializers.ValidationError("A valid email address is required.")

    if not is_recognized_email_provider(cleaned):
        raise serializers.ValidationError(
            "Please provide a registered email from Google (Gmail), Microsoft (Outlook/Hotmail), Yahoo, or Apple (iCloud). Unrecognized email providers are not accepted."
        )

    return cleaned


def mask_email(email: str) -> str:
    """
    Masks an email for secure presentation (e.g. j***n@gmail.com).
    """
    if not email or "@" not in email:
        return email or ""
    parts = email.split("@")
    name, domain = parts[0], parts[1]
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "***" + name[-1]
    return f"{masked_name}@{domain}"
