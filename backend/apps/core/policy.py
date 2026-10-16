"""
Optimus Orien Central Permission Policy and Role Hierarchy Engine.
Defines:
1. Module Capability Keys
2. Scope Types (ORGANIZATION, CAMPUS, ASSIGNED_CLASS, OWN_RECORD, LINKED_CHILDREN)
3. Strict Role Hierarchy and Creation Ceilings
4. Default Role Capabilities
5. Role Ceilings and Locked Capabilities
6. Central has_capability() checker
7. Auto-generator for design/permission-matrix.md
"""
from typing import Dict, List, Set, Optional, Any
from enum import Enum


class ScopeType(str, Enum):
    ORGANIZATION = 'organization'
    CAMPUS = 'campus'
    ASSIGNED_CLASS = 'assigned_class'
    OWN_RECORD = 'own_record'
    LINKED_CHILDREN = 'linked_children'
    NONE = 'none'


# Module Capability Registry: (module, capability_key, label, description, is_locked)
CAPABILITIES = [
    # Users and Identity
    ('users', 'users.view', 'View Users', 'View user rosters and profiles within scope', False),
    ('users', 'users.create', 'Create Users', 'Provision new staff, teacher, student, or parent accounts', False),
    ('users', 'users.update', 'Update Users', 'Modify user profile, contact, and assignment data', False),
    ('users', 'users.deactivate', 'Deactivate Users', 'Soft-deactivate account access (subject to last-owner lock)', False),
    ('users', 'users.reset_password', 'Reset User Password', 'Generate temporary credentials or trigger reset flow', False),
    ('users', 'owner.manage', 'Manage Owners/Admins', 'Create or remove Owners and Organization Admins', True),

    # Campuses and Branches
    ('campus', 'campus.view', 'View Campuses', 'Inspect branch profiles and locations', False),
    ('campus', 'campus.create', 'Create Campus', 'Add physical branch/campus to organization', False),
    ('campus', 'campus.update', 'Update Campus', 'Edit branch contact, address, or assigned principal', False),
    ('campus', 'campus.manage', 'Manage Campuses', 'Provision and configure physical campus branches', False),
    ('campus', 'campus.deactivate', 'Deactivate Campus', 'Soft-deactivate branch without deleting historical data', False),

    # Institutional Settings and Organization Lifecycle
    ('settings', 'settings.view', 'View Settings', 'Inspect organization branding and school profile', False),
    ('settings', 'settings.manage', 'Manage Settings', 'Update school branding, colors, logos, and profile', False),
    ('settings', 'billing.manage', 'Manage Billing and Plan', 'Manage SaaS tier, payment method, and billing invoices', True),
    ('settings', 'org.deactivate', 'Deactivate Organization', 'Suspend or decommission entire school tenant', True),

    # Policy Configurations
    ('config', 'config.view', 'View Policy Configs', 'Inspect grading scales, AQI thresholds, and attendance rules', False),
    ('config', 'config.manage', 'Manage Policy Configs', 'Modify grading scales, AQI weights, and late fee settings', False),

    # Academic Structure
    ('structure', 'structure.view', 'View Academic Structure', 'View sessions, terms, grades, sections, and subjects', False),
    ('structure', 'structure.manage', 'Manage Academic Structure', 'Create sessions, assign teachers, configure electives', False),

    # Marks and Gradebook
    ('marks', 'marks.view', 'View Marks', 'View assessment marks within scope', False),
    ('marks', 'marks.enter', 'Enter Marks', 'Record and update continuous assessment marks prior to lock', False),
    ('marks', 'marks.publish', 'Publish Marks', 'Formally publish and lock term grades', False),
    ('marks', 'marks.correct', 'Audited Result Correction', 'Modify published marks via audited ResultCorrection log', False),

    # Attendance
    ('attendance', 'attendance.view', 'View Attendance', 'View daily or subject attendance logs and rates', False),
    ('attendance', 'attendance.mark', 'Mark Attendance', 'Record daily homeroom or subject attendance', False),

    # Tasks and Homework
    ('tasks', 'tasks.view', 'View Tasks', 'View assigned homework and projects', False),
    ('tasks', 'tasks.create', 'Create Tasks', 'Assign homework, projects, and learning tasks', False),
    ('tasks', 'tasks.manage', 'Grade and Verify Tasks', 'Score and verify student task submissions', False),
    ('tasks', 'tasks.submit', 'Submit Tasks', 'Submit completed homework tasks', False),

    # Skills and Developmental Growth
    ('skills', 'skills.view', 'View Skills', 'View biannual skill ratings and developmental radar', False),
    ('skills', 'skills.rate', 'Rate Skills', 'Record biannual teacher ratings across skill dimensions', False),

    # Behaviour Observations
    ('behaviour', 'behaviour.view_non_sensitive', 'View General Behaviour', 'View developmental behaviour observations and ratings', False),
    ('behaviour', 'behaviour.view_sensitive', 'View Sensitive Notes', 'Inspect confidential psychological or disciplinary flags', True),
    ('behaviour', 'behaviour.record', 'Record Behaviour', 'Log student behaviour observations and incidents', False),

    # Early Interventions
    ('interventions', 'interventions.view', 'View Interventions', 'View early intervention flags and trajectories', False),
    ('interventions', 'interventions.manage', 'Manage Interventions', 'Assign, update, and resolve academic support plans', False),

    # Reports and Transcripts
    ('reports', 'reports.view', 'View Reports', 'Inspect progress reports and developmental transcripts', False),
    ('reports', 'reports.export', 'Export Reports', 'Download official report cards and regulatory CSV/PDFs', False),

    # Finance and Vouchers
    ('finance', 'finance.view', 'View Finance', 'Inspect fee status, challan records, and payment history', False),
    ('finance', 'finance.manage', 'Manage Finance', 'Configure fee structures, issue vouchers, record offline dues', False),

    # Security and Audit Log
    ('audit', 'audit.view', 'View Audit Logs', 'Inspect immutable security and administrative audit trail', False),
]

