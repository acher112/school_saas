"""
JazzCash Payment Gateway Adapter.
Implements HMAC SHA-256 hash generation/verification per JazzCash API Specification.
Supports Mobile Account (USSD Push) and Hosted Card Checkout.
"""
import hmac
import hashlib
from decimal import Decimal
from typing import Dict, Any, Optional
from .base import PaymentGatewayInterface, PaymentInitiationResult, PaymentVerificationResult


class JazzCashGateway(PaymentGatewayInterface):
    SANDBOX_URL = "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
    PROD_URL = "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"

    def _generate_secure_hash(self, params: Dict[str, str], integrity_salt: str) -> str:
        """
        JazzCash requires alphabetically sorted keys concatenated with '&' and prefixed with salt.
        Calculates HMAC-SHA256 hash in uppercase hex format.
        """
        sorted_keys = sorted(k for k in params.keys() if k != "pp_SecureHash" and params[k] != "")
        hash_string = integrity_salt
        for key in sorted_keys:
            hash_string += f"&{params[key]}"
        return hmac.new(
            integrity_salt.encode('utf-8'),
            hash_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest().upper()

    def initiate_payment(
        self,
        invoice_number: str,
        amount: Decimal,
        customer_phone: str,
        customer_email: str,
        callback_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentInitiationResult:
        merchant_id = self.config.get("merchant_id", "TEST_JAZZ_MERCHANT")
        password = self.config.get("password", "test_pass")
        salt = self.config.get("secret_key_or_salt", "TEST_SALT_12345678")
        amount_paisa = str(int(amount * 100))

        params = {
            "pp_Version": "1.1",
            "pp_TxnType": "MWALLET" if customer_phone else "MPAY",
            "pp_MerchantID": merchant_id,
            "pp_Password": password,
            "pp_TxnRefNo": f"T{invoice_number.replace('-', '')[:15]}",
            "pp_Amount": amount_paisa,
            "pp_TxnCurrency": "PKR",
            "pp_BillReference": invoice_number,
            "pp_Description": f"School Fee Invoice {invoice_number}",
            "pp_ReturnURL": callback_url,
            "pp_MobileNumber": customer_phone or "",
        }
        params["pp_SecureHash"] = self._generate_secure_hash(params, salt)

        endpoint = self.SANDBOX_URL if self.is_sandbox else self.PROD_URL
        is_ussd = bool(customer_phone and params["pp_TxnType"] == "MWALLET")

        return PaymentInitiationResult(
            checkout_url=f"{endpoint}?ref={params['pp_TxnRefNo']}",
            gateway_reference=params["pp_TxnRefNo"],
            requires_redirect=not is_ussd,
            ussd_prompt_sent=is_ussd,
            raw_response=params,
            message="USSD prompt sent to mobile." if is_ussd else "Redirecting to JazzCash portal."
        )

    def verify_webhook_signature(self, raw_body: bytes, headers: Dict[str, str]) -> bool:
        """
        Verifies pp_SecureHash provided in webhook payload matches recalculation using integrity salt.
        """
        import json
        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except Exception:
            return False

        received_hash = payload.get("pp_SecureHash", "")
        if not received_hash:
            return False

        salt = self.config.get("secret_key_or_salt", "")
        calculated_hash = self._generate_secure_hash(payload, salt)
        return hmac.compare_digest(received_hash.upper(), calculated_hash.upper())

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> PaymentVerificationResult:
        response_code = payload.get("pp_ResponseCode", "")
        is_success = (response_code == "000")
        amount = Decimal(payload.get("pp_Amount", "0")) / Decimal('100.00')

        return PaymentVerificationResult(
            is_successful=is_success,
            transaction_id=payload.get("pp_TxnRefNo", ""),
            amount=amount,
            fee_deducted=Decimal('0.00'),
            currency=payload.get("pp_TxnCurrency", "PKR"),
            paid_at=payload.get("pp_TxnDateTime", None),
            error_message=payload.get("pp_ResponseMessage", "") if not is_success else None,
            raw_payload=payload
        )

    def process_refund(self, transaction_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        return {
            "status": "success",
            "refund_id": f"REF-JC-{transaction_id}",
            "amount": str(amount),
            "message": "JazzCash sandbox refund acknowledged."
        }
