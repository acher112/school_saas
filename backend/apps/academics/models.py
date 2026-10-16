"""
Academics, Grading, Attendance, Tasks, Behaviour, Skills, and AQI Engine Data Models.
Complies with Optimus Orien Functional & Product Specification (Headings 4 to 13).
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import BaseTenantModel, School, Campus, AcademicSession


# ==============================================================================
# HEADING 4: Organization & School Structure
# ==============================================================================

class Term(BaseTenantModel):
    """
    Term / Assessment Period within an Academic Session (e.g. 1st Term, 2nd Term, Final Exam).
    """
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
        related_name="terms",
        db_index=True
    )
    name = models.CharField(max_length=100, help_text="e.g. 1st Term, Mid-Term, 2nd Term, Final Exam")
    term_code = models.CharField(max_length=32, default="TERM_1")
    start_date = models.DateField()
    end_date = models.DateField()
    weight_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Percentage contribution of this term to annual cumulative results."
    )
    is_current = models.BooleanField(default=False, db_index=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('school', 'session', 'name')
        ordering = ['start_date']
        verbose_name = 'Term'
        verbose_name_plural = 'Terms'

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({"end_date": "Term end date must be strictly after the start date."})

    def __str__(self):
        return f"{self.name} ({self.session.name})"


class Grade(BaseTenantModel):
    """
    Educational Grade or Level (e.g. Grade 1, Grade 9, Grade 10, O-Levels, A-Levels).
    """
    name = models.CharField(max_length=100, help_text="e.g. Grade 9, Grade 10, O-Level")
    code = models.CharField(max_length=32, default="G10")
    level_order = models.PositiveSmallIntegerField(default=10, help_text="Ascending integer for sorting and grade progression.")

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['level_order', 'name']
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'

    def __str__(self):
        return self.name


class Section(BaseTenantModel):
    """
    Class Section (e.g. Grade 10 - Section A) belonging to a specific Campus.
    """
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="sections", db_index=True)
    name = models.CharField(max_length=64, default="A", help_text="Section name e.g. 'A', 'Blue', 'Science'")
    room_number = models.CharField(max_length=64, blank=True, default="")
    capacity = models.PositiveIntegerField(default=40)

    class Meta:
        unique_together = ('school', 'campus', 'grade', 'name')
        ordering = ['grade__level_order', 'name']
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'

    def __str__(self):
        campus_str = f" [{self.campus.code}]" if self.campus else ""
        return f"{self.grade.name} - {self.name}{campus_str}"


class Subject(BaseTenantModel):
    """
    Academic Subject taught within a Grade (e.g. Mathematics, Physics, English).
    """
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="subjects", db_index=True)
    name = models.CharField(max_length=150, help_text="e.g. Physics, Mathematics, English Compulsory")
    code = models.CharField(max_length=32, help_text="e.g. PHY-10, MTH-10")
    is_elective = models.BooleanField(default=False)
    credit_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("3.00"))

    class Meta:
        unique_together = ('school', 'grade', 'code')
        ordering = ['name']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.grade.name}"


class SubjectTeacherAssignment(BaseTenantModel):
    """
    Assigns a Teacher user to a Subject and Section for an Academic Session.
    """
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teaching_assignments")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="teacher_assignments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="teacher_assignments")
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="teacher_assignments")
    is_class_teacher = models.BooleanField(default=False, help_text="Primary in-charge faculty for this section.")

    class Meta:
        unique_together = ('school', 'section', 'subject', 'session')
        verbose_name = 'Subject Teacher Assignment'
        verbose_name_plural = 'Subject Teacher Assignments'

    def __str__(self):
        return f"{self.teacher.username} -> {self.subject.name} ({self.section})"


class StudentEnrollment(BaseTenantModel):
    """
    Student Enrollment record tied to an Academic Session.
    PRESERVES HISTORICAL CONTEXT: Past enrollment records are never overwritten
    when a student transitions to another class, section, campus or session.
    """
    ENROLLMENT_STATUS = [
        ("enrolled", "Enrolled & Active"),
        ("promoted", "Promoted to Next Grade"),
        ("transferred", "Transferred Campus/Section"),
        ("withdrawn", "Withdrawn / Dropped Out"),
        ("graduated", "Graduated"),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="academic_enrollments", db_index=True)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="student_enrollments", db_index=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="student_enrollments", db_index=True)
    roll_number = models.CharField(max_length=32, db_index=True)
    admission_number = models.CharField(max_length=32, db_index=True)
    status = models.CharField(max_length=32, choices=ENROLLMENT_STATUS, default="enrolled", db_index=True)
    enrolled_date = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ('school', 'student', 'session')
        ordering = ['section', 'roll_number']
        verbose_name = 'Student Enrollment'
        verbose_name_plural = 'Student Enrollments'

    def save(self, *args, **kwargs):
        if self.section and self.section.campus:
            self.campus = self.section.campus
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Roll {self.roll_number}: {self.student.username} ({self.section} @ {self.session.name})"


class StudentTransferRecord(BaseTenantModel):
    """
    Audit log of student branch transfers or section reassignments.
    """
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transfer_history")
    from_campus = models.ForeignKey(Campus, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_out")
    to_campus = models.ForeignKey(Campus, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_in")
    from_section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_from_section")
    to_section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_to_section")
    transfer_date = models.DateField(default=timezone.now)
    reason = models.TextField(blank=True, default="")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        ordering = ['-transfer_date']
        verbose_name = 'Student Transfer Record'
        verbose_name_plural = 'Student Transfer Records'

    def __str__(self):
        return f"Transfer: {self.student.username} on {self.transfer_date}"


# ==============================================================================
# HEADING 7: Assessment & Grading
# ==============================================================================

class Assessment(BaseTenantModel):
    """
    An assessment event (Term Exam, Monthly Test, Quiz, Project, Custom).
    """
    ASSESSMENT_TYPES = [
        ("exam", "Term Examination"),
        ("test", "Monthly Test"),
        ("quiz", "Quiz"),
        ("assignment", "Assignment / Class Project"),
        ("practical", "Laboratory / Practical"),
        ("custom", "Custom Assessment"),
    ]

    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="assessments", db_index=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="assessments", db_index=True)
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessments",
        help_text="Optional section filter. If null, applies to all sections of the grade."
    )
    title = models.CharField(max_length=255, help_text="e.g. Mid-Term Physics Theory Paper")
    assessment_type = models.CharField(max_length=32, choices=ASSESSMENT_TYPES, default="exam")
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("100.00"))
    weight_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("100.00"),
        help_text="Weight of this test within the subject's term score calculation."
    )
    assessment_date = models.DateField()

    class Meta:
        ordering = ['-assessment_date']
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'

    def __str__(self):
        return f"{self.title} - {self.subject.name} ({self.term.name})"


class AssessmentResult(BaseTenantModel):
    """
    Individual student score attained on an Assessment.
    Results start as draft and become immutable once published unless audited.
    """
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="results", db_index=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assessment_scores", db_index=True)
    attained_marks = models.DecimalField(max_digits=6, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    grade_letter = models.CharField(max_length=4, default="A")
    is_published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    publication_locked = models.BooleanField(default=False, help_text="Locks modification unless audited administrative override.")
    audit_notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        unique_together = ('school', 'assessment', 'student')
        ordering = ['-percentage']
        verbose_name = 'Assessment Result'
        verbose_name_plural = 'Assessment Results'

    def clean(self):
        super().clean()
        if self.attained_marks is not None:
            if self.attained_marks < Decimal("0.00"):
                raise ValidationError({"attained_marks": "Attained marks cannot be negative."})
            if hasattr(self, 'assessment') and self.assessment and self.assessment.max_marks is not None:
                if self.attained_marks > self.assessment.max_marks:
                    raise ValidationError({
                        "attained_marks": f"Attained marks ({self.attained_marks}) cannot exceed maximum assessment marks ({self.assessment.max_marks})."
                    })

    def save(self, *args, **kwargs):
        if self.attained_marks is not None:
            if self.attained_marks < Decimal("0.00"):
                raise ValidationError({"attained_marks": "Attained marks cannot be negative."})
            if hasattr(self, 'assessment') and self.assessment and self.assessment.max_marks is not None:
                if self.attained_marks > self.assessment.max_marks:
                    raise ValidationError({
                        "attained_marks": f"Attained marks ({self.attained_marks}) cannot exceed maximum assessment marks ({self.assessment.max_marks})."
                    })

        # Auto-compute percentage
        if self.assessment and self.assessment.max_marks > 0:
            pct = (self.attained_marks / self.assessment.max_marks) * Decimal("100.00")
            self.percentage = round(pct, 2)
        else:
            self.percentage = Decimal("0.00")

        # Auto-assign grade letter standard
        p = float(self.percentage)
        if p >= 90:
            self.grade_letter = "A+"
        elif p >= 80:
            self.grade_letter = "A"
        elif p >= 70:
            self.grade_letter = "B"
        elif p >= 60:
            self.grade_letter = "C"
        elif p >= 50:
            self.grade_letter = "D"
        else:
            self.grade_letter = "F"

        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
            self.publication_locked = True

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} - {self.assessment.title}: {self.attained_marks}/{self.assessment.max_marks} ({self.grade_letter})"


# ==============================================================================
# HEADING 8: Tasks, Homework & Quizzes
# ==============================================================================

class Task(BaseTenantModel):
    """
    Teacher assigned homework, quiz, assignment, or classwork.
    Feeds into academic engagement analytics but kept distinct from official term marks.
    """
    TASK_TYPES = [
        ("homework", "Daily Homework"),
        ("quiz", "Continuous Quiz"),
        ("assignment", "Assignment / Paper"),
        ("classwork", "Classwork Exercise"),
        ("project", "Science / Research Project"),
        ("custom", "Custom Task"),
    ]

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_tasks")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="tasks")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    task_type = models.CharField(max_length=32, choices=TASK_TYPES, default="homework")
    due_date = models.DateField(db_index=True)
    instructions = models.TextField(blank=True, default="")
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("10.00"))

    class Meta:
        ordering = ['-due_date']
        verbose_name = 'Academic Task'
        verbose_name_plural = 'Academic Tasks'

    def __str__(self):
        return f"[{self.task_type.upper()}] {self.title} - {self.section}"


class TaskSubmission(BaseTenantModel):
    """
    Student completion or submission status for an assigned Task.
    """
    SUBMISSION_STATUS = [
        ("pending", "Pending Submission"),
        ("submitted", "Submitted by Student"),
        ("verified", "Verified & Checked by Teacher"),
        ("late", "Submitted Late"),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="submissions", db_index=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_submissions", db_index=True)
    submission_status = models.CharField(max_length=32, choices=SUBMISSION_STATUS, default="pending", db_index=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True, default="")
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('school', 'task', 'student')
        verbose_name = 'Task Submission'
        verbose_name_plural = 'Task Submissions'

    def __str__(self):
        return f"{self.student.username} -> {self.task.title} [{self.submission_status}]"


# ==============================================================================
# HEADING 9: Attendance
# ==============================================================================

class AttendanceRecord(BaseTenantModel):
    """
    Daily and subject-level attendance records.
    Tracks Present, Absent, Late, Leave.
    """
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late Arrival"),
        ("leave", "Excused Leave"),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendances", db_index=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="attendances", db_index=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="attendances", help_text="Optional for subject-specific attendance")
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="present", db_index=True)
    remarks = models.CharField(max_length=255, blank=True, default="")
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        unique_together = ('school', 'student', 'section', 'subject', 'date')
        ordering = ['-date']
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.date}: {self.student.username} - {self.status}"


# ==============================================================================
# HEADING 10: Participation & Behaviour Scale (1-10 Scale, Non-Punitive)
# ==============================================================================

class ParticipationRecord(BaseTenantModel):
    """
    Teacher-rated participation scale (1–10).
    Context includes date/period, subject, and section.
    """
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="participations", db_index=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="participations")
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="participations")
    date = models.DateField(default=timezone.now, db_index=True)
    rating = models.PositiveSmallIntegerField(default=8, help_text="Numerical rating on 1-10 scale.")
    notes = models.TextField(blank=True, default="")
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        ordering = ['-date']
        verbose_name = 'Participation Record'
        verbose_name_plural = 'Participation Records'

    def clean(self):
        super().clean()
        if not (1 <= self.rating <= 10):
            raise ValidationError({"rating": "Participation rating must be between 1 and 10."})

    def __str__(self):
        return f"{self.student.username} Participation: {self.rating}/10 ({self.date})"


class BehaviourCategory(BaseTenantModel):
    """
    Configurable behaviour categories (e.g. Conduct, Punctuality, Cooperation, Responsibility, Respect, Engagement).
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=32, default="CONDUCT")
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ('school', 'name')
        verbose_name = 'Behaviour Category'
        verbose_name_plural = 'Behaviour Categories'

    def __str__(self):
        return self.name


