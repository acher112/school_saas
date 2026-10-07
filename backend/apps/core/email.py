"""
Email service provider interface and implementations.
Zero third-party library dependencies (uses Python urllib for HTTPS requests).
"""
import json
import logging
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


class BaseEmailProvider(ABC):
    """Abstract base class for email delivery."""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        text_content: str,
        html_content: Optional[str] = None,
    ) -> bool:
        """Send an email to a single recipient. Returns True if accepted, False otherwise."""
        pass


class ConsoleEmailProvider(BaseEmailProvider):
    """
    Console email provider for development and testing.
    Records sent emails in an in-memory outbox for test assertion.
    Never logs secret codes in production environment.
    """

    outbox = []

    def send_email(
        self,
        to_email: str,
        subject: str,
        text_content: str,
        html_content: Optional[str] = None,
    ) -> bool:
        record = {
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }
        self.outbox.append(record)

        if getattr(settings, "DEBUG", False):
            logger.info(
                f"[EMAIL] To: {to_email} | Subject: {subject}\n{text_content}"
            )
        else:
            # Production safeguard: do not log email body containing OTPs/tokens
            logger.info(f"[EMAIL] To: {to_email} | Subject: {subject} (body omitted in prod)")

        return True


class ResendEmailProvider(BaseEmailProvider):
    """
    Resend email provider using standard Python urllib HTTPS requests.
    Zero external dependencies required.
    """

    RESEND_API_URL = "https://api.resend.com/emails"

    def __init__(self, api_key: Optional[str] = None, from_email: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "EMAIL_API_KEY", "")
        self.from_email = from_email or getattr(settings, "EMAIL_FROM", "onboarding@resend.dev")

    def send_email(
        self,
        to_email: str,
        subject: str,
        text_content: str,
        html_content: Optional[str] = None,
    ) -> bool:
        if not self.api_key:
            logger.error("ResendEmailProvider: EMAIL_API_KEY is not configured.")
            return False

        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "text": text_content,
        }
        if html_content:
            payload["html"] = html_content

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.RESEND_API_URL,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "SchoolSaaS-Email/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if 200 <= resp.status < 300:
                    return True
                logger.warning(f"Resend API returned status {resp.status}")
                return False
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                err_body = str(e)
            logger.error(f"Resend API HTTP error {e.code}: {err_body}")
            return False
        except Exception as e:
            logger.error(f"Resend API connection error: {str(e)}")
            return False


def get_email_provider() -> BaseEmailProvider:
    """Factory returning configured email provider."""
    provider_name = getattr(settings, "EMAIL_PROVIDER", "console").lower()
    api_key = getattr(settings, "EMAIL_API_KEY", "")
    if provider_name == "resend" and api_key:
        return ResendEmailProvider()
    return ConsoleEmailProvider()
