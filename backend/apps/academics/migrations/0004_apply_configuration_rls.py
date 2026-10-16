"""
Migration to apply PostgreSQL Row-Level Security (RLS) policies and grants to
all Academics configuration and result correction tenant tables.
"""
from django.db import migrations

TENANT_TABLES = [
    'academics_term',
    'academics_grade',
    'academics_section',
    'academics_subject',
    'academics_subjectteacherassignment',
    'academics_studentenrollment',
    'academics_studenttransferrecord',
    'academics_assessment',
    'academics_assessmentresult',
    'academics_task',
    'academics_tasksubmission',
    'academics_attendancerecord',
    'academics_participationrecord',
    'academics_behaviourcategory',
    'academics_behaviourrecord',
    'academics_skilldimension',
    'academics_skillrating',
    'academics_aqisnapshot',
    'academics_earlyinterventionflag',
    'academics_financeoverviewcategory',
    'academics_financerecord',
    'academics_resultcorrection',
    'academics_aqiconfig',
    'academics_gradingscaleconfig',
    'academics_gradingscaleband',
    'academics_attendanceconfig',
    'academics_attendancestatusconfig',
    'academics_academicpolicyconfig',
    'academics_feepolicyconfig',
    'academics_latefeeconfig',
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
        ('academics', '0003_alter_aqisnapshot_component_breakdown_and_more'),
    ]

    operations = [
        migrations.RunPython(apply_rls, revert_rls),
    ]