class BehaviourRecord(BaseTenantModel):
    """
    Behaviour observations evaluated on a 1–10 scale.
    STRICT SPEC RULE: Behaviour data is completely separate from academic marks and
    must NEVER automatically reduce official academic grades.
    """
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="behaviour_records", db_index=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="behaviour_records")
    category = models.ForeignKey(BehaviourCategory, on_delete=models.CASCADE, related_name="records")
    date = models.DateField(default=timezone.now, db_index=True)
    rating = models.PositiveSmallIntegerField(default=8, help_text="Rating on 1-10 scale.")
    observation_notes = models.TextField(blank=True, default="")
    is_sensitive = models.BooleanField(
        default=False,
        help_text="Requires elevated principal/admin permissions to view."
    )
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        ordering = ['-date']
        verbose_name = 'Behaviour Record'
        verbose_name_plural = 'Behaviour Records'

    def clean(self):
        super().clean()
        if not (1 <= self.rating <= 10):
            raise ValidationError({"rating": "Behaviour rating must be between 1 and 10."})

    def __str__(self):
        return f"{self.student.username} [{self.category.name}]: {self.rating}/10"


# ==============================================================================
# HEADING 11: Skill-Based Rating System (Biannual, Multi-Dimensional)
# ==============================================================================

class SkillDimension(BaseTenantModel):
    """
    Subject-specific or cross-curricular skill dimension.
    (e.g. English -> Communication, Speaking, Reading, Listening;
     Science -> Analytical Thinking, Laboratory Practical, Problem Solving;
     General -> Creativity, Collaboration).
    """
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="skill_dimensions")
    name = models.CharField(max_length=100, help_text="Skill dimension name")
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ('school', 'subject', 'name')
        verbose_name = 'Skill Dimension'
        verbose_name_plural = 'Skill Dimensions'

    def __str__(self):
        sub_str = f" [{self.subject.code}]" if self.subject else " [General]"
        return f"{self.name}{sub_str}"


