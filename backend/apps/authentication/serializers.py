"""
Authentication serializers, custom JWT token claims, and hardened token refresh validation.
"""
from django.db import models
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import secrets
import re
from apps.authentication.models import (
    User, UserLoginAttempt, ParentStudentRelation, UserRole, StudentProfile, StaffProfile
)
from apps.core.models import School, Campus

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds tenant context, user roles, token version,
    and branding data to token claims.
    Enforces IP-aware account lockout checks, tenant status checks, and school-code scoping.
    Never trusts client-supplied roles.
    """
    school_code = serializers.CharField(required=False, allow_blank=True, default="")
    school_slug = serializers.CharField(required=False, allow_blank=True, default="")
    identifier = serializers.CharField(required=False, allow_blank=True, default="")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.username_field in self.fields:
            self.fields[self.username_field].required = False

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims embedded inside the signed JWT payload strictly from database
        token['user_id'] = str(user.id)
        token['username'] = user.username
        token['role'] = user.role  # Solely from DB
        token['preferred_language'] = user.preferred_language
        token['token_version'] = user.token_version
        token['school_id'] = str(user.school_id) if user.school_id else None
        token['school_slug'] = user.school.slug if user.school else None

        return token

    def validate(self, attrs):
        identifier = (attrs.get(self.username_field) or attrs.get('identifier') or '').strip()
        password = attrs.get('password')
        school_code = (attrs.get('school_code') or attrs.get('school_slug') or '').strip().lower()
        request = self.context.get('request')

        # Extract client IP address for IP-aware throttling
        client_ip = '127.0.0.1'
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
            raw_ip = ''
            if x_forwarded_for:
                raw_ip = x_forwarded_for.split(',')[0].strip()
            if not raw_ip:
                raw_ip = request.META.get('REMOTE_ADDR', '127.0.0.1').strip()

            # Strip port if present (e.g. 192.168.1.1:50000 or [::1]:8000)
            if raw_ip.startswith('[') and ']' in raw_ip:
                raw_ip = raw_ip[1:raw_ip.index(']')]
            elif ':' in raw_ip and raw_ip.count(':') == 1:
                raw_ip = raw_ip.split(':')[0]

            try:
                import ipaddress
                ipaddress.ip_address(raw_ip)
                client_ip = raw_ip
            except Exception:
                client_ip = '127.0.0.1'

        # 1. Check IP-aware account lockout
        attempt_record = None
        try:
            attempt_record = UserLoginAttempt.objects.filter(
                username=identifier,
                ip_address=client_ip
            ).first()

            if attempt_record and attempt_record.is_locked():
                raise serializers.ValidationError(
                    "Too many failed login attempts from this location. Account temporarily locked for 15 minutes."
                )
        except serializers.ValidationError:
            raise
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(f"UserLoginAttempt check error: {exc}")
            attempt_record = None

        # 2. Resolve matching user based on identifier and optional school_code
        authenticated_user = None

        if school_code:
            school = School.objects.filter(slug__iexact=school_code).first()
            if not school:
                raise serializers.ValidationError(
                    f"No school found with code '{school_code}'. Please check your school code."
                )
            matching_user = User.objects.filter(
                models.Q(username__iexact=identifier) | models.Q(email__iexact=identifier),
                school=school
            ).first()
            if matching_user and matching_user.check_password(password):
                authenticated_user = matching_user
        else:
            # 2a. Check if identifier is superadmin
            superadmin = User.objects.filter(
                models.Q(username__iexact=identifier) | models.Q(email__iexact=identifier),
                school__isnull=True
            ).first()
            if superadmin and superadmin.check_password(password):
                authenticated_user = superadmin
            else:
                # 2b. Search across schools
                matching_users = User.objects.filter(
                    models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)
                ).select_related('school')

                valid_users = [u for u in matching_users if u.check_password(password)]
                if len(valid_users) > 1:
                    schools_list = [
                        {"id": str(u.school.id), "name": u.school.name, "slug": u.school.slug, "role": u.role}
                        for u in valid_users if u.school
                    ]
                    raise serializers.ValidationError({
                        "multiple_schools": True,
                        "message": "Multiple school accounts found. Please provide your School Code.",
                        "schools": schools_list
                    })
                elif len(valid_users) == 1:
                    authenticated_user = valid_users[0]

        if not authenticated_user:
            # Record failed attempt tied to this IP
            try:
                if not attempt_record:
                    attempt_record = UserLoginAttempt(
                        username=identifier,
                        ip_address=client_ip
                    )
                attempt_record.record_failure()
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(f"UserLoginAttempt record failure error: {exc}")

            if school_code:
                raise serializers.ValidationError(
                    "Invalid credentials for this school. Please verify your username/email and password."
                )
            elif '@' not in identifier:
                raise serializers.ValidationError(
                    "Account not found for this username. Please enter your School Code to sign in to your institution."
                )
            else:
                raise serializers.ValidationError(
                    "Invalid email or password. Please verify your credentials or enter your School Code."
                )

        # 3. Reset failure counter on success
        if attempt_record:
            try:
                attempt_record.reset_failures()
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(f"UserLoginAttempt reset error: {exc}")

        # 4. Check user status
        if not authenticated_user.is_active:
            raise serializers.ValidationError("This user account has been deactivated.")

        # 5. Check school status (active, pending approval, suspended)
        if authenticated_user.school:
            if not authenticated_user.school.is_active or authenticated_user.school.status == 'suspended':
                raise serializers.ValidationError(
                    "Your school's account is currently suspended. Please contact platform support."
                )
            if authenticated_user.school.status == 'pending_approval':
                raise serializers.ValidationError(
                    "Your school registration is pending superadmin approval."
                )

        # 6. Generate tokens
        self.user = authenticated_user
        refresh = self.get_token(authenticated_user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': str(authenticated_user.id),
                'username': authenticated_user.username,
                'email': authenticated_user.email,
                'first_name': authenticated_user.first_name,
                'last_name': authenticated_user.last_name,
                'full_name': f"{authenticated_user.first_name} {authenticated_user.last_name}".strip() or authenticated_user.username,
                'role': authenticated_user.role,  # Strictly from DB
                'must_change_password': authenticated_user.must_change_password,
                'preferred_language': authenticated_user.preferred_language,
                'school_id': str(authenticated_user.school_id) if authenticated_user.school_id else None,
                'school_name': authenticated_user.school.name if authenticated_user.school else None,
                'school_slug': authenticated_user.school.slug if authenticated_user.school else None,
                'school': {
                    'id': str(authenticated_user.school.id),
                    'name': authenticated_user.school.name,
                    'slug': authenticated_user.school.slug,
                    'status': authenticated_user.school.status,
                    'brand_primary_color': authenticated_user.school.brand_primary_color,
                    'brand_accent_color': authenticated_user.school.brand_accent_color,
                    'logo': authenticated_user.school.logo,
                } if authenticated_user.school else None
            }
        }

        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Hardened Token Refresh Serializer:
    Validates token signature and then queries the database to confirm:
    1. User still exists and is_active is True
    2. School still exists and is_active is True, not suspended
    3. User's school_id still matches the school_id claim in the token
    4. Token version matches user's active token_version (force logout support)
    """
    def validate(self, attrs):
        # 1. Base SimpleJWT validation (signature, expiry, blacklist)
        data = super().validate(attrs)

        # 2. Extract token payload claims
        refresh_token = RefreshToken(attrs['refresh'])
        payload = refresh_token.payload
        user_id = payload.get('user_id')
        token_school_id = payload.get('school_id')
        token_version = payload.get('token_version', 0)

        if not user_id:
            raise serializers.ValidationError("Invalid token payload: missing user identifier.")

        # 3. Re-verify user state in database
        user = User.objects.filter(id=user_id).select_related('school').first()
        if not user:
            raise serializers.ValidationError("User associated with this token no longer exists.")

        if not user.is_active:
            raise serializers.ValidationError("User account has been deactivated.")

        # 4. Check token_version to support force-logout
        if user.token_version != token_version:
            raise serializers.ValidationError("Session has been invalidated. Please log in again.")

        # 5. Re-verify school tenant state in database
        if user.school:
            if not user.school.is_active or user.school.status == 'suspended':
                raise serializers.ValidationError("The school associated with this account is inactive or suspended.")

            if token_school_id and str(user.school_id) != str(token_school_id):
                raise serializers.ValidationError("Security violation: User's school affiliation has changed.")
        elif token_school_id is not None:
            raise serializers.ValidationError("Security violation: Tenant mismatch.")

        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile representations."""
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_slug = serializers.CharField(source='school.slug', read_only=True)
    school_code = serializers.CharField(source='school.code', read_only=True)
    primary_campus_name = serializers.CharField(source='primary_campus.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    school = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    admission_number = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'preferred_language', 'avatar',
            'is_active', 'must_change_password', 'token_version',
            'school_id', 'school_name', 'school_slug', 'school_code', 'school',
            'primary_campus_id', 'primary_campus_name',
            'admission_number', 'employee_id',
            'date_joined', 'children'
        ]
        read_only_fields = ['id', 'role', 'school_id', 'must_change_password', 'token_version']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_school(self, obj):
        if obj.school:
            return {
                "id": str(obj.school.id),
                "name": obj.school.name,
                "slug": obj.school.slug,
                "code": obj.school.code,
                "is_multi_branch": obj.school.is_multi_branch,
                "status": obj.school.status,
                "brand_primary_color": obj.school.brand_primary_color,
                "brand_accent_color": obj.school.brand_accent_color,
                "logo": obj.school.logo,
            }
        return None

    def get_admission_number(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile:
            return obj.student_profile.admission_number
        return None

    def get_employee_id(self, obj):
        if hasattr(obj, 'staff_profile') and obj.staff_profile:
            return obj.staff_profile.employee_id
        return None

    def get_children(self, obj):
        if obj.role == 'parent':
            relations = ParentStudentRelation.objects.filter(parent=obj).select_related('student')
            return [
                {
                    "id": str(rel.student.id),
                    "username": rel.student.username,
                    "first_name": rel.student.first_name,
                    "last_name": rel.student.last_name,
                    "relationship": rel.relationship,
                    "is_primary": rel.is_primary,
                    "receives_alerts": rel.receives_alerts,
                }
                for rel in relations
            ]
        return []


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for owners, admins, and principals to provision user accounts."""
    role = serializers.ChoiceField(choices=[
        ('owner', 'Organization Owner'),
        ('org_admin', 'Organization Admin'),
        ('principal', 'Principal'),
        ('headmaster', 'Principal (Legacy)'),
        ('school_admin', 'Organization Admin (Legacy)'),
        ('teacher', 'Teacher'),
        ('accountant', 'Accountant / Finance'),
        ('student', 'Student'),
        ('parent', 'Parent / Guardian'),
    ])
    username = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    student_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    primary_campus_id = serializers.UUIDField(required=False, allow_null=True)
    assigned_campus_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    admission_number = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    designation = serializers.CharField(required=False, allow_blank=True)
    relationship = serializers.CharField(required=False, default="guardian")
    is_primary = serializers.BooleanField(required=False, default=True)
    receives_alerts = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'role', 'first_name', 'last_name', 'phone_number',
            'primary_campus_id', 'assigned_campus_ids', 'student_ids',
            'student_id', 'admission_number', 'employee_id', 'designation',
            'relationship', 'is_primary', 'receives_alerts'
        ]

    def validate(self, attrs):
        role = attrs.get('role')
        if role == 'headmaster':
            attrs['role'] = 'principal'
            role = 'principal'
        elif role == 'school_admin':
            attrs['role'] = 'org_admin'
            role = 'org_admin'

        username = (attrs.get('username') or '').strip()
        admission_number = (attrs.get('admission_number') or attrs.get('student_id') or '').strip()
        school = self.context.get('school')

        if not username:
            if role == 'student' and admission_number:
                username = admission_number.lower()
                attrs['username'] = username
            elif role == 'student':
                attrs['username'] = f"std_{secrets.token_hex(4)}"
            elif attrs.get('email'):
                email_prefix = attrs['email'].split('@')[0].lower()
                base_username = re.sub(r'[^a-zA-Z0-9._]', '', email_prefix) or f"{role}_{secrets.token_hex(3)}"
                candidate = base_username
                idx = 1
                while school and User.objects.filter(school=school, username__iexact=candidate).exists():
                    candidate = f"{base_username}_{idx}"
                    idx += 1
                attrs['username'] = candidate
            elif attrs.get('first_name'):
                base = f"{attrs.get('first_name')}_{attrs.get('last_name', '')}".strip('_').lower()
                base_username = re.sub(r'[^a-zA-Z0-9._]', '', base) or f"{role}_{secrets.token_hex(3)}"
                candidate = base_username
                idx = 1
                while school and User.objects.filter(school=school, username__iexact=candidate).exists():
                    candidate = f"{base_username}_{idx}"
                    idx += 1
                attrs['username'] = candidate
            else:
                raise serializers.ValidationError({"username": "Username is required for staff and parent accounts."})

        if school and attrs.get('username'):
            if User.objects.filter(school=school, username__iexact=attrs['username']).exists():
                raise serializers.ValidationError({"username": f"A user with username '{attrs['username']}' already exists in this school."})

        return attrs

    def create(self, validated_data):
        primary_campus_id = validated_data.pop('primary_campus_id', None)
        assigned_campus_ids = validated_data.pop('assigned_campus_ids', [])
        student_ids = validated_data.pop('student_ids', [])
        student_id_val = validated_data.pop('student_id', None)
        admission_number = validated_data.pop('admission_number', None)
        employee_id = validated_data.pop('employee_id', None)
        designation = validated_data.pop('designation', None)
        relationship = validated_data.pop('relationship', 'guardian')
        is_primary = validated_data.pop('is_primary', True)
        receives_alerts = validated_data.pop('receives_alerts', True)

        school = validated_data.get('school') or self.context.get('school')
        validated_data['school'] = school

        if primary_campus_id:
            campus = Campus.objects.filter(id=primary_campus_id, school=school).first()
            if campus:
                validated_data['primary_campus'] = campus

        user = User.objects.create(**validated_data)

        if assigned_campus_ids:
            campuses = Campus.objects.filter(id__in=assigned_campus_ids, school=school)
            user.assigned_campuses.set(campuses)

        # Create linked profiles
        if user.role == UserRole.STUDENT:
            adm_no = admission_number or student_id_val or user.username
            StudentProfile.objects.create(
                school=school,
                user=user,
                admission_number=adm_no,
            )
        elif user.role in [UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ACCOUNTANT]:
            emp_no = employee_id or user.username
            StaffProfile.objects.create(
                school=school,
                user=user,
                employee_id=emp_no,
                designation=designation or user.role.title(),
            )
        elif user.role == UserRole.PARENT and student_ids:
            for sid in student_ids:
                student = User.objects.filter(id=sid, school=school, role=UserRole.STUDENT).first()
                if student:
                    ParentStudentRelation.objects.get_or_create(
                        school=school,
                        parent=user,
                        student=student,
                        defaults={
                            'relationship': relationship,
                            'is_primary': is_primary,
                            'receives_alerts': receives_alerts
                        }
                    )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
