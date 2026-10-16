"""
Pluggable Payment Gateway Interface and Data Transfer Objects.
Supports Pakistani gateways: JazzCash, Easypaisa, Safepay, and PayFast.
"""
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class PaymentInitiationResult:
    """
    Result returned when initiating an online payment transaction.
    """
    checkout_url: Optional[str] = None
    gateway_reference: str = ""
    requires_redirect: bool = False
    ussd_prompt_sent: bool = False
    raw_response: Dict[str, Any] = field(default_factory=dict)
    message: str = "Payment initiated successfully."


@dataclass
class PaymentVerificationResult:
    """
    Normalized result after webhook signature verification or callback inquiry.
    """
    is_successful: bool
    transaction_id: str
    amount: Decimal
    fee_deducted: Decimal = Decimal('0.00')
    currency: str = "PKR"
    paid_at: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)


class PaymentGatewayInterface(ABC):
    """
    Standard interface that all payment gateways must implement.
    Allows dynamic plug-and-play swapping per school without modifying core invoicing code.
    """

    def __init__(self, config: Dict[str, Any], is_sandbox: bool = True):
        self.config = config
        self.is_sandbox = is_sandbox

    @abstractmethod
    def initiate_payment(
        self,
        invoice_number: str,
        amount: Decimal,
        customer_phone: str,
        customer_email: str,
        callback_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentInitiationResult:
        """
        Generates checkout session, hosted link, or triggers a mobile USSD / MA OTC prompt.
        """
        pass

    @abstractmethod
    def verify_webhook_signature(self, raw_body: bytes, headers: Dict[str, str]) -> bool:
        """
        Validates cryptographic HMAC signature or checksum of incoming webhook.
        """
        pass

    @abstractmethod
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> PaymentVerificationResult:
        """
        Normalizes gateway-specific webhook payload into a standardized PaymentVerificationResult.
        """
        pass

    @abstractmethod
    def process_refund(self, transaction_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        """
        Issues partial or full refund for an existing settled transaction.
        """
        pass