class SkillRating(BaseTenantModel):
    """
    Biannual skill assessment rating recorded by subject teachers.
    Ratings are measured on a 1–10 scale.
    """
    CYCLES = [
        ("biannual_1", "Biannual Cycle 1 (Mid-Year)"),
        ("biannual_2", "Biannual Cycle 2 (Year-End)"),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skill_ratings", db_index=True)
    skill_dimension = models.ForeignKey(SkillDimension, on_delete=models.CASCADE, related_name="ratings")
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="skill_ratings")
    cycle = models.CharField(max_length=32, choices=CYCLES, default="biannual_1", db_index=True)
    rating = models.PositiveSmallIntegerField(default=8, help_text="Skill proficiency score on 1-10 scale.")
    notes = models.TextField(blank=True, default="")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        unique_together = ('school', 'student', 'skill_dimension', 'session', 'cycle')
        ordering = ['cycle', '-rating']
        verbose_name = 'Skill Rating'
        verbose_name_plural = 'Skill Ratings'

    def clean(self):
        super().clean()
        if not (1 <= self.rating <= 10):
            raise ValidationError({"rating": "Skill rating must be between 1 and 10."})

    def __str__(self):
        return f"{self.student.username} - {self.skill_dimension.name}: {self.rating}/10 ({self.cycle})"


