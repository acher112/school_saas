"""
Views for School registration, subdomain availability checks, and tenant-scoped resources.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.models import School, SchoolAnnouncement
from apps.core.serializers import (
    SchoolSerializer,
    SchoolSignupSerializer,
    SchoolAnnouncementSerializer
)
from apps.core.permissions import IsTenantMember, IsSchoolAdmin
from apps.core.context import get_current_school

class SchoolSignupView(APIView):
    """
    Public Endpoint: Onboards a new school, creates admin user, default campus, and issues JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SchoolSignupSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response({
                "success": True,
                "message": "School successfully registered and activated.",
                "data": result
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CheckSlugAvailabilityView(APIView):
    """
    Public Endpoint: Checks if a subdomain slug is available for school registration.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get('slug', '').strip().lower()
        if not slug:
            return Response({
                "success": False,
                "available": False,
                "message": "Subdomain slug parameter is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        is_reserved = slug in ('admin', 'api', 'www', 'app', 'portal', 'dashboard', 'root')
        exists = School.objects.filter(slug=slug).exists()
        is_available = not is_reserved and not exists

        return Response({
            "success": True,
            "slug": slug,
            "available": is_available,
            "message": "Subdomain is available" if is_available else "Subdomain is already taken or reserved."
        })

class CurrentSchoolView(APIView):
    """
    Endpoint: Returns details and dynamic branding for the currently resolved school tenant.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        school = getattr(request, 'school', None) or get_current_school()
        if not school:
            return Response({
                "success": False,
                "message": "No school tenant resolved for this request."
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = SchoolSerializer(school)
        return Response({
            "success": True,
            "data": serializer.data
        })

class SchoolAnnouncementListCreateView(generics.ListCreateAPIView):
    """
    Tenant-Scoped Resource Endpoint:
    Uses TenantManager automatically to ensure users only see announcements for their school.
    """
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        # Automatically scoped by TenantManager based on current_school context!
        return SchoolAnnouncement.objects.filter(is_published=True)

    def perform_create(self, serializer):
        # Only School Admin or Principal can create announcements
        if self.request.user.role not in ('school_admin', 'headmaster', 'superadmin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only school administrators can publish announcements.")
        serializer.save()
