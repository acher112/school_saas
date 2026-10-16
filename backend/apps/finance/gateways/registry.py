"""
Payment Gateway Registry and Factory.
"""
from typing import Dict, Any, Type
from .base import PaymentGatewayInterface
from .jazzcash import JazzCashGateway
from .easypaisa import EasypaisaGateway
from .safepay import SafepayGateway
from .payfast import PayFastGateway

GATEWAY_REGISTRY: Dict[str, Type[PaymentGatewayInterface]] = {
    'jazzcash': JazzCashGateway,
    'easypaisa': EasypaisaGateway,
    'safepay': SafepayGateway,
    'payfast': PayFastGateway,
}

def get_payment_gateway(gateway_type: str, config: Dict[str, Any], is_sandbox: bool = True) -> PaymentGatewayInterface:
    """
    Returns an instantiated PaymentGatewayInterface for the given gateway type.
    """
    gateway_cls = GATEWAY_REGISTRY.get(gateway_type.lower())
    if not gateway_cls:
        raise ValueError(f"Unsupported payment gateway: '{gateway_type}'. Supported: {list(GATEWAY_REGISTRY.keys())}")
    return gateway_cls(config=config, is_sandbox=is_sandbox)