# ==============================================================================
# HEADING 12 & 13: Optimus Orien AQI (Academic Quality Index) & Snapshots
# ==============================================================================

class AQISnapshot(BaseTenantModel):
    """
    Longitudinal Academic Quality Index (AQI) score snapshot.
    Stored historically per term and academic year for reproducible trend analysis.
    Supports status bands: Strong (>=85%), Stable (70-84%), Attention (50-69%), Critical (<50%).
    """
    SCOPE_CHOICES = [
        ("organization", "Organization Group"),
        ("campus", "Campus / Branch"),
        ("grade", "Grade Level"),
        ("class", "Class / Section"),
        ("student", "Student"),
    ]

    STATUS_BANDS = [
        ("strong", "Strong (>=85%)"),
        ("stable", "Stable (70-84.9%)"),
        ("attention", "Attention (50-69.9%)"),
        ("critical", "Critical (<50%)"),
    ]

    scope_type = models.CharField(max_length=32, choices=SCOPE_CHOICES, db_index=True)
    scope_id = models.CharField(max_length=64, db_index=True, help_text="UUID string or identifier of the evaluated entity.")
    scope_name = models.CharField(max_length=255)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="aqi_snapshots", db_index=True)
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name="aqi_snapshots", db_index=True)
    aqi_score = models.DecimalField(max_digits=5, decimal_places=2, help_text="Normalized AQI score 0-100.")
    status_band = models.CharField(max_length=16, choices=STATUS_BANDS, default="stable", db_index=True)
    component_breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text="Transparent breakdown of subject weights, class contributions, and metrics behind the score."
    )
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-calculated_at']
        verbose_name = 'AQI Snapshot'
        verbose_name_plural = 'AQI Snapshots'

    def save(self, *args, **kwargs):
        # Auto compute status band
        score = float(self.aqi_score)
        if score >= 85.0:
            self.status_band = "strong"
        elif score >= 70.0:
            self.status_band = "stable"
        elif score >= 50.0:
            self.status_band = "attention"
        else:
            self.status_band = "critical"
        super().save(*args, **kwargs)

    def __str__(self):
        term_str = f" - {self.term.name}" if self.term else ""
        return f"AQI [{self.scope_type.upper()}] {self.scope_name}: {self.aqi_score}% ({self.status_band}){term_str}"


