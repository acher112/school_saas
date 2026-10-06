"""
Core multi-tenancy models, academic sessions, role permissions, and tenant isolation abstractions.
"""
import uuid
from django.db import models, transaction
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
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
    country = models.CharField(max_length=64, default="Pakistan")
    currency = models.CharField(max_length=3, default="PKR")
    timezone = models.CharField(max_length=64, default="Asia/Karachi")

    # Dynamic branding tokens
    logo = models.URLField(blank=True, null=True)
    brand_primary_color = models.CharField(max_length=7, default="#2563EB", help_text="Hex code for primary brand color.")
    brand_accent_color = models.CharField(max_length=7, default="#F59E0B", help_text="Hex code for secondary accent color.")

    is_active = models.BooleanField(default=True, db_index=True, help_text="Designates whether this school subscription is active.")
    is_demo_school = models.BooleanField(default=False, help_text="Identifies pre-seeded demonstration schools.")
    has_sample_data = models.BooleanField(default=False, help_text="Indicates whether sample test data has been populated.")

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
    Explicit manager for platform-level / cross-tenant queries (e.g., landlord superadmin).
    """
    pass

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

    # Scoped manager is default; global manager is explicit
    objects = TenantManager()
    all_objects = GlobalManager()

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
            original = self.__class__.all_objects.filter(pk=self.pk).values('school_id').first()
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

        self.full_clean()
        super().save(*args, **kwargs)


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
            with transaction.atomic():
                AcademicSession.all_objects.filter(
                    school_id=self.school_id or (get_current_school().id if get_current_school() else None),
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
