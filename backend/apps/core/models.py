"""
Core multi-tenancy models, academic sessions, role permissions, and tenant isolation abstractions.
"""
import uuid
import hashlib
from datetime import timedelta
from django.db import models, transaction, connection
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.conf import settings
from apps.core.context import get_current_school

class School(models.Model):
    """
    Tenant root entity. Represents an individual school organization on the platform.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Official name of the school institution.")
    slug = models.SlugField(max_length=100, unique=True, db_index=True, help_text="Subdomain identifier.")
    contact_email = models.EmailField(help_text="Primary administrative contact email.")
    contact_phone = models.CharField(max_length=32, help_text="Official contact phone number.")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, default="Lahore")
    province = models.CharField(max_length=64, default="Punjab")
    country = models.CharField(max_length=64, default="Pakistan")
    currency = models.CharField(max_length=3, default="PKR")
    timezone = models.CharField(max_length=64, default="Asia/Karachi")

    # Institutional classification
    school_type = models.CharField(max_length=64, default="private", help_text="e.g. private, semi_government, cambridge")
    board = models.CharField(max_length=64, default="bise_lahore", help_text="Affiliated education board e.g. fbise, bise_lahore, cambridge_caie")
    levels = models.CharField(max_length=64, default="playgroup_to_matric", help_text="Educational grade levels offered")
    gender_type = models.CharField(max_length=32, default="co_education", help_text="co_education, boys_only, girls_only")
    medium_of_instruction = models.CharField(max_length=32, default="english", help_text="english, urdu, bilingual")

    # Dynamic branding tokens
    logo = models.URLField(blank=True, null=True)
    brand_primary_color = models.CharField(max_length=7, default="#2563EB", help_text="Hex code for primary brand color.")
    brand_accent_color = models.CharField(max_length=7, default="#F59E0B", help_text="Hex code for secondary accent color.")

    # Status & Authentication Governance
    status = models.CharField(
        max_length=32,
        default="active",
        choices=[
            ("active", "Active"),
            ("pending_approval", "Pending Superadmin Approval"),
            ("suspended", "Suspended")
        ],
        db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True, help_text="Designates whether this school subscription is active.")
    is_demo_school = models.BooleanField(default=False, help_text="Identifies pre-seeded demonstration schools.")
    has_sample_data = models.BooleanField(default=False, help_text="Indicates whether sample test data has been populated.")
    allow_google_login = models.BooleanField(default=True, help_text="Whether staff and students may authenticate via Google OAuth.")

    # Terms & Compliance Acceptance
    terms_version = models.CharField(max_length=32, default="v1.0")
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'School'
        verbose_name_plural = 'Schools'

    def __str__(self):
        return f"{self.name} ({self.slug})"

class Campus(models.Model):
    """
    Physical branch or campus belonging to a school.
    One campus per school in MVP UI, but architecture supports multi-campus from day one.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="campuses", db_index=True)
    name = models.CharField(max_length=255, default="Main Campus")
    code = models.CharField(max_length=32, default="MAIN")
    address = models.TextField(blank=True, default="")
    is_main = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('school', 'code')
        verbose_name = 'Campus'
        verbose_name_plural = 'Campuses'

    def __str__(self):
        return f"{self.school.name} - {self.name}"

