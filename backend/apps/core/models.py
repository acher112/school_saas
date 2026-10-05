"""
Core multi-tenancy models and automatic tenant isolation abstractions.
"""
import uuid
from django.db import models
from django.core.exceptions import PermissionDenied, ValidationError
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


class SchoolAnnouncement(BaseTenantModel):
    """
    Concrete tenant-owned model used to test tenant isolation and provide school-wide notices.
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
