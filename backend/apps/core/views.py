"""
Views for School registration, subdomain availability checks, academic sessions,
role permissions, audit logs, and sample data population.
"""
import os
from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from django.db import connection, transaction, models
from django.db.models import Q
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
    Public Endpoint: Onboards a new school.
    If email verification is enabled, validates credentials, creates a registration draft,
    and dispatches a 6-digit confirmation code to the administrator's email.
    Otherwise, provisions the school immediately.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        is_testing = getattr(settings, 'TESTING', False) or os.getenv('TESTING', '').lower() in ('true', '1', 'yes')
        require_verification = getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', True)
        if require_verification and not is_testing:
            from apps.core.views_signup import SchoolSignupWizardView
            return SchoolSignupWizardView().post(request)

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
        if request.user.role not in ('owner', 'org_admin', 'school_admin', 'superadmin', 'platform_admin'):
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
        if self.request.user.role not in ('owner', 'org_admin', 'principal', 'school_admin', 'headmaster', 'superadmin', 'platform_admin'):
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
    Enforces that locked capabilities cannot be overridden, role ceilings are respected,
    and all modifications write an immutable AuditLog entry.
    """
    serializer_class = SchoolRolePermissionSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get_queryset(self):
        return SchoolRolePermission.objects.all()

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        from apps.core.policy import LOCKED_CAPABILITIES, ROLE_CEILINGS
        from apps.core.models import AuditLog
        instance = serializer.instance
        overrides = serializer.validated_data.get('custom_overrides', {})

        # Validate that locked capabilities are never overridden
        for cap, val in overrides.items():
            if cap in LOCKED_CAPABILITIES:
                raise ValidationError({"custom_overrides": f"Capability '{cap}' is immutable and locked by platform security policy."})
            role_allowed = ROLE_CEILINGS.get(instance.role, set())
            if val is True and cap not in role_allowed:
                raise ValidationError({"custom_overrides": f"Capability '{cap}' exceeds the maximum rank ceiling for role '{instance.role}'."})

        updated = serializer.save()
        AuditLog.objects.create(
            school=instance.school,
            actor=self.request.user,
            actor_username=self.request.user.username,
            actor_role=self.request.user.role,
            action="ROLE_PERMISSIONS_UPDATED",
            resource_type="SchoolRolePermission",
            resource_id=str(instance.id),
            details={
                "role": instance.role,
                "custom_overrides": instance.custom_overrides,
            },
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class AuditLogListView(generics.ListAPIView):
    """
    View immutable audit trail for the active school tenant with robust filtering:
    - user: filter by actor username
    - action: filter by action keyword
    - date / start_date / end_date: filter by date range
    - Never exposes passwords or sensitive credentials.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get_queryset(self):
        school = getattr(self.request, 'school', None) or getattr(self.request.user, 'school', None)
        qs = AuditLog.objects.filter(school=school).order_by('-created_at')

        user_param = self.request.query_params.get('user') or self.request.query_params.get('actor')
        if user_param:
            qs = qs.filter(actor_username__icontains=user_param.strip())

        action_param = self.request.query_params.get('action')
        if action_param:
            qs = qs.filter(action__icontains=action_param.strip())

        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(created_at__date=date_param)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)

        return qs[:250]