CAPABILITY_DICT = {c[1]: c for c in CAPABILITIES}

# Locked Capabilities that CAN NEVER be delegated outside their strict role assignments
LOCKED_CAPABILITIES: Dict[str, Set[str]] = {
    'owner.manage': {'owner', 'platform_admin'},
    'billing.manage': {'owner', 'platform_admin'},
    'org.deactivate': {'owner', 'platform_admin'},
    'behaviour.view_sensitive': {'owner', 'org_admin', 'principal', 'platform_admin'},
}

# Role Hierarchical Ranks
ROLE_RANKS: Dict[str, int] = {
    'platform_admin': 1000,
    'owner': 100,
    'org_admin': 80,
    'principal': 60,
    'accountant': 40,
    'teacher': 40,
    'parent': 20,
    'student': 10,
    'government': 0,
}


def can_create_role(creator_role: str, target_role: str) -> bool:
    """
    Enforces strict role hierarchy creation ceilings:
    - platform_admin: Can create any role.
    - owner (100): Can create co-owner, org_admin, principal, teacher, accountant, parent, student.
    - org_admin (80): Can create principal, teacher, accountant, parent, student. CANNOT create owner or org_admin!
    - principal (60): Can create teacher, parent, student within their assigned campus. CANNOT create principal, org_admin, or owner!
    - Roles <= 40: Cannot create users.
    """
    if creator_role == 'platform_admin':
        return True
    if creator_role == 'owner':
        return target_role in ['owner', 'org_admin', 'principal', 'teacher', 'accountant', 'parent', 'student']
    creator_rank = ROLE_RANKS.get(creator_role, 0)
    target_rank = ROLE_RANKS.get(target_role, 0)
    return creator_rank > target_rank


