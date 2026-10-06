"""
Management command to seed realistic demonstration school tenants and test accounts.
Creates two distinct schools with isolated campuses, academic sessions, role permissions,
sample announcements, and test users for all standard roles.
"""
import secrets
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import (
    School,
    Campus,
    Domain,
    AcademicSession,
    SchoolRolePermission,
    SchoolAnnouncement,
)
from apps.authentication.models import User, UserRole

DEFAULT_ROLES = [
    (UserRole.SCHOOL_ADMIN, True, True, True, True, True, True, True),
    (UserRole.HEADMASTER, True, True, True, True, False, True, True),
    (UserRole.TEACHER, False, True, True, True, False, False, False),
    (UserRole.ACCOUNTANT, False, False, False, False, True, True, False),
    (UserRole.STUDENT, False, False, False, False, False, False, False),
    (UserRole.PARENT, False, False, False, False, False, False, False),
]

class Command(BaseCommand):
    help = "Seeds demonstration schools and role accounts for evaluation."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Removes existing demo schools before reseeding.',
        )
        parser.add_argument(
            '--password',
            type=str,
            default=None,
            help='Custom fixed password for all seeded accounts (defaults to generated strong passwords).',
        )

    def handle(self, *args, **options):
        reset = options['reset']
        fixed_password = options['password']

        if reset:
            self.stdout.write(self.style.WARNING("Resetting existing demo schools..."))
            demo_schools = School.objects.filter(is_demo_school=True)
            for s in demo_schools:
                # Delete users belonging to demo school
                User.objects.filter(school=s).delete()
                s.delete()
            self.stdout.write(self.style.SUCCESS("Demo schools cleaned."))

        schools_config = [
            {
                "name": "Lahore Grammar City Campus",
                "slug": "lgc",
                "email": "contact@lgc.edu.pk",
                "phone": "+92 42 35870001",
                "city": "Lahore",
                "brand_primary": "#1E40AF",
                "brand_accent": "#F59E0B",
                "campus_name": "Gulberg Main Campus",
                "campus_code": "MAIN",
                "users": [
                    ("admin_lgc", "admin@lgc.edu.pk", UserRole.SCHOOL_ADMIN, "Tariq", "Mahmood"),
                    ("principal_lgc", "principal@lgc.edu.pk", UserRole.HEADMASTER, "Ayesha", "Khan"),
                    ("teacher_lgc", "teacher@lgc.edu.pk", UserRole.TEACHER, "Bilal", "Ahmed"),
                    ("accountant_lgc", "accountant@lgc.edu.pk", UserRole.ACCOUNTANT, "Farhan", "Raza"),
                ],
                "announcements": [
                    ("Fall 2026 Orientation", "All faculty and student orientations commence on Monday."),
                    ("Fee Policy Notice", "Quarterly tuition fee vouchers have been published."),
                ]
            },
            {
                "name": "Beacon Public Academy",
                "slug": "bpa",
                "email": "info@bpa.edu.pk",
                "phone": "+92 51 2890002",
                "city": "Islamabad",
                "brand_primary": "#047857",
                "brand_accent": "#D97706",
                "campus_name": "F-8 Capital Campus",
                "campus_code": "MAIN",
                "users": [
                    ("admin_bpa", "admin@bpa.edu.pk", UserRole.SCHOOL_ADMIN, "Nasir", "Ali"),
                    ("teacher_bpa", "teacher@bpa.edu.pk", UserRole.TEACHER, "Sana", "Malik"),
                ],
                "announcements": [
                    ("Annual Sports Gala", "Registrations for track and field events are now open."),
                ]
            }
        ]

        created_credentials = []

        for conf in schools_config:
            if School.objects.filter(slug=conf['slug']).exists():
                self.stdout.write(self.style.NOTICE(f"School '{conf['slug']}' already exists. Skipping."))
                continue

            with transaction.atomic():
                school = School.objects.create(
                    name=conf['name'],
                    slug=conf['slug'],
                    contact_email=conf['email'],
                    contact_phone=conf['phone'],
                    city=conf['city'],
                    brand_primary_color=conf['brand_primary'],
                    brand_accent_color=conf['brand_accent'],
                    is_demo_school=True,
                    has_sample_data=True,
                )

                campus = Campus.objects.create(
                    school=school,
                    name=conf['campus_name'],
                    code=conf['campus_code'],
                    is_main=True,
                )

                Domain.objects.create(
                    school=school,
                    domain=f"{conf['slug']}.myschoolsaas.com",
                    is_primary=True,
                )

                AcademicSession.objects.create(
                    school=school,
                    name="2026-2027",
                    start_date=date(2026, 8, 1),
                    end_date=date(2027, 6, 30),
                    is_current=True,
                )

                for role_tuple in DEFAULT_ROLES:
                    SchoolRolePermission.objects.create(
                        school=school,
                        role=role_tuple[0],
                        can_manage_academics=role_tuple[1],
                        can_create_timetable=role_tuple[2],
                        can_mark_attendance=role_tuple[3],
                        can_enter_marks=role_tuple[4],
                        can_collect_fees=role_tuple[5],
                        can_view_reports=role_tuple[6],
                        can_manage_staff=role_tuple[7],
                    )

                for (username, email, role, first_name, last_name) in conf['users']:
                    password = fixed_password or f"Demo_{secrets.token_urlsafe(8)}!"
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        role=role,
                        school=school,
                    )
                    created_credentials.append({
                        "school": school.name,
                        "subdomain": school.slug,
                        "username": username,
                        "role": role,
                        "password": password,
                    })

                for (title, content) in conf['announcements']:
                    SchoolAnnouncement.objects.create(
                        school=school,
                        campus=campus,
                        title=title,
                        content=content,
                        is_published=True,
                    )

        self.stdout.write(self.style.SUCCESS("\nDemo schools seeded successfully!\n"))
        self.stdout.write("=" * 72)
        self.stdout.write(f"{'SCHOOL':<25} {'USERNAME':<16} {'ROLE':<14} {'PASSWORD'}")
        self.stdout.write("-" * 72)
        for cred in created_credentials:
            self.stdout.write(
                f"{cred['school'][:24]:<25} {cred['username']:<16} {cred['role']:<14} {cred['password']}"
            )
        self.stdout.write("=" * 72)
        self.stdout.write(self.style.NOTICE("Note: Store or use these demo credentials for local/testing login.\n"))