class SchoolAnnouncementListCreateView(generics.ListCreateAPIView):
    """
    Tenant-Scoped Announcement Endpoint.
    """
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return SchoolAnnouncement.objects.filter(is_published=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ('owner', 'org_admin', 'principal', 'school_admin', 'headmaster', 'superadmin', 'platform_admin'):
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



from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.core.serializers import CampusSerializer
from apps.core.models import Campus
from apps.authentication.models import User, UserRole, StudentProfile, StaffProfile, ParentStudentRelation
from apps.core.policy import (
    CAPABILITIES,
    DEFAULT_ROLE_CAPABILITIES,
    ROLE_RANKS,
    ROLE_CEILINGS,
    LOCKED_CAPABILITIES,
    has_capability,
    generate_permission_matrix_markdown,
)


class CampusViewSet(viewsets.ModelViewSet):
    """
    Tenant-Scoped Campus / Branch Management.
    Enforces that:
    - Owners & Org Admins can view, create, update, and soft-deactivate any campus in their school.
    - Principals can view their assigned campus and update their own campus contact info, but CANNOT modify other campuses (Anti-tampering check).
    - Teachers / Students / Parents have read-only access to their assigned campus.
    - Deletion is soft-deactivation (is_active=False); hard DELETE is prevented.
    """
    serializer_class = CampusSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        school = getattr(self.request, 'school', None) or getattr(self.request.user, 'school', None)
        user = self.request.user
        qs = Campus.objects.filter(school=school)

        if not self.request.query_params.get('all', '').lower() in ('true', '1'):
            qs = qs.filter(is_active=True)

        if user.role in [UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PLATFORM_ADMIN]:
            return qs.order_by('-is_main', 'name')

        if user.role == UserRole.PRINCIPAL:
            assigned = user.assigned_campuses.all()
            if user.primary_campus:
                assigned = (assigned | Campus.objects.filter(id=user.primary_campus_id)).distinct()
            return qs.filter(id__in=assigned).order_by('-is_main', 'name')

        assigned = user.assigned_campuses.all()
        if user.primary_campus:
            assigned = (assigned | Campus.objects.filter(id=user.primary_campus_id)).distinct()
        return qs.filter(id__in=assigned)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in [UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PLATFORM_ADMIN]:
            raise PermissionDenied("Only an organization owner or administrator can add new branches.")
        school = getattr(self.request, 'school', None) or getattr(user, 'school', None)
        campus = serializer.save(school=school)
        if school and school.campuses.count() > 1 and not school.is_multi_branch:
            school.is_multi_branch = True
            school.save(update_fields=['is_multi_branch'])

        AuditLog.objects.create(
            school=school,
            actor=user,
            actor_username=user.username,
            actor_role=user.role,
            action="CAMPUS_CREATED",
            resource_type="Campus",
            resource_id=str(campus.id),
            details={"name": campus.name, "code": campus.code, "city": campus.city}
        )

    def perform_update(self, serializer):
        user = self.request.user
        campus = self.get_object()
        # Campus Anti-Tampering Check:
        if user.role == UserRole.PRINCIPAL:
            primary_id = getattr(user, 'primary_campus_id', None)
            is_assigned = user.assigned_campuses.filter(id=campus.id).exists()
            if campus.id != primary_id and not is_assigned:
                raise PermissionDenied("Access denied: You cannot modify a campus you are not assigned to.")
        elif user.role not in [UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PLATFORM_ADMIN]:
            raise PermissionDenied("Access denied: Insufficient permissions to edit branch settings.")

        updated_campus = serializer.save()
        AuditLog.objects.create(
            school=campus.school,
            actor=user,
            actor_username=user.username,
            actor_role=user.role,
            action="CAMPUS_UPDATED",
            resource_type="Campus",
            resource_id=str(updated_campus.id),
            details={"name": updated_campus.name, "is_active": updated_campus.is_active}
        )

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role not in [UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PLATFORM_ADMIN]:
            raise PermissionDenied("Only an owner or administrator can deactivate branches.")
        if instance.is_main:
            other_active = Campus.objects.filter(school=instance.school, is_active=True).exclude(id=instance.id).exists()
            if not other_active:
                raise ValidationError("Cannot deactivate the sole main campus of the organization.")

        instance.is_active = False
        instance.save(update_fields=['is_active'])

        AuditLog.objects.create(
            school=instance.school,
            actor=user,
            actor_username=user.username,
            actor_role=user.role,
            action="CAMPUS_DEACTIVATED",
            resource_type="Campus",
            resource_id=str(instance.id),
            details={"name": instance.name, "code": instance.code}
        )

    @action(detail=False, methods=['post'], url_path='toggle-multi-branch')
    def toggle_multi_branch(self, request):
        user = request.user
        if user.role not in [UserRole.OWNER, UserRole.PLATFORM_ADMIN]:
            raise PermissionDenied("Only an organization owner can change multi-branch settings.")
        school = getattr(request, 'school', None) or getattr(user, 'school', None)
        enable = request.data.get('is_multi_branch')
        if enable is None:
            enable = not school.is_multi_branch
        school.is_multi_branch = bool(enable)
        school.save(update_fields=['is_multi_branch'])

        AuditLog.objects.create(
            school=school,
            actor=user,
            actor_username=user.username,
            actor_role=user.role,
            action="MULTI_BRANCH_TOGGLED",
            resource_type="School",
            resource_id=str(school.id),
            details={"is_multi_branch": school.is_multi_branch}
        )
        return Response({
            "success": True,
            "is_multi_branch": school.is_multi_branch,
            "message": f"Multi-branch mode {'enabled' if school.is_multi_branch else 'disabled'} successfully."
        })


class AdminDashboardStatsView(APIView):
    """
    Consolidated Executive Admin Dashboard Analytics:
    1. 11-Step Setup Checklist progress (Spec Section 6)
    2. Campuses overview
    3. People counts by role with optional campus filter
    4. Organization AQI with 'No academic data yet' clean state
    5. Today's attendance rate
    6. Action alerts (unverified staff, temporary passwords, locked accounts)
    7. Recent security audit events
    8. Coming-soon placeholders
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        user = request.user
        school = getattr(request, 'school', None) or getattr(user, 'school', None)
        if not school:
            return Response({"error": "School tenant context required"}, status=status.HTTP_400_BAD_REQUEST)

        # Campus filter handling
        campus_id = request.query_params.get('campus')
        target_campus = None
        if campus_id:
            target_campus = Campus.objects.filter(id=campus_id, school=school).first()

        # If principal, enforce their campus
        if user.role == UserRole.PRINCIPAL and user.primary_campus:
            target_campus = user.primary_campus

        # 1. 11-Step Setup Checklist (Spec Section 6)
        from apps.academics.models import (
            Term, Grade, Section, Subject, StudentEnrollment, AssessmentResult,
            GradingScaleConfig, FeePolicyConfig
        )
        steps = [
            {
                "step": 1, "key": "school_profile", "title": "School Profile & Branding",
                "is_complete": bool(school.name and school.contact_phone and school.contact_email),
                "url": "/admin/settings"
            },
            {
                "step": 2, "key": "campuses", "title": "Main Campus & Branches",
                "is_complete": school.campuses.filter(is_active=True).exists(),
                "url": "/admin/campuses"
            },
            {
                "step": 3, "key": "academic_session", "title": "Academic Session",
                "is_complete": AcademicSession.objects.filter(school=school, is_current=True).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 4, "key": "term_structure", "title": "Term Structure",
                "is_complete": Term.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 5, "key": "grade_matrix", "title": "Grade Levels & Stages",
                "is_complete": Grade.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 6, "key": "sections", "title": "Class Sections & Rooms",
                "is_complete": Section.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 7, "key": "subjects", "title": "Subject & Curriculum Mapping",
                "is_complete": Subject.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 8, "key": "faculty", "title": "Faculty & Staff Accounts",
                "is_complete": User.objects.filter(school=school, role=UserRole.TEACHER).exists(),
                "url": "/admin/people"
            },
            {
                "step": 9, "key": "roster", "title": "Student Enrollment Roster",
                "is_complete": StudentEnrollment.objects.filter(school=school).exists() or User.objects.filter(school=school, role=UserRole.STUDENT).exists(),
                "url": "/admin/people"
            },
            {
                "step": 10, "key": "fee_policy", "title": "Fee Policy & Grace Period",
                "is_complete": FeePolicyConfig.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
            {
                "step": 11, "key": "grading_policy", "title": "Grading Scale & Cutoffs",
                "is_complete": GradingScaleConfig.objects.filter(school=school).exists(),
                "url": "/admin/settings"
            },
        ]
        completed_steps = sum(1 for s in steps if s["is_complete"])
        checklist_progress = round((completed_steps / len(steps)) * 100, 1)

        # 2. People Counts
        user_qs = User.objects.filter(school=school, is_active=True)
        if target_campus:
            user_qs = user_qs.filter(
                models.Q(primary_campus=target_campus) | models.Q(assigned_campuses=target_campus)
            ).distinct()

        students_count = user_qs.filter(role=UserRole.STUDENT).count()
        teachers_count = user_qs.filter(role=UserRole.TEACHER).count()
        parents_count = user_qs.filter(role=UserRole.PARENT).count()
        accountants_count = user_qs.filter(role=UserRole.ACCOUNTANT).count()
        staff_count = user_qs.filter(role__in=[UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PRINCIPAL, UserRole.ACCOUNTANT]).count()

        # 3. Campuses summary
        all_campuses = list(school.campuses.all())
        active_campuses = [c for c in all_campuses if c.is_active]

        # 4. Organization AQI Overview
        from apps.academics.aqi_engine import calculate_organization_aqi
        aqi_result = calculate_organization_aqi(school=school)
        published_results_exist = AssessmentResult.objects.filter(school=school, is_published=True).exists()

        if not published_results_exist:
            aqi_payload = {
                "has_data": False,
                "score": None,
                "status_band": None,
                "display_status": "No academic data yet",
                "suggested_action": "Publish the first assessment results to activate institutional AQI tracking.",
                "message": "Academic Quality Index will calculate automatically when marks are published."
            }
        else:
            aqi_payload = {
                "has_data": True,
                "score": aqi_result.get("score"),
                "status_band": aqi_result.get("status_band"),
                "display_status": aqi_result.get("display_status", "Needs focused support"),
                "suggested_action": aqi_result.get("suggested_action", ""),
            }

        # 5. Attendance Summary
        from apps.academics.models import AttendanceRecord
        today = timezone.now().date()
        att_qs = AttendanceRecord.objects.filter(school=school, date=today)
        if target_campus:
            att_qs = att_qs.filter(campus=target_campus)
        tot_att = att_qs.count()
        pres_att = att_qs.filter(status='present').count()
        abs_att = att_qs.filter(status='absent').count()
        late_att = att_qs.filter(status='late').count()
        today_rate = round((pres_att / tot_att * 100), 1) if tot_att > 0 else None

        # 6. Action Alerts
        alerts = []
        pending_temp_pw = user_qs.filter(must_change_password=True).count()
        if pending_temp_pw > 0:
            alerts.append({
                "type": "info",
                "title": f"{pending_temp_pw} temporary passwords pending first login",
                "action_url": "/admin/people"
            })
        if not published_results_exist:
            alerts.append({
                "type": "neutral",
                "title": "Term assessment marks pending publication",
                "action_url": "/admin/settings"
            })

        # 7. Recent Audit Events
        recent_logs = AuditLog.objects.filter(school=school).order_by('-created_at')[:5]
        logs_data = [
            {
                "id": str(log.id),
                "actor": log.actor_username,
                "role": log.actor_role,
                "action": log.action,
                "resource": log.resource_type,
                "timestamp": log.created_at.isoformat(),
            }
            for log in recent_logs
        ]

        return Response({
            "success": True,
            "school": {
                "id": str(school.id),
                "name": school.name,
                "slug": school.slug,
                "is_multi_branch": school.is_multi_branch,
            },
            "selected_campus": {
                "id": str(target_campus.id),
                "name": target_campus.name
            } if target_campus else None,
            "checklist": {
                "progress_percentage": checklist_progress,
                "completed_count": completed_steps,
                "total_count": len(steps),
                "steps": steps,
            },
            "people": {
                "total": students_count + teachers_count + staff_count + parents_count,
                "students": students_count,
                "teachers": teachers_count,
                "parents": parents_count,
                "staff": staff_count,
                "accountants": accountants_count,
            },
            "campuses": {
                "total": len(all_campuses),
                "active": len(active_campuses),
                "is_multi_branch": school.is_multi_branch,
                "branches": [
                    {"id": str(c.id), "name": c.name, "code": c.code, "is_main": c.is_main, "is_active": c.is_active, "city": c.city}
                    for c in all_campuses
                ]
            },
            "aqi": aqi_payload,
            "attendance": {
                "today_rate": today_rate,
                "present": pres_att,
                "absent": abs_att,
                "late": late_att,
                "recorded_count": tot_att,
            },
            "alerts": alerts,
            "recent_activity": logs_data,
            "coming_soon": [
                {"key": "branch_map", "title": "Branch Map & Geographic Benchmark", "phase": "Phase 2"},
                {"key": "equity_comparison", "title": "Gender & Equity Cohort Analysis", "phase": "Phase 2"},
                {"key": "longitudinal_trend", "title": "Five-Year Longitudinal Quality Trend", "phase": "Phase 2"},
                {"key": "financial_ledger", "title": "Double-Entry Financial Cockpit", "phase": "Phase 2"},
                {"key": "regulatory_export", "title": "Board & Ministry Compliance Exports", "phase": "Phase 2"},
            ]
        })


class PermissionMatrixView(APIView):
    """
    Public / Authenticated: Returns the canonical permission matrix, role hierarchy,
    and capability metadata directly from apps/core/policy.py.
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        user = request.user
        school = getattr(request, 'school', None) or getattr(user, 'school', None)
        role_perms = []
        if school:
            from apps.core.models import SchoolRolePermission
            for rp in SchoolRolePermission.objects.filter(school=school):
                role_perms.append({
                    "id": str(rp.id),
                    "role": rp.role,
                    "custom_overrides": rp.custom_overrides or {},
                    "can_manage_academics": rp.can_manage_academics,
                    "can_create_timetable": rp.can_create_timetable,
                    "can_mark_attendance": rp.can_mark_attendance,
                    "can_enter_marks": rp.can_enter_marks,
                    "can_collect_fees": rp.can_collect_fees,
                    "can_view_reports": rp.can_view_reports,
                    "can_manage_staff": rp.can_manage_staff,
                })

        return Response({
            "roles": [
                {"role": "owner", "title": "Organization Owner", "rank": 100},
                {"role": "org_admin", "title": "Organization Administrator", "rank": 80},
                {"role": "principal", "title": "Campus Principal", "rank": 60},
                {"role": "teacher", "title": "Teacher", "rank": 40},
                {"role": "accountant", "title": "Accountant", "rank": 40},
                {"role": "parent", "title": "Parent / Guardian", "rank": 20},
                {"role": "student", "title": "Student", "rank": 10},
            ],
            "capabilities": [
                {
                    "module": c[0],
                    "key": c[1],
                    "label": c[2],
                    "description": c[3],
                    "is_locked": c[4]
                }
                for c in CAPABILITIES
            ],
            "role_defaults": {
                r: {k: v.value for k, v in caps.items()}
                for r, caps in DEFAULT_ROLE_CAPABILITIES.items()
            },
            "role_permissions": role_perms,
            "user_permissions": {
                c[1]: has_capability(user, c[1])
                for c in CAPABILITIES
            }
        })

    def post(self, request):
        user = request.user
        if user.role not in [UserRole.OWNER, UserRole.ORG_ADMIN, 'school_admin']:
            return Response({"error": "Admin credentials required to update permissions."}, status=status.HTTP_403_FORBIDDEN)

        school = getattr(request, 'school', None) or getattr(user, 'school', None)
        role = request.data.get('role')
        capability = request.data.get('capability')
        enabled = bool(request.data.get('enabled', True))

        from apps.core.policy import LOCKED_CAPABILITIES, ROLE_CEILINGS
        if capability in LOCKED_CAPABILITIES:
            return Response({"error": f"Capability '{capability}' is locked and cannot be overridden."}, status=status.HTTP_400_BAD_REQUEST)

        role_allowed = ROLE_CEILINGS.get(role, set())
        if enabled and capability not in role_allowed:
            return Response({"error": f"Capability '{capability}' exceeds maximum ceiling for role '{role}'."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.core.models import SchoolRolePermission, AuditLog
        perm, _ = SchoolRolePermission.objects.get_or_create(school=school, role=role)
        if not perm.custom_overrides:
            perm.custom_overrides = {}
        perm.custom_overrides[capability] = enabled
        perm.save()

        AuditLog.objects.create(
            school=school,
            actor=user,
            actor_username=user.username,
            actor_role=user.role,
            action="ROLE_CAPABILITY_OVERRIDE",
            resource_type="SchoolRolePermission",
            resource_id=str(perm.id),
            details={"role": role, "capability": capability, "enabled": enabled},
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({"status": "updated", "role": role, "capability": capability, "enabled": enabled})


import csv
import io
import secrets


def sanitize_csv_value(val: str) -> str:
    """Protects against CSV injection (formula execution) by stripping or prefixing dangerous chars."""
    if not val:
        return ""
    val = str(val).strip()
    if val.startswith(('=', '+', '-', '@', '\t', '\r')):
        val = "'" + val
    return val


class BulkUserImportView(APIView):
    """
    Multi-Role Batch CSV Ingestion Engine:
    Supports dry-run preview, row errors, duplicate detection, batch limits,
    CSV-injection protection, and batch credential sheets.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        if not school:
            return Response({"success": False, "message": "School tenant context required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Parse CSV Content
        csv_file = request.FILES.get('file')
        csv_text = request.data.get('csv_text')
        target_role = request.data.get('role', 'student').lower().strip()
        campus_id = request.data.get('campus_id')
        dry_run = str(request.data.get('dry_run', 'true')).lower() in ('true', '1')

        if csv_file:
            try:
                decoded_file = csv_file.read().decode('utf-8-sig')
            except Exception:
                return Response({"success": False, "message": "Failed to decode CSV file. Please upload a UTF-8 encoded CSV."}, status=status.HTTP_400_BAD_REQUEST)
        elif csv_text:
            decoded_file = csv_text
        else:
            return Response({"success": False, "message": "No CSV file or csv_text provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce role creation ceiling
        from apps.core.policy import can_create_role
        if not can_create_role(request.user.role, target_role):
            return Response({
                "success": False,
                "message": f"Permission denied: Your role '{request.user.role}' cannot import users of role '{target_role}'."
            }, status=status.HTTP_403_FORBIDDEN)

        # Resolve campus
        campus = None
        if campus_id:
            campus = school.campuses.filter(id=campus_id).first()
        if not campus:
            campus = request.user.primary_campus or school.campuses.filter(is_main=True).first() or school.campuses.first()

        # Parse rows
        reader = csv.DictReader(io.StringIO(decoded_file))
        if not reader.fieldnames:
            return Response({"success": False, "message": "Empty CSV or invalid headers."}, status=status.HTTP_400_BAD_REQUEST)

        rows = []
        for raw_row in reader:
            normalized_row = {k.strip().lower().replace(" ", "_"): sanitize_csv_value(v) for k, v in raw_row.items() if k}
            if any(normalized_row.values()):
                rows.append(normalized_row)

        if len(rows) == 0:
            return Response({"success": False, "message": "CSV contains no data rows."}, status=status.HTTP_400_BAD_REQUEST)

        # Batch limit: 500 rows
        MAX_ROWS = 500
        if len(rows) > MAX_ROWS:
            return Response({
                "success": False,
                "message": f"CSV exceeds maximum batch limit of {MAX_ROWS} rows (received {len(rows)})."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validation & Duplicate Detection
        errors = []
        seen_usernames = set()
        seen_emails = set()
        seen_admission_numbers = set()
        valid_rows = []

        from apps.authentication.models import User, StudentProfile, StaffProfile
        existing_usernames = set(User.objects.filter(school=school).values_list('username', flat=True))
        existing_emails = set(User.objects.filter(school=school, email__isnull=False).exclude(email='').values_list('email', flat=True))
        existing_admissions = set(StudentProfile.objects.filter(school=school).values_list('admission_number', flat=True))

        for idx, row in enumerate(rows, start=2):  # 1-indexed, line 1 is header
            row_errors = []
            first_name = row.get('first_name', '').strip()
            last_name = row.get('last_name', '').strip()
            username = row.get('username', '').strip()
            email = row.get('email', '').strip()
            admission_no = row.get('admission_number') or row.get('admission_no', '').strip()
            phone = row.get('phone') or row.get('phone_number', '').strip()
            designation = row.get('designation', '').strip()

            if not first_name:
                row_errors.append("First name is required.")

            if not username:
                if admission_no:
                    username = f"std_{admission_no.lower().replace('-', '_')}"
                elif first_name:
                    base = f"{first_name.lower()}_{last_name.lower()}".strip('_')
                    username = f"{base}_{school.slug[:3]}_{secrets.token_hex(2)}"
                else:
                    row_errors.append("Username could not be derived.")

            if username:
                if username in seen_usernames:
                    row_errors.append(f"Duplicate username '{username}' within CSV file.")
                elif username in existing_usernames:
                    row_errors.append(f"Username '{username}' already exists in database.")
                else:
                    seen_usernames.add(username)

            if email:
                if email in seen_emails:
                    row_errors.append(f"Duplicate email '{email}' within CSV file.")
                elif email in existing_emails:
                    row_errors.append(f"Email '{email}' already exists in database.")
                else:
                    seen_emails.add(email)

            if target_role == 'student' and admission_no:
                if admission_no in seen_admission_numbers:
                    row_errors.append(f"Duplicate admission number '{admission_no}' within CSV.")
                elif admission_no in existing_admissions:
                    row_errors.append(f"Admission number '{admission_no}' already exists in database.")
                else:
                    seen_admission_numbers.add(admission_no)

            parsed_item = {
                "row_number": idx,
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                "email": email,
                "phone": phone,
                "admission_number": admission_no,
                "designation": designation,
                "role": target_role,
            }

            if row_errors:
                errors.append({
                    "row": idx,
                    "username": username,
                    "errors": row_errors,
                    "data": parsed_item
                })
            else:
                valid_rows.append(parsed_item)

        preview_rows = valid_rows[:10]

        if dry_run:
            return Response({
                "success": True,
                "dry_run": True,
                "total_rows": len(rows),
                "valid_count": len(valid_rows),
                "error_count": len(errors),
                "preview": preview_rows,
                "errors": errors,
                "message": f"Dry run complete: {len(valid_rows)} valid rows, {len(errors)} error rows."
            })

        # Real Execution (dry_run=False)
        if len(errors) > 0:
            return Response({
                "success": False,
                "dry_run": False,
                "message": f"Cannot proceed with import: {len(errors)} row validation errors detected.",
                "total_rows": len(rows),
                "valid_count": len(valid_rows),
                "error_count": len(errors),
                "errors": errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        created_users = []
        credential_slips = []

        with transaction.atomic():
            for item in valid_rows:
                temp_password = f"Temp-{secrets.token_urlsafe(6)}!9"
                user = User.objects.create_user(
                    username=item['username'],
                    email=item['email'] or f"{item['username']}@{school.slug}.local",
                    first_name=item['first_name'],
                    last_name=item['last_name'],
                    phone_number=item['phone'],
                    role=target_role,
                    school=school,
                    primary_campus=campus,
                    must_change_password=True,
                    temporary_password_created_at=timezone.now(),
                )
                user.set_password(temp_password)
                user.save()

                if target_role == 'student':
                    StudentProfile.objects.create(
                        school=school,
                        user=user,
                        admission_number=item['admission_number'] or f"ADM-{secrets.token_hex(3).upper()}",
                    )
                elif target_role in ['teacher', 'accountant', 'principal']:
                    StaffProfile.objects.create(
                        school=school,
                        user=user,
                        employee_id=item.get('admission_number') or f"EMP-{secrets.token_hex(3).upper()}",
                        designation=item.get('designation') or target_role.title(),
                    )

                created_users.append(user)
                credential_slips.append({
                    "school_name": school.name,
                    "school_code": school.code,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": target_role,
                    "temporary_password": temp_password,
                    "login_url": f"/login?school={school.code}",
                    "must_change_password": True,
                })

            AuditLog.objects.create(
                school=school,
                actor=request.user,
                actor_username=request.user.username,
                actor_role=request.user.role,
                action="BULK_USERS_IMPORTED",
                resource_type="User",
                resource_id=f"count_{len(created_users)}",
                details={
                    "role": target_role,
                    "count": len(created_users),
                    "campus": campus.name if campus else "Main",
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )

        return Response({
            "success": True,
            "dry_run": False,
            "message": f"Successfully imported {len(created_users)} {target_role} accounts.",
            "imported_count": len(created_users),
            "credential_slips": credential_slips,
        }, status=status.HTTP_201_CREATED)