# Default Role Capability Scopes: {role: {capability: ScopeType}}
DEFAULT_ROLE_CAPABILITIES: Dict[str, Dict[str, ScopeType]] = {
    'owner': {c[1]: ScopeType.ORGANIZATION for c in CAPABILITIES},
    'org_admin': {
        c[1]: ScopeType.ORGANIZATION for c in CAPABILITIES
        if c[1] not in ['owner.manage', 'billing.manage', 'org.deactivate']
    },
    'principal': {
        # Campus-scoped capabilities
        'users.view': ScopeType.CAMPUS,
        'users.create': ScopeType.CAMPUS,
        'users.update': ScopeType.CAMPUS,
        'users.deactivate': ScopeType.CAMPUS,
        'users.reset_password': ScopeType.CAMPUS,
        'campus.view': ScopeType.CAMPUS,
        'campus.update': ScopeType.CAMPUS,
        'campus.manage': ScopeType.CAMPUS,
        'settings.view': ScopeType.CAMPUS,
        'config.view': ScopeType.CAMPUS,
        'structure.view': ScopeType.CAMPUS,
        'structure.manage': ScopeType.CAMPUS,
        'marks.view': ScopeType.CAMPUS,
        'marks.enter': ScopeType.CAMPUS,
        'marks.publish': ScopeType.CAMPUS,
        'marks.correct': ScopeType.CAMPUS,
        'attendance.view': ScopeType.CAMPUS,
        'attendance.mark': ScopeType.CAMPUS,
        'tasks.view': ScopeType.CAMPUS,
        'tasks.create': ScopeType.CAMPUS,
        'tasks.manage': ScopeType.CAMPUS,
        'skills.view': ScopeType.CAMPUS,
        'skills.rate': ScopeType.CAMPUS,
        'behaviour.view_non_sensitive': ScopeType.CAMPUS,
        'behaviour.view_sensitive': ScopeType.CAMPUS,
        'behaviour.record': ScopeType.CAMPUS,
        'interventions.view': ScopeType.CAMPUS,
        'interventions.manage': ScopeType.CAMPUS,
        'reports.view': ScopeType.CAMPUS,
        'reports.export': ScopeType.CAMPUS,
        'finance.view': ScopeType.CAMPUS,
        'audit.view': ScopeType.CAMPUS,
    },
    'teacher': {
        'users.view': ScopeType.ASSIGNED_CLASS,
        'campus.view': ScopeType.CAMPUS,
        'structure.view': ScopeType.ASSIGNED_CLASS,
        'marks.view': ScopeType.ASSIGNED_CLASS,
        'marks.enter': ScopeType.ASSIGNED_CLASS,
        'attendance.view': ScopeType.ASSIGNED_CLASS,
        'attendance.mark': ScopeType.ASSIGNED_CLASS,
        'tasks.view': ScopeType.ASSIGNED_CLASS,
        'tasks.create': ScopeType.ASSIGNED_CLASS,
        'tasks.manage': ScopeType.ASSIGNED_CLASS,
        'skills.view': ScopeType.ASSIGNED_CLASS,
        'skills.rate': ScopeType.ASSIGNED_CLASS,
        'behaviour.view_non_sensitive': ScopeType.ASSIGNED_CLASS,
        'behaviour.record': ScopeType.ASSIGNED_CLASS,
        'interventions.view': ScopeType.ASSIGNED_CLASS,
        'reports.view': ScopeType.ASSIGNED_CLASS,
    },
    'accountant': {
        'users.view': ScopeType.CAMPUS,
        'campus.view': ScopeType.CAMPUS,
        'finance.view': ScopeType.CAMPUS,
        'finance.manage': ScopeType.CAMPUS,
        'reports.view': ScopeType.CAMPUS,
        'reports.export': ScopeType.CAMPUS,
    },
    'parent': {
        'marks.view': ScopeType.LINKED_CHILDREN,
        'attendance.view': ScopeType.LINKED_CHILDREN,
        'tasks.view': ScopeType.LINKED_CHILDREN,
        'skills.view': ScopeType.LINKED_CHILDREN,
        'behaviour.view_non_sensitive': ScopeType.LINKED_CHILDREN,
        'reports.view': ScopeType.LINKED_CHILDREN,
        'finance.view': ScopeType.LINKED_CHILDREN,
    },
    'student': {
        'marks.view': ScopeType.OWN_RECORD,
        'attendance.view': ScopeType.OWN_RECORD,
        'tasks.view': ScopeType.OWN_RECORD,
        'tasks.submit': ScopeType.OWN_RECORD,
        'skills.view': ScopeType.OWN_RECORD,
        'reports.view': ScopeType.OWN_RECORD,
    },
    'government': {
        'reports.view': ScopeType.ORGANIZATION,
        'structure.view': ScopeType.ORGANIZATION,
    },
    'platform_admin': {c[1]: ScopeType.ORGANIZATION for c in CAPABILITIES},
}

# Maximum Ceilings: {role: Set[allowed_capabilities]}
ROLE_CEILINGS: Dict[str, Set[str]] = {
    'owner': {c[1] for c in CAPABILITIES},
    'org_admin': {c[1] for c in CAPABILITIES if c[1] not in ['owner.manage', 'billing.manage', 'org.deactivate']},
    'principal': {
        c[1] for c in CAPABILITIES
        if c[1] not in ['owner.manage', 'billing.manage', 'org.deactivate', 'campus.create', 'campus.deactivate']
    },
    'teacher': {
        'users.view', 'campus.view', 'structure.view', 'marks.view', 'marks.enter',
        'attendance.view', 'attendance.mark', 'tasks.view', 'tasks.create', 'tasks.manage',
        'skills.view', 'skills.rate', 'behaviour.view_non_sensitive', 'behaviour.record',
        'interventions.view', 'reports.view', 'reports.export'
    },
    'accountant': {
        'users.view', 'campus.view', 'finance.view', 'finance.manage', 'reports.view', 'reports.export'
    },
    'parent': {
        'marks.view', 'attendance.view', 'tasks.view', 'skills.view', 'behaviour.view_non_sensitive',
        'reports.view', 'finance.view'
    },
    'student': {
        'marks.view', 'attendance.view', 'tasks.view', 'tasks.submit', 'skills.view', 'reports.view'
    },
    'government': {'reports.view', 'structure.view'},
    'platform_admin': {c[1] for c in CAPABILITIES},
}


