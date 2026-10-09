"""
School Onboarding and Registration Wizard views.
Handles draft submission, 6-digit email verification, resend cooldowns, and live slug availability checks.
"""
import re
import secrets
import logging
from datetime import timedelta
from django.conf import settings
from django.db import transaction, connection
from apps.core.context import set_current_school
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import (
    School,
    Campus,
    Domain,
    AcademicSession,
    SchoolRolePermission,
    SchoolRegistrationDraft,
    AuditLog,
)
from apps.authentication.models import User, UserRole
from apps.authentication.serializers import CustomTokenObtainPairSerializer
from apps.core.email import get_email_provider

logger = logging.getLogger(__name__)

SLUG_REGEX = re.compile(r'^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')
PK_PHONE_REGEX = re.compile(r'^((\+92)|(0092)|0)?3[0-9]{9}$')


class CheckSlugAvailabilityView(APIView):
    """
    Public endpoint: Checks whether a school subdomain/slug is available.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get('slug', '').strip().lower()
        if not slug:
            return Response({"available": False, "message": "Slug parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not SLUG_REGEX.match(slug):
            return Response({
                "available": False,
                "message": "Slug must be 3-50 characters long and contain only lowercase letters, numbers, and hyphens."
            }, status=status.HTTP_200_OK)

        exists = School.objects.filter(slug__iexact=slug).exists()
        if not exists:
            # Also check unexpired unverified drafts
            exists = SchoolRegistrationDraft.objects.filter(
                slug__iexact=slug,
                is_verified=False,
                expires_at__gt=timezone.now()
            ).exists()

        return Response({
            "available": not exists,
            "slug": slug,
            "message": "Slug is available" if not exists else "This subdomain is already taken."
        }, status=status.HTTP_200_OK)


class SchoolSignupWizardView(APIView):
    """
    Public endpoint: Submits school registration wizard data.
    Validates institutional data, admin account, branding tokens, and initial session.
    If REQUIRE_EMAIL_VERIFICATION is enabled (default), saves a draft and dispatches a 6-digit code.
    Otherwise, provisions the school immediately.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # 1. Check optional invite code
        required_invite = getattr(settings, 'SIGNUP_INVITE_CODE', '')
        if required_invite:
            provided_invite = data.get('invite_code', '').strip()
            if provided_invite != required_invite:
                return Response({
                    "success": False,
                    "errors": {"invite_code": ["Invalid registration invite code."]}
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validate required fields
        errors = {}
        school_name = data.get('school_name', '').strip()
        slug = data.get('slug', '').strip().lower()
        contact_phone = data.get('contact_phone', '').strip()
        admin_email = data.get('admin_email', '').strip().lower()
        admin_name = data.get('admin_name', '').strip()
        admin_password = data.get('admin_password', '')
        terms_accepted = data.get('terms_accepted', False)

        if not school_name:
            errors['school_name'] = ["School name is required."]
        if not slug or not SLUG_REGEX.match(slug):
            errors['slug'] = ["Subdomain must be 3-50 alphanumeric characters and hyphens."]
        elif School.objects.filter(slug__iexact=slug).exists():
            errors['slug'] = ["This subdomain is already registered."]

        from apps.core.email_validator import is_recognized_email_provider
        if not admin_email or '@' not in admin_email:
            errors['admin_email'] = ["A valid administrator email address is required."]
        elif not is_recognized_email_provider(admin_email):
            errors['admin_email'] = ["Only email addresses registered on recognized platforms (Google/Gmail, Yahoo, Hotmail/Outlook, iCloud) are accepted."]
        if not contact_phone or not PK_PHONE_REGEX.match(contact_phone):
            errors['contact_phone'] = ["A valid Pakistani mobile phone number is required (e.g. 03001234567)."]
        if not admin_name:
            errors['admin_name'] = ["Administrator name is required."]
        if not admin_password or len(admin_password) < 8:
            errors['admin_password'] = ["Administrator password must be at least 8 characters."]
        if not terms_accepted:
            errors['terms_accepted'] = ["You must accept the Terms of Service and Privacy Policy."]

        if errors:
            return Response({"success": False, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Extract client IP
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')

        # Hash administrator password before any draft storage
        admin_password_hash = make_password(admin_password)
        cleaned_payload = dict(data)
        cleaned_payload['admin_password_hash'] = admin_password_hash
        cleaned_payload.pop('admin_password', None)

        require_verification = getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', True)

        if not require_verification:
            # Auto-verify path (used when verification is disabled)
            school, admin_user = self._provision_school(cleaned_payload, client_ip)
            token = CustomTokenObtainPairSerializer.get_token(admin_user)
            return Response({
                "success": True,
                "verified": True,
                "auto_verified": True,
                "message": "Email verification is disabled in this test environment. School activated immediately.",
                "school": {
                    "id": str(school.id),
                    "name": school.name,
                    "slug": school.slug,
                    "status": school.status,
                },
                "tokens": {
                    "access": str(token.access_token),
                    "refresh": str(token),
                }
            }, status=status.HTTP_201_CREATED)

        # Draft email verification path
        code = f"{secrets.randbelow(900000) + 100000:06d}"

        # Clean existing pending drafts for this email or slug
        SchoolRegistrationDraft.objects.filter(admin_email=admin_email, is_verified=False).delete()
        SchoolRegistrationDraft.objects.filter(slug=slug, is_verified=False).delete()

        draft = SchoolRegistrationDraft(
            admin_email=admin_email,
            school_name=school_name,
            slug=slug,
            data=cleaned_payload,
            client_ip=client_ip,
        )
        draft.set_code(code)
        draft.save()

        # Send 6-digit code via email provider
        email_provider = get_email_provider()
        subject = f"Your School SaaS Verification Code: {code}"
        text_body = (
            f"Hello {admin_name},\n\n"
            f"Thank you for registering {school_name} on School SaaS.\n\n"
            f"Your 6-digit verification code is:\n\n"
            f"    {code}\n\n"
            f"This code expires in 10 minutes. If you did not request this, please ignore this email.\n\n"
            f"Best regards,\nSchool SaaS Platform Team"
        )
        email_provider.send_email(admin_email, subject, text_body)

        resp_data = {
            "success": True,
            "draft_id": str(draft.id),
            "email": admin_email,
            "message": "A 6-digit verification code has been sent to your email address.",
        }
        if getattr(settings, 'DEBUG', False) or getattr(settings, 'TESTING', False):
            resp_data["dev_code"] = code

        return Response(resp_data, status=status.HTTP_201_CREATED)

    @classmethod
    def _provision_school(cls, payload: dict, client_ip: str = None):
        """Atomically provisions a school tenant and initial resources."""
        with transaction.atomic():
            school_status = "pending_approval" if getattr(settings, "SCHOOL_APPROVAL_REQUIRED", False) else "active"
            school = School.objects.create(
                name=payload['school_name'],
                slug=payload['slug'],
                contact_email=payload['admin_email'],
                contact_phone=payload.get('contact_phone', ''),
                city=payload.get('city', 'Lahore'),
                province=payload.get('province', 'Punjab'),
                address=payload.get('address', ''),
                school_type=payload.get('school_type', 'private'),
                board=payload.get('board', 'bise_lahore'),
                levels=payload.get('levels', 'playgroup_to_matric'),
                gender_type=payload.get('gender_type', 'co_education'),
                medium_of_instruction=payload.get('medium_of_instruction', 'english'),
                brand_primary_color=payload.get('brand_primary_color', '#2563EB'),
                brand_accent_color=payload.get('brand_accent_color', '#F59E0B'),
                status=school_status,
                is_active=True,
                terms_version=payload.get('terms_version', 'v1.0'),
                terms_accepted_at=timezone.now(),
            )

            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school.id)])
            set_current_school(school)

            campus = Campus.objects.create(
                school=school,
                name="Main Campus",
                code="MAIN",
                is_main=True,
            )

            Domain.objects.create(
                school=school,
                domain=f"{school.slug}.schoolsaas.local",
                is_primary=True,
            )

            AcademicSession.objects.create(
                school=school,
                campus=campus,
                name=payload.get('academic_year_name', '2026-2027'),
                start_date=payload.get('academic_year_start', '2026-08-01'),
                end_date=payload.get('academic_year_end', '2027-06-30'),
                is_current=True,
            )

            SchoolRolePermission.initialize_for_school(school, campus)

            admin_user = User(
                school=school,
                username=payload.get('admin_username') or payload['admin_email'].split('@')[0],
                email=payload['admin_email'],
                first_name=payload.get('admin_name', 'Administrator'),
                role=UserRole.SCHOOL_ADMIN,
                is_active=True,
                must_change_password=False,
            )
            admin_user.password = payload['admin_password_hash']
            admin_user.save()

            AuditLog.objects.create(
                school=school,
                actor=admin_user,
                actor_username=admin_user.username,
                actor_role=admin_user.role,
                action="SCHOOL_ONBOARDED",
                resource_type="School",
                resource_id=str(school.id),
                details={"school_name": school.name, "slug": school.slug, "ip": client_ip}
            )

            return school, admin_user


class VerifyEmailCodeView(APIView):
    """
    Public endpoint: Verifies the 6-digit email confirmation code.
    Upon verification, atomically provisions the school, campus, domain, academic session,
    default role permissions, and administrative account.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        draft_id = request.data.get('draft_id')
        code = request.data.get('code', '').strip()

        if not draft_id or not code:
            return Response({
                "success": False,
                "message": "Both draft_id and verification code are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        draft = SchoolRegistrationDraft.objects.filter(id=draft_id).first()
        if not draft:
            return Response({
                "success": False,
                "message": "Registration session not found or expired. Please register again."
            }, status=status.HTTP_404_NOT_FOUND)

        if draft.is_expired():
            draft.delete()
            return Response({
                "success": False,
                "message": "Verification code has expired (10-minute limit). Please submit registration again."
            }, status=status.HTTP_400_BAD_REQUEST)

        if draft.attempts >= 5:
            draft.delete()
            return Response({
                "success": False,
                "message": "Maximum verification attempts exceeded. Please submit registration again."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not draft.check_code(code):
            draft.attempts += 1
            draft.save(update_fields=['attempts'])
            remaining = 5 - draft.attempts
            return Response({
                "success": False,
                "message": f"Invalid verification code. {remaining} attempt(s) remaining."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Code is valid: mark verified and provision
        draft.is_verified = True
        school, admin_user = SchoolSignupWizardView._provision_school(draft.data, draft.client_ip)
        draft.delete()

        # Send welcome email
        email_provider = get_email_provider()
        subject = f"Welcome to School SaaS - {school.name}"
        text_body = (
            f"Dear {admin_user.first_name},\n\n"
            f"Congratulations! Your school '{school.name}' has been successfully setup.\n\n"
            f"Your school identifier code: {school.slug}\n"
            f"Admin username: {admin_user.username}\n\n"
            f"You can now log in to your administrative dashboard.\n\n"
            f"Best regards,\nSchool SaaS Platform Team"
        )
        email_provider.send_email(admin_user.email, subject, text_body)

        token = CustomTokenObtainPairSerializer.get_token(admin_user)

        return Response({
            "success": True,
            "message": "Email verified successfully! School has been created.",
            "school": {
                "id": str(school.id),
                "name": school.name,
                "slug": school.slug,
                "status": school.status,
            },
            "tokens": {
                "access": str(token.access_token),
                "refresh": str(token),
            }
        }, status=status.HTTP_200_OK)


class ResendVerificationCodeView(APIView):
    """
    Public endpoint: Resends verification code with a 60-second cooldown enforcement.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        draft_id = request.data.get('draft_id')
        if not draft_id:
            return Response({"success": False, "message": "draft_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        draft = SchoolRegistrationDraft.objects.filter(id=draft_id).first()
        if not draft or draft.is_verified:
            return Response({"success": False, "message": "Registration session not found or already completed."}, status=status.HTTP_404_NOT_FOUND)

        if not draft.can_resend():
            elapsed = (timezone.now() - draft.last_sent_at).total_seconds()
            wait_seconds = int(max(1, 60 - elapsed))
            return Response({
                "success": False,
                "message": f"Please wait {wait_seconds} seconds before requesting a new code.",
                "wait_seconds": wait_seconds
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate new code
        code = f"{secrets.randbelow(900000) + 100000:06d}"
        draft.set_code(code)
        draft.last_sent_at = timezone.now()
        draft.save()

        email_provider = get_email_provider()
        subject = f"Your New School SaaS Verification Code: {code}"
        text_body = f"Your new 6-digit verification code is: {code}\nThis code expires in 10 minutes."
        email_provider.send_email(draft.admin_email, subject, text_body)

        resp_data = {
            "success": True,
            "message": "A new verification code has been dispatched to your email.",
        }
        if getattr(settings, 'DEBUG', False) or getattr(settings, 'TESTING', False):
            resp_data["dev_code"] = code

        return Response(resp_data, status=status.HTTP_200_OK)
