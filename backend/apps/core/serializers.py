"""
Serializers for School tenancy, campuses, academic sessions, role permissions, and self-service onboarding.
"""
import os
from datetime import date
from rest_framework import serializers
from django.db import transaction, connection
from apps.core.context import set_current_school
from django.utils import timezone
from apps.core.models import (
    School,
    Campus,
    Domain,
    AcademicSession,
    SchoolRolePermission,
    AuditLog,
    SchoolAnnouncement
)
from apps.authentication.models import User, UserRole
from rest_framework_simplejwt.tokens import RefreshToken

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = ['id', 'name', 'code', 'address', 'is_main', 'created_at']
        read_only_fields = ['id', 'created_at']

class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ['id', 'school_id', 'name', 'start_date', 'end_date', 'is_current', 'is_closed', 'created_at']
        read_only_fields = ['id', 'school_id', 'created_at']

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and start >= end:
            raise serializers.ValidationError({"end_date": "End date must be strictly after the start date."})
        return attrs

class SchoolRolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolRolePermission
        fields = [
            'id', 'school_id', 'role',
            'can_manage_academics', 'can_create_timetable',
            'can_mark_attendance', 'can_enter_marks',
            'can_collect_fees', 'can_view_reports', 'can_manage_staff'
        ]
        read_only_fields = ['id', 'school_id']

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor_username', 'actor_role', 'action',
            'resource_type', 'resource_id', 'ip_address', 'details', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class SchoolSerializer(serializers.ModelSerializer):
    campuses = CampusSerializer(many=True, read_only=True)
    current_session = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            'id', 'name', 'slug', 'contact_email', 'contact_phone',
            'address', 'city', 'country', 'currency', 'timezone',
            'logo', 'brand_primary_color', 'brand_accent_color',
            'is_active', 'is_demo_school', 'has_sample_data',
            'campuses', 'current_session', 'created_at'
        ]
        read_only_fields = ['id', 'is_active', 'is_demo_school', 'has_sample_data', 'created_at']

    def get_current_session(self, obj):
        db = obj._state.db or 'default'
        session = AcademicSession._unscoped.using(db).filter(school=obj, is_current=True).first()
        return AcademicSessionSerializer(session).data if session else None

class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolAnnouncement
        fields = ['id', 'school_id', 'campus_id', 'title', 'content', 'is_published', 'created_at']
        read_only_fields = ['id', 'school_id', 'created_at']