class Domain(models.Model):
    """
    Custom or vanity domain mapped to a school tenant.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="domains", db_index=True)
    domain = models.CharField(max_length=255, unique=True, db_index=True)
    is_primary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Domain'
        verbose_name_plural = 'Domains'

    def __str__(self):
        return f"{self.domain} -> {self.school.slug}"


class TenantQuerySet(models.QuerySet):
    """
    Custom QuerySet that automatically scopes queries to the active school tenant.
    """
    def for_current_school(self):
        school = get_current_school()
        if not school:
            raise PermissionDenied("A valid tenant context is required to query this resource.")
        return self.filter(school=school)

    def _extract_filter_school_id(self):
        try:
            for child in getattr(self.query.where, 'children', []):
                if hasattr(child, 'lhs') and getattr(child.lhs, 'target', None) and getattr(child.lhs.target, 'name', None) in ('school', 'school_id'):
                    return getattr(child, 'rhs', None)
        except Exception:
            pass
        return None

    def _execute_with_tenant_scope(self, func):
        if connection.vendor != 'postgresql':
            return func()
        school_id = self._extract_filter_school_id()
        if not school_id:
            return func()
        prev_setting = None
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.current_school_id', true);")
            row = cursor.fetchone()
            prev_setting = row[0] if (row and row[0]) else ''
            if prev_setting:
                return func()
            is_local = connection.in_atomic_block
            cursor.execute("SELECT set_config('app.current_school_id', %s, %s);", [str(school_id), is_local])
        try:
            return func()
        finally:
            if prev_setting is not None and not prev_setting:
                with connection.cursor() as cursor:
                    is_local = connection.in_atomic_block
                    cursor.execute("SELECT set_config('app.current_school_id', '', %s);", [is_local])

    def _fetch_all(self):
        if self._result_cache is None:
            self._execute_with_tenant_scope(super()._fetch_all)
        return self._result_cache

    def count(self):
        return self._execute_with_tenant_scope(super().count)

    def exists(self):
        return self._execute_with_tenant_scope(super().exists)

    def aggregate(self, *args, **kwargs):
        return self._execute_with_tenant_scope(lambda: super().aggregate(*args, **kwargs))

    def iterator(self, *args, **kwargs):
        return self._execute_with_tenant_scope(lambda: list(super().iterator(*args, **kwargs)))

class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    """
    Default manager for tenant-scoped models.
    Automatically applies a WHERE school_id = <current_school_id> filter if tenant context is active.
    """
    def get_queryset(self):
        qs = super().get_queryset()
        current_school = get_current_school()
        if current_school is not None:
            return qs.filter(school=current_school)
        return qs

class GlobalManager(models.Manager.from_queryset(TenantQuerySet)):
    """
    Explicit manager for platform-level / cross-tenant queries (landlord superadmin).
    Routes queries to the dedicated 'platform' database alias (role: school_saas_platform with BYPASSRLS).
    """
    def get_queryset(self):
        qs = super().get_queryset()
        if 'platform' in settings.DATABASES:
            return qs.using('platform')
        return qs

class BaseTenantModel(models.Model):
    """
    Abstract base model that all tenant-owned entities MUST inherit from.
    Enforces automatic school assignment, tenant isolation, and audit timestamps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School,
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
        db_index=True
    )
    campus = models.ForeignKey(
        Campus,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_set",
        help_text="Associated campus branch (defaults to main campus in MVP)."
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Scoped manager is default; global manager is explicit platform routing
    objects = TenantManager()
    all_objects = GlobalManager()
    _unscoped = models.Manager()

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        # Ensure campus belongs to the same school
        if self.campus and self.school_id and self.campus.school_id != self.school_id:
            raise ValidationError({"campus": "Selected campus does not belong to this school."})

    def save(self, *args, **kwargs):
        current_school = get_current_school()

        # 1. Prevent reassigning school on existing objects FIRST (immutability of tenant ownership)
        if self.pk:
            db = self._state.db or 'default'
            original = self.__class__._unscoped.using(db).filter(pk=self.pk).values('school_id').first()
            if original and original['school_id'] != self.school_id:
                raise PermissionDenied("Security violation: Tenant ownership of an existing record cannot be altered.")

        # 2. Automatically inject current school if not explicitly provided
        if not self.school_id and current_school:
            self.school = current_school

        # 3. Prevent creating records for a different tenant
        if self.school_id and current_school and self.school_id != current_school.id:
            raise PermissionDenied("Security violation: Attempted to write records to an unauthorized tenant.")

        # 4. Default campus to school's main campus if not assigned
        if not self.campus_id and self.school_id:
            main_campus = Campus.objects.filter(school_id=self.school_id, is_main=True).first()
            if main_campus:
                self.campus = main_campus

        prev_setting = None
        if connection.vendor == 'postgresql' and self.school_id:
            with connection.cursor() as cursor:
                cursor.execute("SELECT current_setting('app.current_school_id', true);")
                row = cursor.fetchone()
                prev_setting = row[0] if (row and row[0]) else ''
                is_local = connection.in_atomic_block
                cursor.execute("SELECT set_config('app.current_school_id', %s, %s);", [str(self.school_id), is_local])

        try:
            self.full_clean()
            super().save(*args, **kwargs)
        finally:
            if connection.vendor == 'postgresql' and prev_setting is not None:
                with connection.cursor() as cursor:
                    is_local = connection.in_atomic_block
                    cursor.execute("SELECT set_config('app.current_school_id', %s, %s);", [prev_setting, is_local])

    def refresh_from_db(self, using=None, fields=None):
        prev_setting = None
        if connection.vendor == 'postgresql' and self.school_id:
            with connection.cursor() as cursor:
                cursor.execute("SELECT current_setting('app.current_school_id', true);")
                row = cursor.fetchone()
                prev_setting = row[0] if (row and row[0]) else ''
                is_local = connection.in_atomic_block
                cursor.execute("SELECT set_config('app.current_school_id', %s, %s);", [str(self.school_id), is_local])
        try:
            super().refresh_from_db(using=using, fields=fields)
        finally:
            if connection.vendor == 'postgresql' and prev_setting is not None:
                with connection.cursor() as cursor:
                    is_local = connection.in_atomic_block
                    cursor.execute("SELECT set_config('app.current_school_id', %s, %s);", [prev_setting, is_local])



class AcademicSession(BaseTenantModel):
    """
    Academic Session / Year (e.g., '2026-2027').
    All classes, enrolments, timetables, fee structures, and exams are tied to an academic session.
    Closing or switching a session preserves historical integrity.
    """
    name = models.CharField(max_length=100, help_text="Session name e.g. '2026-2027' or 'Fall 2026'.")
    start_date = models.DateField(help_text="Session starting date.")
    end_date = models.DateField(help_text="Session concluding date.")
    is_current = models.BooleanField(default=True, db_index=True, help_text="Marks this session as the active academic term.")
    is_closed = models.BooleanField(default=False, help_text="Indicates an archived session where modifications are locked.")

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['-start_date']
        verbose_name = 'Academic Session'
        verbose_name_plural = 'Academic Sessions'

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({"end_date": "End date must be strictly after the start date."})

    def save(self, *args, **kwargs):
        # Enforce that only ONE session per school is marked is_current=True
        if self.is_current:
            db = self._state.db or 'default'
            target_school_id = self.school_id or (get_current_school().id if get_current_school() else None)
            if target_school_id:
                with transaction.atomic(using=db):
                    AcademicSession._unscoped.using(db).filter(
                        school_id=target_school_id,
                        is_current=True
                    ).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        active_badge = " (Active)" if self.is_current else ""
        return f"{self.name}{active_badge}"


class SchoolRolePermission(BaseTenantModel):
    """
    Fine-grained permissions per role, customizable per school.
    Enforces capabilities such as 'teacher may create timetable' or 'accountant may collect fees'.
    """
    role = models.CharField(max_length=32, db_index=True, help_text="System role identifier.")
    can_manage_academics = models.BooleanField(default=False)
    can_create_timetable = models.BooleanField(default=False)
    can_mark_attendance = models.BooleanField(default=False)
    can_enter_marks = models.BooleanField(default=False)
    can_collect_fees = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_manage_staff = models.BooleanField(default=False)

    @classmethod
    def initialize_for_school(cls, school, campus=None):
        if not campus:
            campus = school.campuses.filter(is_main=True).first()
        from apps.authentication.models import UserRole
        default_permissions = [
            (UserRole.HEADMASTER, True, True, True, True, True, True, True),
            (UserRole.TEACHER, False, False, True, True, False, False, False),
            (UserRole.ACCOUNTANT, False, False, False, False, True, True, False),
            (UserRole.STUDENT, False, False, False, False, False, False, False),
            (UserRole.PARENT, False, False, False, False, False, False, False),
        ]
        for role_code, m_acad, c_time, m_att, e_mark, c_fee, v_rep, m_stf in default_permissions:
            cls.objects.get_or_create(
                school=school,
                role=role_code,
                defaults={
                    "campus": campus,
                    "can_manage_academics": m_acad,
                    "can_create_timetable": c_time,
                    "can_mark_attendance": m_att,
                    "can_enter_marks": e_mark,
                    "can_collect_fees": c_fee,
                    "can_view_reports": v_rep,
                    "can_manage_staff": m_stf,
                }
            )

    class Meta:
        unique_together = ('school', 'role')
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'

    def __str__(self):
        return f"[{self.school.slug}] Permissions for {self.role}"


class AuditLog(BaseTenantModel):
    """
    Immutable audit trail recording sensitive administrative actions per school.
    """
    actor = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )
    actor_username = models.CharField(max_length=150)
    actor_role = models.CharField(max_length=32)
    action = models.CharField(max_length=100, db_index=True)  # e.g., 'SESSION_CREATED', 'ROLE_PERMISSIONS_UPDATED'
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=64, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"[{self.created_at}] {self.actor_username} - {self.action} on {self.resource_type}"


