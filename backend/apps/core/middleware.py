"""
Middleware for resolving and binding tenant context to HTTP requests and database sessions.
"""
from django.http import JsonResponse
from django.db import connection
from apps.core.models import School, Domain
from apps.core.context import set_current_school, clear_current_school

class TenantContextMiddleware:
    """
    Resolves the active School tenant from the incoming request hostname or header.
    Binds the school to thread-safe contextvars and sets PostgreSQL RLS session variables.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Skip tenant resolution for global platform / un-tenant routes
        path = request.path
        if (
            path.startswith('/admin/') or
            path.startswith('/health/') or
            path.startswith('/api/v1/core/signup/')
        ):
            clear_current_school()
            request.school = None
            return self.get_response(request)

        # 2. Resolve School
        school = self.resolve_school(request)

        if not school:
            # Allow public requests to pass through without tenant context if not strictly required
            clear_current_school()
            request.school = None
            return self.get_response(request)

        if not school.is_active:
            return JsonResponse({
                "type": "https://schoolsaas.com/errors/tenant-inactive",
                "title": "School Suspended",
                "status": 403,
                "detail": "This school account is currently inactive or suspended."
            }, status=403)

        # 3. Bind context
        set_current_school(school)
        request.school = school

        # 4. Bind to PostgreSQL RLS session variable if using PostgreSQL
        if connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school.id)])

        try:
            response = self.get_response(request)
        finally:
            clear_current_school()

        return response

    def resolve_school(self, request):
        """
        Multi-step tenant resolution strategy:
        1. Explicit 'X-School-Slug' HTTP Header (standard for mobile apps and programmatic API calls)
        2. Subdomain lookup (e.g. 'beacon' from 'beacon.myschoolsaas.com')
        3. Custom vanity domain lookup in Domain model
        """
        # Step 1: Check HTTP Header
        header_slug = request.headers.get('X-School-Slug')
        if header_slug:
            return School.objects.filter(slug=header_slug.strip().lower()).first()

        # Step 2: Host header parsing
        host = request.get_host().split(':')[0].lower()

        # Check custom domain first
        domain_match = Domain.objects.filter(domain=host).select_related('school').first()
        if domain_match:
            return domain_match.school

        # Check subdomain
        parts = host.split('.')
        if len(parts) >= 3:
            subdomain = parts[0]
            if subdomain not in ('www', 'app', 'api', 'admin'):
                return School.objects.filter(slug=subdomain).first()

        return None