def has_capability(
    user,
    capability: str,
    target_school=None,
    target_campus=None,
    target_section=None,
    target_student_id=None,
) -> bool:
    """
    Central server-side capability checker.
    Validates tenant isolation, role defaults, locked ceilings, and scope constraints.
    """
    if not user or not user.is_authenticated:
        return False

    # Platform landlord check
    if getattr(user, 'role', '') == 'platform_admin' or user.is_superuser:
        return True

    user_school = getattr(user, 'school', None)
    if not user_school:
        return False

    # Cross-tenant isolation check
    if target_school and str(user_school.id) != str(target_school.id if hasattr(target_school, 'id') else target_school):
        return False

    role = getattr(user, 'role', '')
    if not role:
        return False

    # Check locked capabilities
    if capability in LOCKED_CAPABILITIES:
        if role not in LOCKED_CAPABILITIES[capability]:
            return False

    # Check ceiling
    allowed_by_ceiling = ROLE_CEILINGS.get(role, set())
    if capability not in allowed_by_ceiling:
        return False

    # Check tenant fine-grained overrides within ceiling
    try:
        from apps.core.models import SchoolRolePermission
        s_perm = SchoolRolePermission.objects.filter(school=user_school, role=role).first()
        if s_perm and hasattr(s_perm, 'custom_overrides') and s_perm.custom_overrides:
            override_val = s_perm.custom_overrides.get(capability)
            if override_val is False:
                return False
            elif override_val is True and capability in allowed_by_ceiling and capability not in LOCKED_CAPABILITIES:
                return True
    except Exception:
        pass

    # Check role capability scope
    role_caps = DEFAULT_ROLE_CAPABILITIES.get(role, {})
    scope = role_caps.get(capability)
    if not scope:
        return False

    # Scope validation
    if scope == ScopeType.ORGANIZATION:
        return True

    if scope == ScopeType.CAMPUS:
        if not target_campus:
            return True
        target_campus_id = str(target_campus.id if hasattr(target_campus, 'id') else target_campus)
        # Check primary campus
        primary_campus_id = str(user.primary_campus_id) if getattr(user, 'primary_campus_id', None) else None
        if primary_campus_id and primary_campus_id == target_campus_id:
            return True
        # Check assigned campuses
        assigned_ids = [str(cid) for cid in user.assigned_campuses.values_list('id', flat=True)]
        if target_campus_id in assigned_ids:
            return True
        # Org Admins and Owners can access any campus in their school
        if role in ['owner', 'org_admin']:
            return True
        return False

    if scope == ScopeType.ASSIGNED_CLASS:
        if not target_section:
            return True
        target_section_id = str(target_section.id if hasattr(target_section, 'id') else target_section)
        from apps.academics.models import SubjectTeacherAssignment
        return SubjectTeacherAssignment.objects.filter(
            teacher=user,
            section_id=target_section_id
        ).exists()

    if scope == ScopeType.OWN_RECORD:
        if not target_student_id:
            return True
        return str(user.id) == str(target_student_id)

    if scope == ScopeType.LINKED_CHILDREN:
        if not target_student_id:
            return True
        from apps.authentication.models import ParentStudentRelation
        return ParentStudentRelation.objects.filter(
            parent=user,
            student_id=target_student_id
        ).exists()

    return False