class SchoolAnnouncement(BaseTenantModel):
    """
    Tenant-owned notice and announcement model.
    """
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'School Announcement'
        verbose_name_plural = 'School Announcements'

    def __str__(self):
        return f"[{self.school.slug}] {self.title}"


class SchoolRegistrationDraft(models.Model):
    """
    Pre-tenant onboarding draft.
    Holds school registration wizard submission data until the administrator's email is verified.
    No tenant tables (School, Campus, Domain, AcademicSession) are created until verification completes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_email = models.EmailField(db_index=True)
    school_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, db_index=True)
    data = models.JSONField(default=dict, help_text="Complete registration wizard payload.")
    code_hash = models.CharField(max_length=128, help_text="SHA-256 hash of 6-digit email verification code.")
    expires_at = models.DateTimeField(help_text="Verification code expiration timestamp (10 minutes).")
    attempts = models.PositiveSmallIntegerField(default=0, help_text="Verification attempts (max 5).")
    last_sent_at = models.DateTimeField(default=timezone.now, help_text="Timestamp of last code dispatch for 60s cooldown.")
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Registration Draft'
        verbose_name_plural = 'Registration Drafts'

    @staticmethod
    def hash_code(raw_code: str) -> str:
        return hashlib.sha256(raw_code.strip().encode('utf-8')).hexdigest()

    def set_code(self, raw_code: str):
        self.code_hash = self.hash_code(raw_code)
        self.expires_at = timezone.now() + timedelta(minutes=10)
        self.attempts = 0

    def check_code(self, raw_code: str) -> bool:
        if self.is_expired() or self.attempts >= 5:
            return False
        return self.code_hash == self.hash_code(raw_code)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def can_resend(self) -> bool:
        """Enforces 60-second cooldown between verification code requests."""
        if not self.last_sent_at:
            return True
        return (timezone.now() - self.last_sent_at) >= timedelta(seconds=60)


class PasswordResetToken(models.Model):
    """
    Single-use password reset token (30-minute validity).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=128, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() <= self.expires_at
