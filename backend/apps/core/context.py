"""
Thread-safe and async-safe execution context for multi-tenancy.
Uses Python 3.7+ contextvars to bind the active School tenant to the current request/task.
"""
import contextvars
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from apps.core.models import School

_current_school: contextvars.ContextVar[Optional['School']] = contextvars.ContextVar(
    'current_school', default=None
)

def get_current_school() -> Optional['School']:
    """Retrieve the active School tenant for the current request thread/task."""
    return _current_school.get()

def set_current_school(school: Optional['School']) -> None:
    """Bind a School tenant to the current request thread/task context."""
    _current_school.set(school)

def clear_current_school() -> None:
    """Clear the active School tenant context."""
    _current_school.set(None)