class SchoolSignupSerializer(serializers.Serializer):
    """
    Handles atomic, self-service onboarding for a new school.
    Creates the School, default Main Campus, Subdomain, First Academic Session,
    Default Role Permissions, and Administrator User in a single atomic transaction.
    """
    # School details
    school_name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=100)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=32)
    city = serializers.CharField(max_length=100, default="Lahore")
    brand_primary_color = serializers.CharField(max_length=7, default="#2563EB")
    brand_accent_color = serializers.CharField(max_length=7, default="#F59E0B")

    # Initial Academic Session details
    session_name = serializers.CharField(max_length=100, default="2026-2027")
    session_start_date = serializers.DateField(required=False, default=date(2026, 8, 1))
    session_end_date = serializers.DateField(required=False, default=date(2027, 6, 30))

    # Initial Administrator credentials
    admin_username = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(min_length=8, write_only=True)
    admin_first_name = serializers.CharField(max_length=150, required=False, default="")
    admin_last_name = serializers.CharField(max_length=150, required=False, default="")

    # Optional invite code protection for public deployments
    invite_code = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_slug(self, value):
        slug = value.strip().lower()
        if slug in ('admin', 'api', 'www', 'app', 'portal', 'dashboard', 'root', 'health', 'public'):
            raise serializers.ValidationError("This subdomain slug is reserved for system operations.")
        if School.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("A school with this subdomain already exists.")
        return slug

    def validate_admin_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_admin_email(self, value):
        from apps.core.email_validator import validate_recognized_email
        return validate_recognized_email(value)

    def validate_contact_email(self, value):
        from apps.core.email_validator import validate_recognized_email
        return validate_recognized_email(value)

    def validate(self, attrs):
        # Enforce SIGNUP_INVITE_CODE if set in environment
        required_invite_code = os.getenv('SIGNUP_INVITE_CODE', '').strip()
        if required_invite_code:
            provided_code = attrs.get('invite_code', '').strip()
            if provided_code != required_invite_code:
                raise serializers.ValidationError({"invite_code": "Invalid signup invite code."})

        # Validate session dates
        start = attrs.get('session_start_date')
        end = attrs.get('session_end_date')
        if start and end and start >= end:
            raise serializers.ValidationError({"session_end_date": "Session end date must be after start date."})

        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            # 1. Create School Tenant
            school = School.objects.create(
                name=validated_data['school_name'],
                slug=validated_data['slug'],
                contact_email=validated_data['contact_email'],
                contact_phone=validated_data['contact_phone'],
                city=validated_data.get('city', 'Lahore'),
                brand_primary_color=validated_data.get('brand_primary_color', '#2563EB'),
                brand_accent_color=validated_data.get('brand_accent_color', '#F59E0B'),
                is_active=True
            )

            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school.id)])
            set_current_school(school)

            # 2. Create Default Main Campus
            campus = Campus.objects.create(
                school=school,
                name="Main Campus",
                code="MAIN",
                address=validated_data.get('city', 'Lahore'),
                is_main=True
            )

            # 3. Create Default Subdomain
            Domain.objects.create(
                school=school,
                domain=f"{school.slug}.myschoolsaas.com",
                is_primary=True
            )

            # 4. Create First Academic Session
            session = AcademicSession.objects.create(
                school=school,
                campus=campus,
                name=validated_data.get('session_name', '2026-2027'),
                start_date=validated_data.get('session_start_date', date(2026, 8, 1)),
                end_date=validated_data.get('session_end_date', date(2027, 6, 30)),
                is_current=True,
                is_closed=False
            )

            # 5. Initialize Default Role Permissions for School
            default_permissions = [
                (UserRole.HEADMASTER, True, True, True, True, True, True, True),
                (UserRole.TEACHER, False, False, True, True, False, False, False),
                (UserRole.ACCOUNTANT, False, False, False, False, True, True, False),
                (UserRole.STUDENT, False, False, False, False, False, False, False),
                (UserRole.PARENT, False, False, False, False, False, False, False),
            ]
            for role_code, m_acad, c_time, m_att, e_mark, c_fee, v_rep, m_stf in default_permissions:
                SchoolRolePermission.objects.create(
                    school=school,
                    campus=campus,
                    role=role_code,
                    can_manage_academics=m_acad,
                    can_create_timetable=c_time,
                    can_mark_attendance=m_att,
                    can_enter_marks=e_mark,
                    can_collect_fees=c_fee,
                    can_view_reports=v_rep,
                    can_manage_staff=m_stf
                )

            # 6. Create Tenant School Admin User
            admin_user = User.objects.create_user(
                username=validated_data['admin_username'],
                email=validated_data['admin_email'],
                password=validated_data['admin_password'],
                first_name=validated_data.get('admin_first_name', ''),
                last_name=validated_data.get('admin_last_name', ''),
                school=school,
                role=UserRole.SCHOOL_ADMIN,
                preferred_language='en'
            )

            # 7. Record Audit Log Entry
            AuditLog.objects.create(
                school=school,
                campus=campus,
                actor=admin_user,
                actor_username=admin_user.username,
                actor_role=admin_user.role,
                action="SCHOOL_REGISTERED",
                resource_type="School",
                resource_id=str(school.id),
                details={"slug": school.slug, "session": session.name}
            )

            # 8. Issue JWT tokens
            refresh = RefreshToken.for_user(admin_user)
            refresh['school_id'] = str(school.id)
            refresh['school_slug'] = school.slug
            refresh['role'] = admin_user.role

            return {
                'school': SchoolSerializer(school).data,
                'current_session': AcademicSessionSerializer(session).data,
                'admin_user': {
                    'id': str(admin_user.id),
                    'username': admin_user.username,
                    'email': admin_user.email,
                    'role': admin_user.role
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
