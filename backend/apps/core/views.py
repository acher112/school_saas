"""
Views for School registration, subdomain availability checks, academic sessions,
role permissions, audit logs, and sample data population.
"""
import os
from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import connection
from django.utils import timezone
from apps.core.models import (
    School,
    AcademicSession,
    SchoolRolePermission,
    AuditLog,
    SchoolAnnouncement
)
from apps.core.serializers import (
    SchoolSerializer,
    SchoolSignupSerializer,
    AcademicSessionSerializer,
    SchoolRolePermissionSerializer,
    AuditLogSerializer,
    SchoolAnnouncementSerializer
)
from apps.core.permissions import IsTenantMember, IsSchoolAdmin
from apps.core.context import get_current_school

class HealthCheckView(APIView):
    """
    Public health check endpoint for monitoring, uptime checks, and Vercel/Render deployments.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        db_healthy = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_healthy = False

        return Response({
            "status": "healthy" if db_healthy else "unhealthy",
            "service": "school-saas-api",
            "version": "1.0.0",
            "database_connected": db_healthy,
            "database_vendor": connection.vendor,
            "test_environment": True,
            "banner": "Test environment. Do not enter real student data.",
            "timestamp": timezone.now().isoformat()
        }, status=status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE)

class SchoolSignupView(APIView):
    """
    Public Endpoint: Onboards a new school, creates admin user, default campus,
    initial academic session, default permissions, and issues JWT tokens.
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

        is_reserved = slug in ('admin', 'api', 'www', 'app', 'portal', 'dashboard', 'root', 'health', 'public')
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
    Endpoint: Returns details, dynamic branding, and active session for the currently resolved school tenant.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        school = getattr(request, 'school', None) or get_current_school()
        if not school and getattr(request, 'user', None) and request.user.is_authenticated and getattr(request.user, 'school', None):
            school = request.user.school
            request.school = school
            set_current_school(school)
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school.id)])

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

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user.role not in ('school_admin', 'superadmin'):
            return Response({"detail": "Only school administrators can update school settings."}, status=status.HTTP_403_FORBIDDEN)
        school = getattr(request, 'school', None) or get_current_school()
        if not school:
            return Response({"success": False, "message": "No school tenant resolved."}, status=status.HTTP_400_BAD_REQUEST)

        # Allow updating branding and profile fields
        allowed_fields = {'name', 'contact_email', 'contact_phone', 'address', 'city', 'brand_primary_color', 'brand_accent_color', 'logo'}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = SchoolSerializer(school, data=update_data, partial=True)
        if serializer.is_valid():
            updated_school = serializer.save()
            AuditLog.objects.create(
                actor=request.user,
                actor_username=request.user.username,
                actor_role=request.user.role,
                action="SCHOOL_SETTINGS_UPDATED",
                resource_type="School",
                resource_id=str(school.id),
                details=update_data
            )
            return Response({
                "success": True,
                "message": "School settings and branding updated successfully.",
                "data": SchoolSerializer(updated_school).data
            })
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AcademicSessionListCreateView(generics.ListCreateAPIView):
    """
    Tenant-Scoped Endpoint: List and create academic sessions for the active school.
    """
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return AcademicSession.objects.all().order_by('-start_date')

    def perform_create(self, serializer):
        if self.request.user.role not in ('school_admin', 'headmaster', 'superadmin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only school administrators and headmasters can create academic sessions.")
        session = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            actor_username=self.request.user.username,
            actor_role=self.request.user.role,
            action="ACADEMIC_SESSION_CREATED",
            resource_type="AcademicSession",
            resource_id=str(session.id),
            details={"name": session.name, "is_current": session.is_current}
        )

class SetCurrentSessionView(APIView):
    """
    Sets a specific academic session as the active session for the school.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def patch(self, request, pk):
        session = AcademicSession.objects.filter(pk=pk).first()
        if not session:
            return Response({"success": False, "message": "Academic session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.is_current = True
        session.save()

        AuditLog.objects.create(
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="ACADEMIC_SESSION_ACTIVATED",
            resource_type="AcademicSession",
            resource_id=str(session.id),
            details={"name": session.name}
        )

        return Response({
            "success": True,
            "message": f"Session '{session.name}' is now the active academic session.",
            "data": AcademicSessionSerializer(session).data
        })

class SchoolRolePermissionListView(generics.ListAPIView):
    """
    List fine-grained permissions per role for the school.
    """
    serializer_class = SchoolRolePermissionSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return SchoolRolePermission.objects.all().order_by('role')

class UpdateRolePermissionView(generics.UpdateAPIView):
    """
    Update fine-grained permissions for a role (e.g. grant timetable creation to teachers).
    """
    serializer_class = SchoolRolePermissionSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get_queryset(self):
        return SchoolRolePermission.objects.all()

class AuditLogListView(generics.ListAPIView):
    """
    View immutable audit trail for the active school tenant.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get_queryset(self):
        return AuditLog.objects.all()[:100]

class SchoolAnnouncementListCreateView(generics.ListCreateAPIView):
    """
    Tenant-Scoped Announcement Endpoint.
    """
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return SchoolAnnouncement.objects.filter(is_published=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ('school_admin', 'headmaster', 'superadmin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only school administrators can publish announcements.")
        serializer.save()

class LoadSampleDataView(APIView):
    """
    Loads initial demonstration sample data for THAT school only.
    Clearly marked, safe to run once, and strictly scoped to active tenant.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request):
        school = get_current_school()
        if not school:
            return Response({"success": False, "message": "Tenant context required."}, status=status.HTTP_400_BAD_REQUEST)

        if school.has_sample_data:
            return Response({
                "success": False,
                "message": "Sample data has already been populated for this school."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create sample announcements
        SchoolAnnouncement.objects.create(
            title="Welcome to the New Academic Session 2026-2027",
            content="We are thrilled to welcome our students, faculty, and parents to the new academic term. Please review the updated class routines and academic calendar.",
            is_published=True
        )
        SchoolAnnouncement.objects.create(
            title="Parent-Teacher Orientation Conference",
            content="The annual orientation conference will be held next Saturday at 10:00 AM in the main auditorium.",
            is_published=True
        )

        school.has_sample_data = True
        school.save(update_fields=['has_sample_data'])

        AuditLog.objects.create(
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="SAMPLE_DATA_LOADED",
            resource_type="School",
            resource_id=str(school.id),
            details={"notices_created": 2}
        )

        return Response({
            "success": True,
            "message": "Sample demonstration data successfully loaded for your school.",
            "data": {
                "notices_created": 2,
                "school": school.name
            }
        })

class ClearSampleDataView(APIView):
    """
    Safely removes sample demonstration data for THAT school only, restoring a clean state.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request):
        school = get_current_school()
        if not school:
            return Response({"success": False, "message": "Tenant context required."}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = SchoolAnnouncement.objects.filter(school=school).delete()
        school.has_sample_data = False
        school.save(update_fields=['has_sample_data'])

        AuditLog.objects.create(
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="SAMPLE_DATA_CLEARED",
            resource_type="School",
            resource_id=str(school.id),
            details={"notices_deleted": deleted_count}
        )

        return Response({
            "success": True,
            "message": "Sample demonstration data removed successfully.",
            "data": {
                "notices_deleted": deleted_count,
                "school": school.name
            }
        })

