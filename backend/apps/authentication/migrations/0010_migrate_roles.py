# Generated manually to safely migrate roles: headmaster -> principal, school_admin -> org_admin/owner, superadmin -> platform_admin
from django.db import migrations

def forward_migrate_roles(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    School = apps.get_model('core', 'School')
    SchoolRolePermission = apps.get_model('core', 'SchoolRolePermission')

    # 1. Update platform superadmins
    User.objects.filter(role='superadmin').update(role='platform_admin')

    # 2. Update headmasters to principals
    User.objects.filter(role='headmaster').update(role='principal')

    # 3. For each school, promote the earliest school_admin to owner, others to org_admin
    for school in School.objects.all():
        admins = list(User.objects.filter(school=school, role='school_admin').order_by('date_joined'))
        if admins:
            first_admin = admins[0]
            first_admin.role = 'owner'
            first_admin.save(update_fields=['role'])
            for other in admins[1:]:
                other.role = 'org_admin'
                other.save(update_fields=['role'])

    # Any remaining school_admin without school
    User.objects.filter(role='school_admin').update(role='org_admin')

    # 4. Migrate SchoolRolePermission
    SchoolRolePermission.objects.filter(role='headmaster').update(role='principal')
    SchoolRolePermission.objects.filter(role='school_admin').update(role='org_admin')


def reverse_migrate_roles(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    SchoolRolePermission = apps.get_model('core', 'SchoolRolePermission')

    User.objects.filter(role='platform_admin').update(role='superadmin')
    User.objects.filter(role='principal').update(role='headmaster')
    User.objects.filter(role__in=['owner', 'org_admin']).update(role='school_admin')

    SchoolRolePermission.objects.filter(role='principal').update(role='headmaster')
    SchoolRolePermission.objects.filter(role__in=['owner', 'org_admin']).update(role='school_admin')


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0009_user_assigned_campuses_user_primary_campus_and_more'),
        ('core', '0007_campus_city_campus_is_active_campus_latitude_and_more'),
    ]

    operations = [
        migrations.RunPython(forward_migrate_roles, reverse_migrate_roles),
    ]