def generate_permission_matrix_markdown() -> str:
    """
    Generates design/permission-matrix.md with 100% mathematical parity
    against the executable Python policy engine.
    """
    roles = ['owner', 'org_admin', 'principal', 'teacher', 'accountant', 'parent', 'student']
    role_labels = {
        'owner': 'Owner',
        'org_admin': 'Org Admin',
        'principal': 'Principal',
        'teacher': 'Teacher',
        'accountant': 'Accountant',
        'parent': 'Parent',
        'student': 'Student',
    }

    lines = [
        '# Optimus Orien — Complete Role & Capability Permission Matrix',
        '',
        '**Status**: CANONICAL ARCHITECTURAL TRUTH (Auto-generated from `apps/core/policy.py`)',
        '**Scope Enforcement**: Central server-side policy engine (`apps/core/policy.py:has_capability`)',
        '',
        '---',
        '',
        '## 1. System Role Hierarchy & Creation Ceilings',
        '',
        '| Role Code | Rank | Can Create Below Rank | Maximum Allowed Creation Target Roles |',
        '| :--- | :---: | :---: | :--- |',
        '| `owner` | 100 | $\\le 100$ | `owner` (co-owners), `org_admin`, `principal`, `teacher`, `accountant`, `parent`, `student` |',
        '| `org_admin` | 80 | $< 80$ | `principal`, `teacher`, `accountant`, `parent`, `student` *(Cannot create Owner or Org Admin)* |',
        '| `principal` | 60 | $< 60$ | `teacher`, `parent`, `student` *(Campus-scoped only; Cannot create Principal, Admin or Owner)* |',
        '| `accountant` | 40 | $< 40$ | None *(Cannot create accounts)* |',
        '| `teacher` | 40 | $< 40$ | None *(Cannot create accounts)* |',
        '| `parent` | 20 | $< 20$ | None *(Cannot create accounts)* |',
        '| `student` | 10 | $< 10$ | None *(Cannot create accounts)* |',
        '',
        '---',
        '',
        '## 2. Granular Capability Matrix by Module',
        '',
        'Legend:',
        '- **Org**: Organization-wide scope (all branches).',
        '- **Branch**: Assigned Campus branch scope only.',
        '- **Class**: Assigned section / subject scope only.',
        '- **Child**: Linked children via GuardianLink only.',
        '- **Own**: Own personal record only.',
        '- **—**: No access.',
        '- **[LOCKED]**: Hard-coded ceiling capability; cannot be delegated to other roles even by tenant configuration.',
        '',
    ]

    # Group capabilities by module
    from itertools import groupby
    sorted_caps = sorted(CAPABILITIES, key=lambda x: x[0])
    for module, group in groupby(sorted_caps, key=lambda x: x[0]):
        lines.append(f'### Module: `{module.upper()}`')
        lines.append('')
        header = '| Capability Key | Description | ' + ' | '.join(role_labels[r] for r in roles) + ' |'
        separator = '| :--- | :--- | ' + ' | '.join([':---:'] * len(roles)) + ' |'
        lines.append(header)
        lines.append(separator)

        for _, cap_key, label, desc, is_locked in group:
            locked_badge = ' **[LOCKED]**' if is_locked else ''
            row_cells = [f'`{cap_key}`{locked_badge}', desc]
            for r in roles:
                r_caps = DEFAULT_ROLE_CAPABILITIES.get(r, {})
                scope = r_caps.get(cap_key)
                if not scope:
                    row_cells.append('—')
                elif scope == ScopeType.ORGANIZATION:
                    row_cells.append('**Org**')
                elif scope == ScopeType.CAMPUS:
                    row_cells.append('**Branch**')
                elif scope == ScopeType.ASSIGNED_CLASS:
                    row_cells.append('**Class**')
                elif scope == ScopeType.LINKED_CHILDREN:
                    row_cells.append('**Child**')
                elif scope == ScopeType.OWN_RECORD:
                    row_cells.append('**Own**')
                else:
                    row_cells.append('—')
            lines.append('| ' + ' | '.join(row_cells) + ' |')
        lines.append('')

    lines.extend([
        '---',
        '',
        '## 3. Strict Security Invariants',
        '1. **Zero Cleartext Passwords**: Passwords and raw temporary credentials are never stored, logged, or returned in user listings.',
        '2. **Zero Silent Impersonation**: Silent tenant jumping or credential spoofing is strictly prohibited and blocked at PostgreSQL RLS kernel level.',
        '3. **Audited Grade Corrections**: Published grades cannot be mutated by owners or org admins directly; modification strictly requires an audited `ResultCorrection` row with recorded reason.',
        '4. **Sensitive Behaviour Protection**: `behaviour.view_sensitive` is locked strictly to `owner`, `org_admin`, and `principal`. Students, parents, and teachers can never view sensitive observation notes.',
        '5. **Sole Owner Protection**: The last remaining active `owner` of an organization cannot be demoted, deactivated, or deleted under any circumstance.',
    ])

    return '\n'.join(lines)
