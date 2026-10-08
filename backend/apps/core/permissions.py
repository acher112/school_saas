"""
Permission classes for role-based and tenant-scoped authorization.
"""
from rest_framework.permissions import BasePermission
from apps.core.context import get_current_school

class IsTenantMember(BasePermission):
    """
    Guarantees that the authenticated user belongs to the active tenant.
    Prevents cross-tenant token replay or header forgery attacks.
    """
    message = "Access denied: You do not have permission to access resources in this school."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        current_school = getattr(request, 'school', None) or get_current_school()
        if not current_school and getattr(user, 'school', None):
            current_school = user.school
            request.school = user.school
            from apps.core.context import set_current_school
            set_current_school(user.school)
            from django.db import connection
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(user.school.id)])

        if not current_school:
            # If no school context is resolved, deny access to tenant-scoped endpoints
            return False

        return user.school_id == current_school.id

class HasRole(BasePermission):
    """
    Factory permission checking if the user possesses one of the allowed roles.
    """
    def __init__(self, allowed_roles):
        self.allowed_roles = set(allowed_roles)

    def __call__(self):
        return self

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.role in self.allowed_roles

class IsSchoolAdmin(BasePermission):
    """Allows access only to school administrator users within their tenant."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.role in ('school_admin', 'headmaster'))
        )

class IsHeadmaster(BasePermission):
    """Allows access only to headmaster / principal users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.role in ('headmaster', 'school_admin'))
        )

class IsTeacher(BasePermission):
    """Allows access to teacher users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.role in ('teacher', 'headmaster', 'school_admin'))
        )

class IsStudent(BasePermission):
    """Allows access to student users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )

class IsParent(BasePermission):
    """Allows access to parent / guardian users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'parent'
        )
