"""
Authentication serializers, custom JWT token claims, and hardened token refresh validation.
"""
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from apps.authentication.models import User, UserLoginAttempt

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds tenant context, user roles, and branding data to token claims.
    Enforces IP-aware account lockout checks and tenant activity checks.
    Never trusts client-supplied roles.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims embedded inside the signed JWT payload strictly from database
        token['user_id'] = str(user.id)
        token['username'] = user.username
        token['role'] = user.role  # Solely from DB
        token['preferred_language'] = user.preferred_language
        token['school_id'] = str(user.school_id) if user.school_id else None
        token['school_slug'] = user.school.slug if user.school else None

        return token

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get('password')
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
            username=username,
            ip_address=client_ip
        ).first()

        if attempt_record and attempt_record.is_locked():
            raise serializers.ValidationError(
                "Too many failed login attempts from this location. Account temporarily locked for 15 minutes."
            )

        # 2. Authenticate credentials
        authenticated_user = authenticate(
            request=request,
            username=username,
            password=password
        )

        if not authenticated_user:
            # Record failed attempt tied to this IP
            if not attempt_record:
                attempt_record = UserLoginAttempt(
                    username=username,
                    ip_address=client_ip
                )
            attempt_record.record_failure()
            raise serializers.ValidationError(
                "Invalid credentials provided. Please check your username and password."
            )

        # 3. Reset failure counter on success
        if attempt_record:
            attempt_record.reset_failures()

        # 4. Check that user and school are active
        if not authenticated_user.is_active:
            raise serializers.ValidationError("This user account has been deactivated.")

        if authenticated_user.school and not authenticated_user.school.is_active:
            raise serializers.ValidationError(
                "Your school's account is currently suspended. Please contact your administrator."
            )

        # 5. Generate tokens - role is strictly taken from DB
        data = super().validate(attrs)

        data['user'] = {
            'id': str(authenticated_user.id),
            'username': authenticated_user.username,
            'email': authenticated_user.email,
            'first_name': authenticated_user.first_name,
            'last_name': authenticated_user.last_name,
            'role': authenticated_user.role,  # Strictly from DB
            'preferred_language': authenticated_user.preferred_language,
            'school': {
                'id': str(authenticated_user.school.id),
                'name': authenticated_user.school.name,
                'slug': authenticated_user.school.slug,
                'brand_primary_color': authenticated_user.school.brand_primary_color,
                'brand_accent_color': authenticated_user.school.brand_accent_color,
                'logo': authenticated_user.school.logo,
            } if authenticated_user.school else None
        }

        return data

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Hardened Token Refresh Serializer:
    Validates token signature and then queries the database to confirm:
    1. User still exists and is_active is True
    2. School still exists and is_active is True
    3. User's school_id still matches the school_id claim in the token
    """
    def validate(self, attrs):
        # 1. Base SimpleJWT validation (signature, expiry, blacklist)
        data = super().validate(attrs)

        # 2. Extract token payload claims
        refresh_token = RefreshToken(attrs['refresh'])
        payload = refresh_token.payload
        user_id = payload.get('user_id')
        token_school_id = payload.get('school_id')

        if not user_id:
            raise serializers.ValidationError("Invalid token payload: missing user identifier.")

        # 3. Re-verify user state in database
        user = User.objects.filter(id=user_id).select_related('school').first()
        if not user:
            raise serializers.ValidationError("User associated with this token no longer exists.")

        if not user.is_active:
            raise serializers.ValidationError("User account has been deactivated.")

        # 4. Re-verify school tenant state in database
        if user.school:
            if not user.school.is_active:
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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'preferred_language', 'avatar',
            'school_id', 'school_name', 'school_slug', 'date_joined'
        ]
        read_only_fields = ['id', 'role', 'school_id']