# ==============================================================================
# HEADING 5 & 26: Early Intervention & Alerts (Non-Punitive)
# ==============================================================================

class EarlyInterventionFlag(BaseTenantModel):
    """
    Non-punitive early intervention flag.
    Flags are for investigative support and timely help, NOT punitive labeling or public shaming.
    """
    REASON_CHOICES = [
        ("academic_decline", "Academic Decline Detected"),
        ("low_attendance", "Low Attendance Alert (<75%)"),
        ("sustained_underperformance", "Sustained Academic Underperformance"),
        ("persistent_skill_gap", "Persistent Skill Gap"),
        ("engagement_concern", "Participation / Engagement Concern"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical Priority"),
    ]

    STATUS_CHOICES = [
        ("open", "Open - Requires Attention"),
        ("reviewing", "Under Faculty Review"),
        ("action_taken", "Support Plan Activated"),
        ("resolved", "Resolved & Restored"),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="intervention_flags", db_index=True)
    flag_reason = models.CharField(max_length=64, choices=REASON_CHOICES, db_index=True)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, default="medium")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="open", db_index=True)
    trigger_metric = models.CharField(max_length=255, help_text="Objective underlying metric e.g. 'Attendance dropped to 64% in Term 1'")
    notes = models.TextField(blank=True, default="")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Early Intervention Flag'
        verbose_name_plural = 'Early Intervention Flags'

    def __str__(self):
        return f"Intervention [{self.severity.upper()}]: {self.student.username} - {self.get_flag_reason_display()}"


# ==============================================================================
# HEADING 5 & 28: Finance Overview (Tenant Scoped)
# ==============================================================================

class FinanceOverviewCategory(BaseTenantModel):
    """
    Income and Expense categories for school operational health overview.
    """
    TYPE_CHOICES = [("income", "Income"), ("expense", "Expense")]
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=16, choices=TYPE_CHOICES, default="income")

    class Meta:
        unique_together = ('school', 'name', 'category_type')
        verbose_name = 'Finance Category'
        verbose_name_plural = 'Finance Categories'

    def __str__(self):
        return f"{self.name} ({self.category_type})"


class FinanceRecord(BaseTenantModel):
    """
    Campus finance entries for financial school health metrics.
    Completely isolated from student academic grading.
    """
    category = models.ForeignKey(FinanceOverviewCategory, on_delete=models.PROTECT, related_name="records")
    date = models.DateField(default=timezone.now, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, default="")
    reference_number = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        ordering = ['-date']
        verbose_name = 'Finance Record'
        verbose_name_plural = 'Finance Records'

    def __str__(self):
        return f"[{self.category.category_type.upper()}] PKR {self.amount} - {self.category.name} ({self.date})"


# ==============================================================================
# AUDITED CORRECTIONS: ResultCorrection Workflow (Heading 7)
# ==============================================================================

