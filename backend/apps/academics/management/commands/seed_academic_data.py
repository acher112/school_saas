"""
Seed command to populate rich, realistic Optimus Orien academic performance data:
Terms, Grades, Sections, Subjects, Faculty Assignments, Student Enrollments,
Assessments, Attendance, Participation, Behaviour (1-10), Skills (Biannual),
Tasks/Homework, Early Intervention Flags, and AQI Snapshots.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.core.context import set_current_school, clear_current_school
from apps.core.models import School, Campus, AcademicSession, Domain
from apps.authentication.models import User, UserRole, ParentStudentRelation, StudentProfile, StaffProfile
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    SubjectTeacherAssignment,
    StudentEnrollment,
    Assessment,
    AssessmentResult,
    AttendanceRecord,
    ParticipationRecord,
    BehaviourCategory,
    BehaviourRecord,
    SkillDimension,
    SkillRating,
    Task,
    TaskSubmission,
    EarlyInterventionFlag,
    FinanceOverviewCategory,
    FinanceRecord,
)
from apps.academics.aqi_engine import snapshot_aqi


class Command(BaseCommand):
    help = "Seeds comprehensive academic, attendance, behaviour, skill, and AQI data."

    def handle(self, *args, **options):
        self.stdout.write("Seeding Optimus Orien Academic Intelligence data...")

        # 1. School & Campus
        school, _ = School.objects.get_or_create(
            slug="optimus-orien-demo",
            defaults={
                "name": "Optimus Orien International School",
                "contact_email": "admin@optimusorien.cloud",
                "contact_phone": "+92 42 35871234",
                "city": "Lahore",
                "province": "Punjab",
                "country": "Pakistan",
                "currency": "PKR",
                "school_type": "cambridge",
                "status": "active",
                "is_active": True,
                "is_demo_school": True,
            }
        )
        set_current_school(school)

        main_campus, _ = Campus.objects.get_or_create(
            school=school,
            code="MAIN",
            defaults={"name": "Gulberg Main Campus", "is_main": True}
        )
        north_campus, _ = Campus.objects.get_or_create(
            school=school,
            code="NORTH",
            defaults={"name": "DHA North Campus", "is_main": False}
        )

        Domain.objects.get_or_create(
            school=school,
            domain="demo.optimusorien.com",
            defaults={"is_primary": True}
        )

        # 2. Academic Sessions & Terms (Multi-Session Longitudinal Hierarchy)
        session_2025, _ = AcademicSession.objects.get_or_create(
            school=school,
            name="2025-2026",
            defaults={
                "campus": main_campus,
                "start_date": date(2025, 8, 15),
                "end_date": date(2026, 6, 15),
                "is_current": False,
                "is_closed": True,
            }
        )
        term_past, _ = Term.objects.get_or_create(
            school=school,
            session=session_2025,
            name="Final Examination 2026",
            defaults={
                "campus": main_campus,
                "term_code": "FINAL_2026",
                "start_date": date(2026, 3, 1),
                "end_date": date(2026, 6, 15),
                "weight_percentage": Decimal("100.00"),
                "is_current": False,
                "is_closed": True,
            }
        )

        session_2026, _ = AcademicSession.objects.get_or_create(
            school=school,
            name="2026-2027",
            defaults={
                "campus": main_campus,
                "start_date": date(2026, 8, 15),
                "end_date": date(2027, 6, 15),
                "is_current": True,
                "is_closed": False,
            }
        )

        term_1, _ = Term.objects.get_or_create(
            school=school,
            session=session_2026,
            name="1st Term (Mid-Year)",
            defaults={
                "campus": main_campus,
                "term_code": "TERM_1",
                "start_date": date(2026, 8, 15),
                "end_date": date(2026, 11, 30),
                "weight_percentage": Decimal("30.00"),
                "is_current": False,
                "is_closed": True,
            }
        )
        term_2, _ = Term.objects.get_or_create(
            school=school,
            session=session_2026,
            name="2nd Term (Annual Final)",
            defaults={
                "campus": main_campus,
                "term_code": "TERM_2",
                "start_date": date(2026, 12, 1),
                "end_date": date(2027, 6, 15),
                "weight_percentage": Decimal("70.00"),
                "is_current": True,
                "is_closed": False,
            }
        )

        # 3. Grades & Sections
        grade_10, _ = Grade.objects.get_or_create(
            school=school,
            name="Grade 10",
            defaults={"campus": main_campus, "code": "G10", "level_order": 10}
        )
        grade_9, _ = Grade.objects.get_or_create(
            school=school,
            name="Grade 9",
            defaults={"campus": main_campus, "code": "G9", "level_order": 9}
        )

        sec_10a, _ = Section.objects.get_or_create(
            school=school,
            campus=main_campus,
            grade=grade_10,
            name="10-A",
            defaults={"room_number": "Room 201", "capacity": 40}
        )
        sec_10b, _ = Section.objects.get_or_create(
            school=school,
            campus=main_campus,
            grade=grade_10,
            name="10-B",
            defaults={"room_number": "Room 202", "capacity": 40}
        )
        # Suppressed small cohort section: N < 5 students for privacy suppression testing
        sec_9_north, _ = Section.objects.get_or_create(
            school=school,
            campus=north_campus,
            grade=grade_9,
            name="9-North",
            defaults={"room_number": "Lab Wing", "capacity": 15}
        )

        # 4. Subjects
        sub_phy, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_10,
            code="PHY-10",
            defaults={"campus": main_campus, "name": "Physics", "credit_hours": Decimal("4.00")}
        )
        sub_mth, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_10,
            code="MTH-10",
            defaults={"campus": main_campus, "name": "Mathematics", "credit_hours": Decimal("4.00")}
        )
        sub_chm, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_10,
            code="CHM-10",
            defaults={"campus": main_campus, "name": "Chemistry", "credit_hours": Decimal("4.00")}
        )
        sub_eng, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_10,
            code="ENG-10",
            defaults={"campus": main_campus, "name": "English Compulsory", "credit_hours": Decimal("3.00")}
        )
        sub_cs, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_10,
            code="CS-10",
            defaults={"campus": main_campus, "name": "Computer Science", "credit_hours": Decimal("3.00")}
        )

        # 5. Faculty / Teachers
        teachers_data = [
            ("tariq.mahmood", "Sir Tariq Mahmood", "tariq@optimusorien.cloud", "male", sub_phy),
            ("ayesha.khan", "Ms. Ayesha Khan", "ayesha@optimusorien.cloud", "female", sub_mth),
            ("salman.raza", "Dr. Salman Raza", "salman@optimusorien.cloud", "male", sub_chm),
            ("bilal.farooq", "Sir Bilal Farooq", "bilal@optimusorien.cloud", "male", sub_eng),
        ]
        created_teachers = {}
        for username, full_name, email, gen, subj in teachers_data:
            t_user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "school": school,
                    "first_name": full_name,
                    "email": email,
                    "role": UserRole.TEACHER,
                }
            )
            t_user.set_password("Teacher123#")
            t_user.save()
            StaffProfile.objects.get_or_create(
                user=t_user,
                defaults={"school": school, "employee_id": f"EMP-{username}", "gender": gen, "designation": "Teacher"}
            )
            created_teachers[username] = t_user

            SubjectTeacherAssignment.objects.get_or_create(
                school=school,
                section=sec_10a,
                subject=subj,
                session=session_2026,
                defaults={"campus": main_campus, "teacher": t_user, "is_class_teacher": (subj == sub_phy)}
            )

        # 6. Students & Enrolments
        students_data = [
            ("ayan.rehman", "Ayan Rehman", "101", "REG-2026-0912", "male", Decimal("94.00"), Decimal("88.00"), Decimal("91.00"), Decimal("85.00"), Decimal("96.00")),
            ("zainab.fatima", "Zainab Fatima", "102", "REG-2026-0913", "female", Decimal("96.00"), Decimal("92.00"), Decimal("95.00"), Decimal("94.00"), Decimal("98.00")),
            ("muhammad.hamza", "Muhammad Hamza", "103", "REG-2026-0914", "male", Decimal("72.00"), Decimal("68.00"), Decimal("75.00"), Decimal("78.00"), Decimal("80.00")),
            ("maryam.bibi", "Maryam Bibi", "104", "REG-2026-0915", "female", Decimal("88.00"), Decimal("84.00"), Decimal("86.00"), Decimal("89.00"), Decimal("90.00")),
            ("bilal.ahmed", "Bilal Ahmed", "105", "REG-2026-0916", "male", Decimal("54.00"), Decimal("48.00"), Decimal("52.00"), Decimal("60.00"), Decimal("58.00")),
        ]

        # Parent account
        parent_user, _ = User.objects.get_or_create(
            username="rehman.parent",
            defaults={
                "school": school,
                "first_name": "Tariq Rehman (Guardian)",
                "email": "rehman.parent@example.com",
                "role": UserRole.PARENT,
            }
        )
        parent_user.set_password("Parent123#")
        parent_user.save()

        # 7. Assessments in Term 1, Term 2, and Past Session
        asm_phy_exam, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_1,
            subject=sub_phy,
            title="Mid-Term Theory Examination",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("70.00"),
                "assessment_date": date(2026, 10, 10),
            }
        )
        asm_phy_quiz, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_1,
            subject=sub_phy,
            title="Electromagnetism Continuous Quiz",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "quiz",
                "max_marks": Decimal("25.00"),
                "weight_percentage": Decimal("30.00"),
                "assessment_date": date(2026, 9, 25),
            }
        )
        asm_mth_exam, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_1,
            subject=sub_mth,
            title="Calculus & Quadratic Equations Mid-Term",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("100.00"),
                "assessment_date": date(2026, 10, 12),
            }
        )
        asm_chm_exam, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_1,
            subject=sub_chm,
            title="Organic Chemistry Mid-Term",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("100.00"),
                "assessment_date": date(2026, 10, 14),
            }
        )
        # Term 2 Assessments (for multi-term trajectory analysis)
        asm_phy_term2, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_2,
            subject=sub_phy,
            title="Annual Final Physics Theory Exam",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("70.00"),
                "assessment_date": date(2027, 4, 15),
            }
        )
        asm_mth_term2, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_2,
            subject=sub_mth,
            title="Annual Final Mathematics Exam",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("100.00"),
                "assessment_date": date(2027, 4, 18),
            }
        )
        # Past Session Assessment (for longitudinal multi-session analysis)
        asm_phy_past, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_past,
            subject=sub_phy,
            title="Annual Physics Exam 2026",
            defaults={
                "campus": main_campus,
                "section": sec_10a,
                "assessment_type": "exam",
                "max_marks": Decimal("100.00"),
                "weight_percentage": Decimal("100.00"),
                "assessment_date": date(2026, 4, 15),
            }
        )
        # Small Cohort Assessment (DHA North Campus Grade 9)
        sub_phy_9, _ = Subject.objects.get_or_create(
            school=school,
            grade=grade_9,
            code="PHY-09",
            defaults={"campus": north_campus, "name": "General Physics 9", "credit_hours": Decimal("3.00")}
        )
        asm_phy_north, _ = Assessment.objects.get_or_create(
            school=school,
            term=term_1,
            subject=sub_phy_9,
            title="DHA North Diagnostic Test",
            defaults={
                "campus": north_campus,
                "section": sec_9_north,
                "assessment_type": "test",
                "max_marks": Decimal("50.00"),
                "weight_percentage": Decimal("100.00"),
                "assessment_date": date(2026, 9, 20),
            }
        )

        # 8. Skill Dimensions
        dim_comm, _ = SkillDimension.objects.get_or_create(
            school=school,
            subject=sub_eng,
            name="Oral Communication & Presentation",
            defaults={"campus": main_campus, "description": "Clarity of verbal expression and classroom debate."}
        )
        dim_read, _ = SkillDimension.objects.get_or_create(
            school=school,
            subject=sub_eng,
            name="Critical Reading & Comprehension",
            defaults={"campus": main_campus, "description": "Analytical breakdown of unseen texts."}
        )
        dim_prob, _ = SkillDimension.objects.get_or_create(
            school=school,
            subject=sub_mth,
            name="Mathematical Problem Solving",
            defaults={"campus": main_campus, "description": "Abstract logical deductions and formula applications."}
        )
        dim_lab, _ = SkillDimension.objects.get_or_create(
            school=school,
            subject=sub_phy,
            name="Laboratory Practical & Scientific Rigor",
            defaults={"campus": main_campus, "description": "Hands-on apparatus handling and error measurement."}
        )

        # 9. Behaviour Categories
        cat_conduct, _ = BehaviourCategory.objects.get_or_create(
            school=school,
            name="Classroom Conduct & Discipline",
            defaults={"campus": main_campus, "code": "CONDUCT"}
        )
        cat_punct, _ = BehaviourCategory.objects.get_or_create(
            school=school,
            name="Punctuality & Timekeeping",
            defaults={"campus": main_campus, "code": "PUNCTUALITY"}
        )
        cat_coop, _ = BehaviourCategory.objects.get_or_create(
            school=school,
            name="Peer Cooperation & Teamwork",
            defaults={"campus": main_campus, "code": "COOPERATION"}
        )

        # 10. Tasks
        task_1, _ = Task.objects.get_or_create(
            school=school,
            section=sec_10a,
            subject=sub_phy,
            title="Electromagnetic Induction Numerical Problem Set",
            defaults={
                "campus": main_campus,
                "teacher": created_teachers["tariq.mahmood"],
                "task_type": "homework",
                "due_date": date.today() + timedelta(days=2),
                "instructions": "Solve problems 12.1 through 12.10 from textbook page 184.",
                "max_marks": Decimal("10.00"),
            }
        )

        # Loop through students to seed records
        for username, full_name, roll, adm, gen, phy_m, mth_m, chm_m, eng_m, cs_m in students_data:
            st_user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "school": school,
                    "first_name": full_name,
                    "email": f"{username}@optimusorien.cloud",
                    "role": UserRole.STUDENT,
                }
            )
            st_user.set_password("Student123#")
            st_user.save()
            StudentProfile.objects.get_or_create(
                user=st_user,
                defaults={"school": school, "admission_number": adm, "gender": gen}
            )

            # Enrolment
            StudentEnrollment.objects.get_or_create(
                school=school,
                student=st_user,
                session=session_2026,
                defaults={
                    "campus": main_campus,
                    "section": sec_10a,
                    "roll_number": roll,
                    "admission_number": adm,
                    "status": "enrolled",
                }
            )

            # Link first 2 children to parent
            if username in ["ayan.rehman", "zainab.fatima"]:
                ParentStudentRelation.objects.get_or_create(
                    school=school,
                    parent=parent_user,
                    student=st_user,
                    defaults={"campus": main_campus, "relationship": "guardian"}
                )

            # Assessment Results
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_phy_exam,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": phy_m,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_phy_quiz,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": round(phy_m * Decimal("0.25"), 2),
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_mth_exam,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": mth_m,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_chm_exam,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": chm_m,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )

            # Term 2 Results with Distinct Trajectories:
            # - ayan.rehman: Improving (94% -> 96%)
            # - zainab.fatima: Consistently high (96% -> 98%)
            # - muhammad.hamza: Fluctuating / drop (72% -> 62%)
            # - maryam.bibi: Steady (88% -> 90%)
            # - bilal.ahmed: Declining deficit (54% -> 46%)
            term2_phy = {
                "ayan.rehman": Decimal("96.00"),
                "zainab.fatima": Decimal("98.00"),
                "muhammad.hamza": Decimal("62.00"),
                "maryam.bibi": Decimal("90.00"),
                "bilal.ahmed": Decimal("46.00"),
            }.get(username, phy_m)

            term2_mth = {
                "ayan.rehman": Decimal("94.00"),
                "zainab.fatima": Decimal("95.00"),
                "muhammad.hamza": Decimal("65.00"),
                "maryam.bibi": Decimal("88.00"),
                "bilal.ahmed": Decimal("44.00"),
            }.get(username, mth_m)

            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_phy_term2,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": term2_phy,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_mth_term2,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": term2_mth,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )

            # Historical enrollment and past session scores for longitudinal tracking
            StudentEnrollment.objects.get_or_create(
                school=school,
                student=st_user,
                session=session_2025,
                defaults={
                    "campus": main_campus,
                    "section": sec_10a,
                    "roll_number": f"9-{roll}",
                    "admission_number": adm,
                    "status": "promoted",
                }
            )
            past_phy = {
                "ayan.rehman": Decimal("82.00"),
                "zainab.fatima": Decimal("94.00"),
                "muhammad.hamza": Decimal("75.00"),
                "maryam.bibi": Decimal("85.00"),
                "bilal.ahmed": Decimal("74.00"),
            }.get(username, Decimal("70.00"))

            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_phy_past,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "attained_marks": past_phy,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )

            # Attendance (today + past 5 days)
            for d_offset in range(6):
                rec_date = date.today() - timedelta(days=d_offset)
                stat = "present"
                if username == "bilal.ahmed" and d_offset in [1, 2]:
                    stat = "absent"
                elif username == "muhammad.hamza" and d_offset == 3:
                    stat = "late"

                AttendanceRecord.objects.update_or_create(
                    school=school,
                    student=st_user,
                    section=sec_10a,
                    subject=None,
                    date=rec_date,
                    defaults={"campus": main_campus, "status": stat}
                )

            # Participation (1-10 scale)
            rating_val = 9 if phy_m >= 90 else (7 if phy_m >= 70 else 5)
            ParticipationRecord.objects.update_or_create(
                school=school,
                student=st_user,
                section=sec_10a,
                subject=sub_phy,
                date=date.today(),
                defaults={"campus": main_campus, "rating": rating_val, "notes": "Active contributor in class."}
            )

            # Behaviour (1-10 scale)
            BehaviourRecord.objects.update_or_create(
                school=school,
                student=st_user,
                section=sec_10a,
                category=cat_conduct,
                date=date.today(),
                defaults={"campus": main_campus, "rating": rating_val, "observation_notes": "Well behaved and polite."}
            )

            # Skill ratings (Biannual 1-10 scale)
            SkillRating.objects.update_or_create(
                school=school,
                student=st_user,
                skill_dimension=dim_lab,
                session=session_2026,
                cycle="biannual_1",
                defaults={"campus": main_campus, "rating": rating_val, "notes": "Shows excellent bench technique."}
            )
            SkillRating.objects.update_or_create(
                school=school,
                student=st_user,
                skill_dimension=dim_prob,
                session=session_2026,
                cycle="biannual_1",
                defaults={"campus": main_campus, "rating": rating_val, "notes": "Strong logical rigor."}
            )

            # Task Submission
            TaskSubmission.objects.update_or_create(
                school=school,
                task=task_1,
                student=st_user,
                defaults={
                    "campus": main_campus,
                    "submission_status": "verified" if username != "bilal.ahmed" else "pending",
                    "marks_obtained": Decimal("9.50") if username != "bilal.ahmed" else None,
                    "feedback": "Outstanding step-by-step solution!" if username != "bilal.ahmed" else "",
                }
            )

            # Early Intervention Flag for Bilal Ahmed
            if username == "bilal.ahmed":
                EarlyInterventionFlag.objects.get_or_create(
                    school=school,
                    student=st_user,
                    flag_reason="academic_decline",
                    defaults={
                        "campus": main_campus,
                        "severity": "high",
                        "status": "open",
                        "trigger_metric": "Physics (54%) and Mathematics (48%) dropped below 60% threshold.",
                        "notes": "Non-punitive support meeting scheduled with academic counselor.",
                        "assigned_to": created_teachers["ayesha.khan"],
                    }
                )

        # Seed small cohort in sec_9_north (N = 3 < 5 suppression limit)
        small_cohort = [
            ("dha.ali", "Ali Raza DHA", "901", "DHA-2026-01", "male", Decimal("41.00")),
            ("dha.hira", "Hira Tariq DHA", "902", "DHA-2026-02", "female", Decimal("38.00")),
            ("dha.daniyal", "Daniyal Aslam DHA", "903", "DHA-2026-03", "male", Decimal("40.00")),
        ]
        for uname, fname, roll, adm, gen, sc in small_cohort:
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    "school": school,
                    "first_name": fname,
                    "email": f"{uname}@optimusorien.cloud",
                    "role": UserRole.STUDENT,
                }
            )
            u.set_password("Student123#")
            u.save()
            StudentProfile.objects.get_or_create(
                user=u,
                defaults={"school": school, "admission_number": adm, "gender": gen}
            )
            StudentEnrollment.objects.get_or_create(
                school=school,
                student=u,
                session=session_2026,
                defaults={
                    "campus": north_campus,
                    "section": sec_9_north,
                    "roll_number": roll,
                    "admission_number": adm,
                    "status": "enrolled",
                }
            )
            AssessmentResult.objects.update_or_create(
                school=school,
                assessment=asm_phy_north,
                student=u,
                defaults={
                    "campus": north_campus,
                    "attained_marks": sc,
                    "is_published": True,
                    "published_at": timezone.now(),
                    "publication_locked": True,
                }
            )

        # 11. Compute and Persist AQI Snapshots across terms
        self.stdout.write("Calculating Optimus Orien AQI Snapshots across terms...")
        snap_org_t1 = snapshot_aqi(school, session_2026, term=term_1)
        snap_camp_t1 = snapshot_aqi(school, session_2026, term=term_1, campus=main_campus)
        snap_org_t2 = snapshot_aqi(school, session_2026, term=term_2)
        snap_camp_t2 = snapshot_aqi(school, session_2026, term=term_2, campus=main_campus)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded! School AQI T1: {snap_org_t1.aqi_score}%, T2: {snap_org_t2.aqi_score}%"
        ))
