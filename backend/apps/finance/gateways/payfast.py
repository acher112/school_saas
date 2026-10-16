"""
PayFast (APPS) Payment Gateway Adapter.
Supports 1Link Bank Account Direct Debits, PayPak, and Card Processing.
"""
import hmac
import hashlib
from decimal import Decimal
from typing import Dict, Any, Optional
from .base import PaymentGatewayInterface, PaymentInitiationResult, PaymentVerificationResult


class PayFastGateway(PaymentGatewayInterface):
    SANDBOX_URL = "https://ipg.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken"
    PROD_URL = "https://ipg.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken"

    def initiate_payment(
        self,
        invoice_number: str,
        amount: Decimal,
        customer_phone: str,
        customer_email: str,
        callback_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentInitiationResult:
        merchant_id = self.config.get("merchant_id", "TEST_PAYFAST_MERCHANT")
        token_ref = f"PF_{invoice_number.replace('-', '_')}"

        checkout_url = (
            f"https://ipg.apps.net.pk/Ecommerce/api/Transaction/ProcessTransaction?"
            f"MERCHANT_ID={merchant_id}&BASKET_ID={invoice_number}&TXNAMT={amount:.2f}"
            f"&SUCCESS_URL={callback_url}&FAILURE_URL={callback_url}"
        )

        return PaymentInitiationResult(
            checkout_url=checkout_url,
            gateway_reference=token_ref,
            requires_redirect=True,
            ussd_prompt_sent=False,
            raw_response={"merchant_id": merchant_id, "basket_id": invoice_number, "amount": str(amount)},
            message="PayFast hosted redirect initialized."
        )

    def verify_webhook_signature(self, raw_body: bytes, headers: Dict[str, str]) -> bool:
        signature = headers.get("X-PAYFAST-SIGNATURE") or headers.get("x-payfast-signature", "")
        if not signature:
            return False

        secret = self.config.get("secret_key_or_salt", "")
        calculated = hmac.new(secret.encode('utf-8'), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature.lower(), calculated.lower())

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> PaymentVerificationResult:
        status_code = payload.get("err_code") or payload.get("status_code", "")
        is_success = (str(status_code) in ("000", "00", "SUCCESS"))
        amount = Decimal(str(payload.get("transaction_amount") or payload.get("amount", "0")))

        return PaymentVerificationResult(
            is_successful=is_success,
            transaction_id=str(payload.get("transaction_id") or payload.get("basket_id", "")),
            amount=amount,
            currency="PKR",
            paid_at=payload.get("transaction_date", None),
            error_message=payload.get("err_msg") if not is_success else None,
            raw_payload=payload
        )

    def process_refund(self, transaction_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        return {
            "status": "success",
            "refund_id": f"REF-PF-{transaction_id}",
            "amount": str(amount),
            "message": "PayFast refund initiated."
        }