class ResultCorrection(BaseTenantModel):
    """
    Audited correction record for modifications made to published assessment results.
    Prevents silent alteration of historical or published grades.
    """
    result = models.ForeignKey(AssessmentResult, on_delete=models.CASCADE, related_name="corrections", db_index=True)
    previous_attained_marks = models.DecimalField(max_digits=6, decimal_places=2)
    new_attained_marks = models.DecimalField(max_digits=6, decimal_places=2)
    reason = models.TextField(help_text="Mandatory explanation for post-publication score correction.")
    corrected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    corrected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-corrected_at']
        verbose_name = 'Result Correction'
        verbose_name_plural = 'Result Corrections'

    def __str__(self):
        return f"Correction on {self.result}: {self.previous_attained_marks} -> {self.new_attained_marks}"


# ==============================================================================
# CONFIGURATION MODELS & SEEDED DEFAULTS (Heading 4 to 13 Configuration Domain)
# ==============================================================================

class AQIConfig(BaseTenantModel):
    """
    Tenant-scoped Academic Quality Index (AQI) configuration.
    Governs hierarchical calculation method, status band thresholds, and small-group suppression.
    """
    CALCULATION_METHODS = [
        ("weighted_percentage", "Weighted Percentage"),
        ("total_marks", "Total Marks"),
    ]

    version = models.PositiveIntegerField(default=1)
    calculation_method = models.CharField(max_length=32, choices=CALCULATION_METHODS, default="weighted_percentage")
    strong_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("85.00"))
    stable_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("70.00"))
    attention_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("50.00"))
    small_group_suppression_limit = models.PositiveIntegerField(default=5, help_text="Cohorts with fewer students than this limit are suppressed in public/aggregate displays.")
    missing_data_policy = models.CharField(
        max_length=32,
        choices=[("zero", "Treat as Zero"), ("omit", "Omit from Average")],
        default="omit"
    )
    is_active = models.BooleanField(default=True, db_index=True)

    # Component Decoupling (Spec Sections 12 & 13):
    # AQI is derived 100% from pure subject academic performance unless explicitly enabled.
    include_attendance = models.BooleanField(
        default=False,
        help_text="If enabled, blends attendance into AQI with attendance_weight. Default False (pure subject performance)."
    )
    include_behaviour = models.BooleanField(
        default=False,
        help_text="If enabled, blends behaviour into AQI with behaviour_weight. Default False (pure subject performance)."
    )
    include_participation = models.BooleanField(
        default=False,
        help_text="If enabled, blends participation into AQI with participation_weight. Default False (pure subject performance)."
    )
    attendance_weight = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    behaviour_weight = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    participation_weight = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        verbose_name = 'AQI Configuration'
        verbose_name_plural = 'AQI Configurations'

    def get_status_band(self, score: float) -> str:
        if score >= float(self.strong_threshold):
            return "strong"
        elif score >= float(self.stable_threshold):
            return "stable"
        elif score >= float(self.attention_threshold):
            return "attention"
        return "critical"

    @staticmethod
    def get_display_label(band_code: str) -> str:
        """Returns non-stigmatizing display labels for executive and administrative screens."""
        mapping = {
            "strong": "Strong",
            "stable": "Stable",
            "attention": "Attention",
            "critical": "Needs focused support",
        }
        return mapping.get(band_code, "On Track")

    @staticmethod
    def get_suggested_action(band_code: str) -> str:
        mapping = {
            "strong": "Maintain academic pace and enrichment activities",
            "stable": "Target specific competencies to elevate to high attainment",
            "attention": "Review concept pacing and assign targeted practice",
            "critical": "Activate focused faculty review and learning support plan",
        }
        return mapping.get(band_code, "Review subject progress")

    def __str__(self):
        return f"AQIConfig v{self.version} ({self.school.slug}) - {self.calculation_method}"


class GradingScaleConfig(BaseTenantModel):
    """
    Configurable grading scale parent entity.
    """
    name = models.CharField(max_length=100, default="Standard Academic Grading Scale")
    calculation_method = models.CharField(max_length=32, default="weighted_percentage")
    is_default = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Grading Scale Config'
        verbose_name_plural = 'Grading Scale Configs'

    def __str__(self):
        return f"{self.name} ({self.school.slug})"


