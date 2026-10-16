"""
Migration to apply PostgreSQL Row-Level Security (RLS) policies and table grants to
StudentProfile and StaffProfile tenant tables.
"""
from django.db import migrations

TENANT_TABLES = [
    'authentication_studentprofile',
    'authentication_staffprofile',
]

def apply_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        for table in TENANT_TABLES:
            cursor.execute(f'''
                GRANT SELECT, INSERT, UPDATE, DELETE ON "{table}" TO school_saas_app;
                ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE "{table}" FORCE ROW LEVEL SECURITY;
                DROP POLICY IF EXISTS tenant_isolation_policy ON "{table}";
                CREATE POLICY tenant_isolation_policy ON "{table}"
                    AS PERMISSIVE
                    FOR ALL
                    USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
                    WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
            ''')

def revert_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        for table in TENANT_TABLES:
            cursor.execute(f'''
                DROP POLICY IF EXISTS tenant_isolation_policy ON "{table}";
                ALTER TABLE "{table}" NO FORCE ROW LEVEL SECURITY;
                ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY;
            ''')

class Migration(migrations.Migration):
    dependencies = [
        ('authentication', '0007_parentstudentrelation_is_primary_and_more'),
    ]

    operations = [
        migrations.RunPython(apply_rls, revert_rls),
    ]
