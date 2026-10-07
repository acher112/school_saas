"""
Authentication serializers, custom JWT token claims, and hardened token refresh validation.
"""
from django.db import models
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import User, UserLoginAttempt, ParentStudentRelation
from apps.core.models import School

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
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                client_ip = x_forwarded_for.split(',')[0].strip()
            else:
                client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        # 1. Check IP-aware account lockout
        attempt_record = UserLoginAttempt.objects.filter(
            username=identifier,
            ip_address=client_ip
        ).first()

        if attempt_record and attempt_record.is_locked():
            raise serializers.ValidationError(
                "Too many failed login attempts from this location. Account temporarily locked for 15 minutes."
            )

        # 2. Resolve matching user based on identifier and optional school_code
        authenticated_user = None

        if school_code:
            school = School.objects.filter(slug__iexact=school_code).first()
            if not school:
                raise serializers.ValidationError("School not found with the provided school code.")
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
            if not attempt_record:
                attempt_record = UserLoginAttempt(
                    username=identifier,
                    ip_address=client_ip
                )
            attempt_record.record_failure()
            raise serializers.ValidationError(
                "Invalid credentials provided. Please check your username and password."
            )

        # 3. Reset failure counter on success
        if attempt_record:
            attempt_record.reset_failures()

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
                'role': authenticated_user.role,  # Strictly from DB
                'must_change_password': authenticated_user.must_change_password,
                'preferred_language': authenticated_user.preferred_language,
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
    children = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'preferred_language', 'avatar',
            'is_active', 'must_change_password', 'token_version',
            'school_id', 'school_name', 'school_slug', 'date_joined',
            'children'
        ]
        read_only_fields = ['id', 'role', 'school_id', 'must_change_password', 'token_version']

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
                }
                for rel in relations
            ]
        return []


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for school admins to create staff, teacher, and student users."""
    role = serializers.ChoiceField(choices=[
        ('headmaster', 'Headmaster / Principal'),
        ('teacher', 'Teacher'),
        ('accountant', 'Accountant / Finance'),
        ('student', 'Student'),
        ('parent', 'Parent / Guardian'),
    ])
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    student_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'student_ids']

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        return username


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
