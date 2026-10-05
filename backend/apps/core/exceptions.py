"""
RFC 7807 Problem Details compliant exception handler for Django REST Framework.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    """
    Transforms DRF exceptions into standard RFC 7807 problem details envelopes.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "status": response.status_code,
            "title": getattr(exc, 'default_code', 'Error'),
            "detail": getattr(exc, 'detail', str(exc)),
            "errors": response.data if isinstance(response.data, (dict, list)) else {"detail": str(response.data)}
        }
        response.data = custom_data

    return response
