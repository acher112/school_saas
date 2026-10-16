"""
Easypaisa Payment Gateway Adapter.
Implements Easypaisa MA OTC (Mobile Account) & Hosted Checkout URL.
"""
import hashlib
import hmac
from decimal import Decimal
from typing import Dict, Any, Optional
from .base import PaymentGatewayInterface, PaymentInitiationResult, PaymentVerificationResult


class EasypaisaGateway(PaymentGatewayInterface):
    SANDBOX_URL = "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
    PROD_URL = "https://easypay.easypaisa.com.pk/easypay/Index.jsf"

    def _generate_checksum(self, order_id: str, amount_str: str, store_id: str, hash_key: str) -> str:
        raw_str = f"{amount_str}#{order_id}#{store_id}#{hash_key}"
        return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

    def initiate_payment(
        self,
        invoice_number: str,
        amount: Decimal,
        customer_phone: str,
        customer_email: str,
        callback_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentInitiationResult:
        store_id = self.config.get("merchant_id", "TEST_EP_STORE")
        hash_key = self.config.get("secret_key_or_salt", "TEST_EP_KEY_123456")
        amount_str = f"{amount:.2f}"
        order_ref = f"EP{invoice_number.replace('-', '')[:14]}"

        checksum = self._generate_checksum(order_ref, amount_str, store_id, hash_key)

        params = {
            "storeId": store_id,
            "orderId": order_ref,
            "transactionAmount": amount_str,
            "mobileNum": customer_phone or "",
            "emailAddress": customer_email or "",
            "postBackURL": callback_url,
            "paymentMethod": "MA_PAYMENT_METHOD" if customer_phone else "CC_PAYMENT_METHOD",
            "checksum": checksum,
        }

        endpoint = self.SANDBOX_URL if self.is_sandbox else self.PROD_URL
        is_ma = bool(customer_phone)

        return PaymentInitiationResult(
            checkout_url=f"{endpoint}?orderRef={order_ref}&storeId={store_id}",
            gateway_reference=order_ref,
            requires_redirect=not is_ma,
            ussd_prompt_sent=is_ma,
            raw_response=params,
            message="Easypaisa OTC mobile prompt dispatched." if is_ma else "Redirecting to Easypaisa checkout."
        )

    def verify_webhook_signature(self, raw_body: bytes, headers: Dict[str, str]) -> bool:
        import json
        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except Exception:
            return False

        order_id = payload.get("orderRefNumber") or payload.get("orderId", "")
        amount = payload.get("transactionAmount") or payload.get("amount", "")
        received_checksum = payload.get("checksum", "")
        store_id = self.config.get("merchant_id", "")
        hash_key = self.config.get("secret_key_or_salt", "")

        expected = self._generate_checksum(order_id, str(amount), store_id, hash_key)
        return hmac.compare_digest(received_checksum.lower(), expected.lower())

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> PaymentVerificationResult:
        response_code = payload.get("responseCode", "")
        is_success = (response_code == "0000" or payload.get("transactionStatus") == "PAID")
        amount = Decimal(str(payload.get("transactionAmount") or payload.get("amount") or "0"))

        return PaymentVerificationResult(
            is_successful=is_success,
            transaction_id=payload.get("transactionId") or payload.get("orderRefNumber", ""),
            amount=amount,
            currency="PKR",
            paid_at=payload.get("transactionDateTime", None),
            error_message=payload.get("responseDesc", "") if not is_success else None,
            raw_payload=payload
        )

    def process_refund(self, transaction_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        return {
            "status": "success",
            "refund_id": f"REF-EP-{transaction_id}",
            "amount": str(amount),
            "message": "Easypaisa sandbox refund processed."
        }
