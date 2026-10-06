"""
PostgreSQL Row-Level Security (RLS) helpers and SQL policy generators.
Provides database-level tenant isolation defense-in-depth even against direct raw SQL queries.
"""
from django.db import connection

def get_rls_sql_for_table(table_name: str) -> str:
    """
    Generates PostgreSQL Row-Level Security DDL statements for a specific tenant table.
    Ensures that queries without 'app.current_school_id' session variable set return 0 rows.
    """
    return f"""
    -- Enable and force RLS on the table
    ALTER TABLE "{table_name}" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "{table_name}" FORCE ROW LEVEL SECURITY;

    -- Drop existing policy if present
    DROP POLICY IF EXISTS tenant_isolation_policy ON "{table_name}";

    -- Create strict permissive isolation policy with USING and WITH CHECK
    CREATE POLICY tenant_isolation_policy ON "{table_name}"
        AS PERMISSIVE
        FOR ALL
        USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
        WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
    """

def apply_rls_to_table(table_name: str):
    """
    Applies RLS policy to a table if connected to a PostgreSQL database.
    Silently ignores non-PostgreSQL databases (e.g. SQLite in local tests).
    """
    if connection.vendor == 'postgresql':
        sql = get_rls_sql_for_table(table_name)
        with connection.cursor() as cursor:
            cursor.execute(sql)
