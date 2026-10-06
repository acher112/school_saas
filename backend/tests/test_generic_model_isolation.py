"""
Generic Tenant Isolation Test Suite.
Dynamically discovers all models inheriting from BaseTenantModel across the Django project
and asserts that tenant isolation guarantees hold for every single one:
1. TenantManager automatically scopes queries to the active school.
2. An entity created in School A is invisible when School B is the active tenant.
3. Attempting to assign an existing record to a different tenant is rejected.
4. Attempting to write a record for a foreign tenant is rejected.
"""
import pytest
from datetime import date
from django.apps import apps
from django.core.exceptions import PermissionDenied, ValidationError
from apps.core.models import BaseTenantModel, School
from apps.core.context import clear_current_school

def get_tenant_models():
    """Dynamically discover all non-abstract BaseTenantModel subclasses across all installed apps."""
    discovered = []
    for model in apps.get_models():
        if issubclass(model, BaseTenantModel) and model is not BaseTenantModel:
            discovered.append(model)
    return discovered

def create_model_fixture(model_cls, school, suffix="1"):
    """Creates a valid instance of any BaseTenantModel subclass for the given school."""
    kwargs = {"school": school}

    for field in model_cls._meta.fields:
        if field.name in ('id', 'school', 'campus', 'created_at', 'updated_at'):
            continue
        if field.has_default() and field.default is not None:
            continue
        if field.null:
            continue

        field_type = field.get_internal_type()
        if field_type in ('CharField', 'SlugField'):
            max_len = field.max_length or 50
            if field.choices:
                val = field.choices[0][0]
            else:
                val = f"t_{field.name}_{suffix}"[:max_len]
            kwargs[field.name] = val
        elif field_type == 'TextField':
            kwargs[field.name] = f"Test description text for {field.name} {suffix}"
        elif field_type == 'DateField':
            if field.name == 'start_date':
                kwargs[field.name] = date(2026, 1, 1)
            elif field.name == 'end_date':
                kwargs[field.name] = date(2026, 12, 31)
            else:
                kwargs[field.name] = date(2026, 5, 1)
        elif field_type == 'DateTimeField':
            from django.utils import timezone
            kwargs[field.name] = timezone.now()
        elif field_type == 'BooleanField':
            kwargs[field.name] = True
        elif field_type in ('IntegerField', 'PositiveIntegerField', 'PositiveSmallIntegerField'):
            kwargs[field.name] = 1
        elif field_type == 'JSONField':
            kwargs[field.name] = {"sample": "data"}

    return model_cls.objects.create(**kwargs)


@pytest.mark.django_db
class TestGenericModelIsolation:

    def test_all_tenant_models_enforce_isolation(self, school_factory, tenant_context):
        """
        Dynamically verifies that every registered BaseTenantModel subclass strictly
        isolates data between schools.
        """
        tenant_models = get_tenant_models()
        assert len(tenant_models) >= 3, f"Expected at least 3 tenant models, found {len(tenant_models)}: {tenant_models}"

        school_alpha = school_factory(name="Alpha Academy", slug="alpha-acad")
        school_beta = school_factory(name="Beta Grammar", slug="beta-gram")

        for model_cls in tenant_models:
            model_name = model_cls.__name__

            # 1. Create record under School Alpha context
            tenant_context(school_alpha)
            instance_alpha = create_model_fixture(model_cls, school_alpha, suffix="alpha")
            assert instance_alpha.school_id == school_alpha.id, f"{model_name} failed to attach to school_alpha"

            # 2. Create record under School Beta context
            tenant_context(school_beta)
            instance_beta = create_model_fixture(model_cls, school_beta, suffix="beta")
            assert instance_beta.school_id == school_beta.id, f"{model_name} failed to attach to school_beta"

            # 3. Assert School Beta queries CANNOT see School Alpha's instance
            scoped_beta = list(model_cls.objects.all())
            assert instance_alpha not in scoped_beta, (
                f"TENANT LEAK: {model_name} instance belonging to School Alpha leaked into School Beta's query!"
            )
            assert instance_beta in scoped_beta, (
                f"{model_name} instance for School Beta not returned in its own tenant context."
            )

            # 4. Assert School Alpha queries CANNOT see School Beta's instance
            tenant_context(school_alpha)
            scoped_alpha = list(model_cls.objects.all())
            assert instance_beta not in scoped_alpha, (
                f"TENANT LEAK: {model_name} instance belonging to School Beta leaked into School Alpha's query!"
            )
            assert instance_alpha in scoped_alpha, (
                f"{model_name} instance for School Alpha not returned in its own tenant context."
            )

            # 5. Assert cross-tenant reassignment is prevented
            instance_alpha.school = school_beta
            with pytest.raises(PermissionDenied):
                instance_alpha.save()

            # Restore instance_alpha school
            instance_alpha.school = school_alpha

            # 6. Assert attempting to create record for foreign tenant is blocked
            tenant_context(school_alpha)
            with pytest.raises(PermissionDenied):
                create_model_fixture(model_cls, school_beta, suffix="illegal")

        clear_current_school()
