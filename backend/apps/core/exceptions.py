import logging
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Transforms DRF and unhandled exceptions into friendly, human-readable JSON envelopes.
    Guarantees no raw developer crash dumps or empty 500 errors reach non-programmers.
    """
    response = exception_handler(exc, context)

    if response is not None:
        detail_msg = getattr(exc, 'detail', str(exc))
        if isinstance(detail_msg, (list, tuple)) and len(detail_msg) > 0:
            detail_msg = str(detail_msg[0])
        elif isinstance(detail_msg, dict):
            first_val = next(iter(detail_msg.values()), str(detail_msg))
            detail_msg = str(first_val[0]) if isinstance(first_val, list) and len(first_val) > 0 else str(first_val)

        custom_data = {
            "success": False,
            "status": response.status_code,
            "title": str(getattr(exc, 'default_code', 'Error')),
            "message": str(detail_msg),
            "detail": str(detail_msg),
            "errors": response.data if isinstance(response.data, (dict, list)) else {"detail": str(response.data)}
        }
        response.data = custom_data
        return response

    # Catch unhandled exceptions (HTTP 500)
    logger.exception(f"Unhandled exception in request {context.get('request', '')}: {str(exc)}", exc_info=exc)
    return Response({
        "success": False,
        "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "title": "ServerError",
        "message": "Our server encountered a temporary issue. Please verify your school code and credentials, or try again in a few moments.",
        "detail": "Our server encountered a temporary issue. Please verify your school code and credentials, or try again in a few moments."
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