class GradingScaleBand(BaseTenantModel):
    """
    Individual letter grade band (A+, A, B, C, D, F) belonging to a GradingScaleConfig.
    """
    scale = models.ForeignKey(GradingScaleConfig, on_delete=models.CASCADE, related_name="bands", db_index=True)
    letter_grade = models.CharField(max_length=8)
    min_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    max_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("0.00"))
    description = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ['-min_percentage']
        verbose_name = 'Grading Scale Band'
        verbose_name_plural = 'Grading Scale Bands'

    def __str__(self):
        return f"{self.letter_grade}: {self.min_percentage}% - {self.max_percentage}% (GPA {self.grade_point})"


class AttendanceConfig(BaseTenantModel):
    """
    Configurable attendance thresholds and marking scopes.
    """
    chronic_absence_threshold_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("75.00"),
        help_text="Attendance rate percentage below which an early-attention chronic absence flag triggers."
    )
    allow_any_assigned_teacher = models.BooleanField(
        default=False,
        help_text="If False, only homeroom class teacher marks daily attendance. If True, any teacher assigned to the section can."
    )

    class Meta:
        verbose_name = 'Attendance Configuration'
        verbose_name_plural = 'Attendance Configurations'

    def __str__(self):
        return f"AttendanceConfig ({self.school.slug}): Chronic < {self.chronic_absence_threshold_percent}%"


class AttendanceStatusConfig(BaseTenantModel):
    """
    Dynamic attendance statuses (Present, Absent, Late, Excused, Half-Day) and credit values.
    """
    status_code = models.CharField(max_length=8, db_index=True)
    status_name = models.CharField(max_length=64)
    credit_value = models.DecimalField(
        max_digits=3, decimal_places=2, default=Decimal("1.00"),
        help_text="Numeric credit towards attendance percentage (e.g. 1.0 for Present, 0.5 for Late, 0.0 for Absent)."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'status_code')
        verbose_name = 'Attendance Status Config'
        verbose_name_plural = 'Attendance Status Configs'

    def __str__(self):
        return f"{self.status_name} [{self.status_code}] = {self.credit_value} credit"


class AcademicPolicyConfig(BaseTenantModel):
    """
    Configurable student promotion policy and deficit intervention rules.
    """
    admin_approval_required_for_promotion = models.BooleanField(
        default=False,
        help_text="When True, student annual promotions require administrative review before committing."
    )
    min_promotion_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("40.00"),
        help_text="Attainment threshold below which promotion flags an academic deficit in the new session."
    )
    max_failing_subjects = models.PositiveSmallIntegerField(
        default=1,
        help_text="Maximum subjects a student can fail and still be eligible for promotion."
    )

    class Meta:
        verbose_name = 'Academic Policy Config'
        verbose_name_plural = 'Academic Policy Configs'

    def __str__(self):
        return f"AcademicPolicy ({self.school.slug}): Admin Approval = {self.admin_approval_required_for_promotion}"


class FeePolicyConfig(BaseTenantModel):
    """
    Fee operational policies: grace periods and due day of month.
    """
    grace_period_days = models.PositiveSmallIntegerField(
        default=5,
        help_text="Number of days after invoice due date before transitioning to overdue."
    )
    default_due_day_of_month = models.PositiveSmallIntegerField(
        default=10,
        help_text="Default calendar day of month for student fee invoices."
    )

    class Meta:
        verbose_name = 'Fee Policy Config'
        verbose_name_plural = 'Fee Policy Configs'

    def __str__(self):
        return f"FeePolicy ({self.school.slug}): {self.grace_period_days}d grace"


class LateFeeConfig(BaseTenantModel):
    """
    Late fee calculation scheme.
    Defaults to empty / disabled (0.00) until explicitly configured by school admin.
    """
    FEE_TYPES = [
        ("fixed", "Fixed Amount"),
        ("percentage", "Percentage of Tuition"),
    ]

    is_enabled = models.BooleanField(default=False, help_text="Late fee is disabled by default.")
    fee_type = models.CharField(max_length=32, choices=FEE_TYPES, default="fixed")
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
        help_text="Configured late fee rate (default empty/zero)."
    )
    max_cap = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
        help_text="Maximum compounding cap (default empty/zero)."
    )

    class Meta:
        verbose_name = 'Late Fee Configuration'
        verbose_name_plural = 'Late Fee Configurations'

    def __str__(self):
        status = "Active" if self.is_enabled else "Disabled"
        return f"LateFeeConfig ({self.school.slug}): {status} ({self.amount})"

