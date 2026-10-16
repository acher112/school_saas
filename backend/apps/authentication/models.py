"""
Custom User model with role-based attributes and tenant association.
Includes IP-aware LoginAttempt model to prevent denial-of-service lockouts against real users,
and first-login temporary password enforcement.
"""
import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from django.core.exceptions import ValidationError
from apps.core.models import BaseTenantModel

class UserRole(models.TextChoices):
    PLATFORM_ADMIN = "platform_admin", "Platform Admin"
    OWNER = "owner", "Organization Owner"
    ORG_ADMIN = "org_admin", "Organization Admin"
    PRINCIPAL = "principal", "Principal"
    TEACHER = "teacher", "Teacher"
    ACCOUNTANT = "accountant", "Accountant / Finance Staff"
    STUDENT = "student", "Student"
    PARENT = "parent", "Parent / Guardian"
    GOVERNMENT = "government", "Government / Oversight Placeholder"

# Backward compatibility aliases
UserRole.SUPERADMIN = UserRole.PLATFORM_ADMIN
UserRole.SCHOOL_ADMIN = UserRole.ORG_ADMIN
UserRole.HEADMASTER = UserRole.PRINCIPAL


class User(AbstractUser):
    """
    Primary user model across the platform.
    Associated with a School tenant (null for global platform admins).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        'core.School',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
        db_index=True,
        help_text="The school tenant this user belongs to (null for landlord staff)."
    )
    primary_campus = models.ForeignKey(
        'core.Campus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="primary_users",
        help_text="Primary branch/campus affiliation."
    )
    assigned_campuses = models.ManyToManyField(
        'core.Campus',
        blank=True,
        related_name="assigned_users",
        help_text="Branches this user has operational access to (e.g. multi-campus teachers)."
    )
    username = models.CharField(
        max_length=150,
        help_text="Required. 150 characters or fewer. Case-insensitive unique within school."
    )
    email = models.EmailField(
        blank=True,
        default="",
        help_text="Email address (optional for students and parents)."
    )
    google_sub = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    token_version = models.PositiveIntegerField(default=1, help_text="Incremented to force logout all sessions.")
    role = models.CharField(
        max_length=32,
        choices=UserRole.choices,
        default=UserRole.ORG_ADMIN,
        db_index=True,
        help_text="Primary system role defining default capabilities."
    )
    phone_number = models.CharField(max_length=32, blank=True, default="", db_index=True)
    preferred_language = models.CharField(
        max_length=5,
        default="en",
        choices=[("en", "English"), ("ur", "Urdu")],
        help_text="Preferred language code for UI and notifications (en, ur)."
    )
    avatar = models.URLField(blank=True, null=True)

    # Temporary password & first-login change enforcement
    must_change_password = models.BooleanField(
        default=False,
        help_text="Requires user to set a new password on their first login."
    )
    temporary_password_created_at = models.DateTimeField(null=True, blank=True)

    def is_sole_owner(self) -> bool:
        """Check if this user is the only active owner remaining in their school tenant."""
        if self.role != UserRole.OWNER or not self.school_id:
            return False
        return User.objects.filter(
            school_id=self.school_id, role=UserRole.OWNER, is_active=True
        ).exclude(pk=self.pk).count() == 0

    def clean(self):
        super().clean()
        if self.pk:
            orig = User.objects.filter(pk=self.pk).values('role', 'is_active', 'school_id').first()
            if orig and orig.get('school_id'):
                was_owner = orig['role'] == UserRole.OWNER and orig['is_active']
                now_demoted_or_deactivated = (self.role != UserRole.OWNER) or (not self.is_active)
                if was_owner and now_demoted_or_deactivated:
                    other_owners = User.objects.filter(
                        school_id=orig['school_id'], role=UserRole.OWNER, is_active=True
                    ).exclude(pk=self.pk).exists()
                    if not other_owners:
                        raise ValidationError("Security violation: Cannot deactivate or demote the sole organization owner.")

    class Meta:
        ordering = ['username']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        constraints = [
            models.UniqueConstraint(
                models.functions.Lower('username'),
                'school',
                condition=models.Q(school__isnull=False),
                name='unique_lower_username_per_school'
            ),
            models.UniqueConstraint(
                models.functions.Lower('username'),
                condition=models.Q(school__isnull=True),
                name='unique_lower_global_username'
            ),
        ]

    def __str__(self):
        school_str = f" @ {self.school.slug}" if self.school else " (Global)"
        return f"{self.username} [{self.role}]{school_str}"


class ParentStudentRelation(BaseTenantModel):
    """
    Tenant-scoped relationship linking a parent user to one or more student users.
    """
    parent = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="children_relations",
        help_text="Parent / Guardian user account."
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="parent_relations",
        help_text="Student user account."
    )
    relationship = models.CharField(
        max_length=32,
        default="guardian",
        choices=[
            ("father", "Father"),
            ("mother", "Mother"),
            ("guardian", "Guardian")
        ]
    )
    is_primary = models.BooleanField(default=True, help_text="Designates primary point of contact.")
    receives_alerts = models.BooleanField(default=True, help_text="Receives academic and attendance notifications.")

    class Meta:
        unique_together = ('school', 'parent', 'student')
        verbose_name = 'Parent Student Relation'
        verbose_name_plural = 'Parent Student Relations'

    def __str__(self):
        return f"{self.parent.username} -> {self.student.username} ({self.relationship})"


# Spec Alias
GuardianLink = ParentStudentRelation


class StudentProfile(BaseTenantModel):
    """
    Tenant-scoped student profile.
    Separated from the minimal User table to ensure 100% PostgreSQL Row-Level Security isolation.
    """
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )
    admission_number = models.CharField(max_length=64, db_index=True)
    gender = models.CharField(max_length=16, choices=GENDER_CHOICES, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    b_form_encrypted = models.TextField(
        blank=True, default="",
        help_text="Optional encrypted B-Form or National ID. Enabled per school setting."
    )
    emergency_contact = models.CharField(max_length=64, blank=True, default="")
    blood_group = models.CharField(max_length=8, blank=True, default="")
    medical_notes = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    def __str__(self):
        return f"{self.user.username} ({self.admission_number})"


class StaffProfile(BaseTenantModel):
    """
    Tenant-scoped faculty and staff profile with RLS.
    """
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_profile"
    )
    employee_id = models.CharField(max_length=64, db_index=True)
    designation = models.CharField(max_length=100, blank=True, default="Teacher")
    department = models.CharField(max_length=100, blank=True, default="Academics")
    gender = models.CharField(max_length=16, choices=GENDER_CHOICES, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=64, blank=True, default="")
    joining_date = models.DateField(null=True, blank=True)
    is_active_faculty = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'

    def __str__(self):
        return f"{self.user.username} - {self.designation} ({self.department})"



class UserLoginAttempt(models.Model):
    """
    Tracks failed login attempts keyed by (username, client_ip).
    Provides time-based lockout protection without allowing external attackers
    on different IPs to permanently lock out legitimate users.
    """
    username = models.CharField(max_length=150, db_index=True)
    ip_address = models.GenericIPAddressField(db_index=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('username', 'ip_address')
        indexes = [
            models.Index(fields=['username', 'ip_address']),
        ]

    def is_locked(self) -> bool:
        """Check if this IP/account combo is currently in a 15-minute cooldown."""
        if not self.locked_until:
            return False

        if self.locked_until > timezone.now():
            return True

        # Lockout period expired - clear the lock
        self.locked_until = None
        self.failed_attempts = 0
        self.save(update_fields=['locked_until', 'failed_attempts'])
        return False

    def record_failure(self):
        """Record a failed login. Locks for 15 minutes upon 5 consecutive failures."""
        now = timezone.now()
        # If last failure was more than 15 minutes ago, reset attempt counter
        if self.last_attempt_at and (now - self.last_attempt_at) > timedelta(minutes=15):
            self.failed_attempts = 1
        else:
            self.failed_attempts += 1

        if self.failed_attempts >= 5:
            self.locked_until = now + timedelta(minutes=15)

        self.save()

    def reset_failures(self):
        """Reset failures upon successful login from this IP."""
        if self.failed_attempts > 0 or self.locked_until is not None:
            self.failed_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_attempts', 'locked_until'])


class LoginOTPChallenge(models.Model):
    """
    Two-Factor Authentication challenge generated on every user login.
    Stores a hashed 6-digit confirmation code dispatched to the user's registered email.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="login_otp_challenges"
    )
    email = models.EmailField(help_text="Registered email address to which code was dispatched.")
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    code_hash = models.CharField(max_length=255)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sent_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Login OTP Challenge'
        verbose_name_plural = 'Login OTP Challenges'
        indexes = [
            models.Index(fields=['session_id'], name='auth_otp_session_idx'),
            models.Index(fields=['user', 'is_verified'], name='auth_otp_user_ver_idx'),
        ]

    def set_code(self, raw_code: str):
        from django.contrib.auth.hashers import make_password
        self.code_hash = make_password(str(raw_code).strip())

    def check_code(self, raw_code: str) -> bool:
        from django.contrib.auth.hashers import check_password
        return check_password(str(raw_code).strip(), self.code_hash)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

