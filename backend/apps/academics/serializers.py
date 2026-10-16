"""
Serializers for Academics, Grading, Attendance, Tasks, Behaviour, Skills, and AQI Engine.
"""
from decimal import Decimal
from rest_framework import serializers
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    SubjectTeacherAssignment,
    StudentEnrollment,
    StudentTransferRecord,
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
    AQISnapshot,
    EarlyInterventionFlag,
    FinanceOverviewCategory,
    FinanceRecord,
)
from apps.authentication.models import User


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = [
            'id', 'session', 'name', 'term_code', 'start_date', 'end_date',
            'weight_percentage', 'is_current', 'is_closed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubjectSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = Subject
        fields = [
            'id', 'grade', 'grade_name', 'name', 'code', 'is_elective',
            'credit_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SectionSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id', 'grade', 'grade_name', 'campus', 'campus_name', 'name',
            'room_number', 'capacity', 'student_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_count(self, obj):
        return obj.student_enrollments.filter(status='enrolled').count()


class GradeSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'name', 'code', 'level_order', 'sections', 'subjects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubjectTeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)

    class Meta:
        model = SubjectTeacherAssignment
        fields = [
            'id', 'teacher', 'teacher_username', 'teacher_name', 'section', 'section_name',
            'subject', 'subject_name', 'subject_code', 'session', 'is_class_teacher',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_gender = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    grade_name = serializers.CharField(source='section.grade.name', read_only=True)
    session_name = serializers.CharField(source='session.name', read_only=True)
    campus_name = serializers.CharField(source='section.campus.name', read_only=True)
    campus_code = serializers.CharField(source='section.campus.code', read_only=True)

    def get_student_gender(self, obj):
        profile = getattr(obj.student, 'student_profile', None)
        return profile.gender if profile else ''

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_username', 'student_name', 'student_gender',
            'session', 'session_name', 'section', 'section_name', 'grade_name',
            'campus', 'campus_name', 'campus_code', 'roll_number', 'admission_number', 'status', 'enrolled_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'campus', 'campus_name', 'campus_code', 'created_at', 'updated_at']


class StudentTransferRecordSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    from_campus_name = serializers.CharField(source='from_campus.name', read_only=True)
    to_campus_name = serializers.CharField(source='to_campus.name', read_only=True)
    from_section_name = serializers.CharField(source='from_section.__str__', read_only=True)
    to_section_name = serializers.CharField(source='to_section.__str__', read_only=True)

    class Meta:
        model = StudentTransferRecord
        fields = [
            'id', 'student', 'student_username', 'from_campus', 'from_campus_name',
            'to_campus', 'to_campus_name', 'from_section', 'from_section_name',
            'to_section', 'to_section_name', 'transfer_date', 'reason', 'approved_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssessmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    results_count = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            'id', 'term', 'term_name', 'subject', 'subject_name', 'subject_code',
            'section', 'section_name', 'title', 'assessment_type', 'max_marks',
            'weight_percentage', 'assessment_date', 'results_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_results_count(self, obj):
        return obj.results.count()


class AssessmentResultSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    max_marks = serializers.DecimalField(source='assessment.max_marks', max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = AssessmentResult
        fields = [
            'id', 'assessment', 'assessment_title', 'student', 'student_username', 'student_name',
            'max_marks', 'attained_marks', 'percentage', 'grade_letter', 'is_published',
            'published_at', 'publication_locked', 'audit_notes', 'recorded_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'grade_letter', 'published_at', 'created_at', 'updated_at']

    def validate(self, attrs):
        assessment = attrs.get('assessment') or getattr(self.instance, 'assessment', None)
        attained = attrs.get('attained_marks')
        if attained is not None:
            if attained < Decimal("0.00"):
                raise serializers.ValidationError({"attained_marks": "Attained marks cannot be negative."})
            if assessment and assessment.max_marks is not None and attained > assessment.max_marks:
                raise serializers.ValidationError({
                    "attained_marks": f"Attained marks ({attained}) cannot exceed assessment maximum ({assessment.max_marks})."
                })
        return attrs


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_username', 'student_name', 'section', 'section_name',
            'subject', 'date', 'status', 'remarks', 'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ParticipationRecordSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = ParticipationRecord
        fields = [
            'id', 'student', 'student_username', 'student_name', 'section', 'subject',
            'date', 'rating', 'notes', 'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BehaviourCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviourCategory
        fields = ['id', 'name', 'code', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BehaviourRecordSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BehaviourRecord
        fields = [
            'id', 'student', 'student_username', 'student_name', 'section', 'category',
            'category_name', 'date', 'rating', 'observation_notes', 'is_sensitive',
            'recorded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        # Privacy guarantee: students and parents never receive behaviour observation notes or sensitivity flags
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            if getattr(request.user, 'role', None) in ['student', 'parent']:
                data.pop('observation_notes', None)
                data.pop('is_sensitive', None)
        return data



class SkillDimensionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = SkillDimension
        fields = ['id', 'subject', 'subject_name', 'subject_code', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SkillRatingSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    skill_name = serializers.CharField(source='skill_dimension.name', read_only=True)

    class Meta:
        model = SkillRating
        fields = [
            'id', 'student', 'student_username', 'student_name', 'skill_dimension',
            'skill_name', 'session', 'cycle', 'rating', 'notes', 'teacher',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'section',
            'section_name', 'title', 'task_type', 'due_date', 'instructions',
            'max_marks', 'submissions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_submissions_count(self, obj):
        return obj.submissions.count()


class TaskSubmissionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = TaskSubmission
        fields = [
            'id', 'task', 'task_title', 'student', 'student_username', 'student_name',
            'submission_status', 'submitted_at', 'marks_obtained', 'feedback',
            'verified_by', 'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AQISnapshotSerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source='term.name', read_only=True)
    session_name = serializers.CharField(source='session.name', read_only=True)

    class Meta:
        model = AQISnapshot
        fields = [
            'id', 'scope_type', 'scope_id', 'scope_name', 'session', 'session_name',
            'term', 'term_name', 'aqi_score', 'status_band', 'component_breakdown',
            'calculated_at'
        ]
        read_only_fields = ['id', 'calculated_at']


class EarlyInterventionFlagSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = EarlyInterventionFlag
        fields = [
            'id', 'student', 'student_username', 'student_name', 'flag_reason',
            'severity', 'status', 'trigger_metric', 'notes', 'assigned_to',
            'assigned_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FinanceRecordSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)

    class Meta:
        model = FinanceRecord
        fields = [
            'id', 'category', 'category_name', 'category_type', 'date', 'amount',
            'description', 'reference_number', 'campus', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ==============================================================================
# AUDITED CORRECTION & CONFIGURATION SERIALIZERS
# ==============================================================================

from apps.academics.models import (
    ResultCorrection,
    AQIConfig,
    GradingScaleConfig,
    GradingScaleBand,
    AttendanceConfig,
    AttendanceStatusConfig,
    AcademicPolicyConfig,
    FeePolicyConfig,
    LateFeeConfig,
)
from apps.authentication.models import StudentProfile, StaffProfile, GuardianLink


class ResultCorrectionSerializer(serializers.ModelSerializer):
    corrected_by_name = serializers.CharField(source='corrected_by.get_full_name', read_only=True)

    class Meta:
        model = ResultCorrection
        fields = [
            'id', 'result', 'previous_attained_marks', 'new_attained_marks',
            'reason', 'corrected_by', 'corrected_by_name', 'corrected_at'
        ]
        read_only_fields = ['id', 'corrected_at']


class AQIConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AQIConfig
        fields = [
            'id', 'version', 'calculation_method', 'strong_threshold',
            'stable_threshold', 'attention_threshold', 'small_group_suppression_limit',
            'missing_data_policy', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GradingScaleBandSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScaleBand
        fields = [
            'id', 'scale', 'letter_grade', 'min_percentage', 'max_percentage',
            'grade_point', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GradingScaleConfigSerializer(serializers.ModelSerializer):
    bands = GradingScaleBandSerializer(many=True, read_only=True)

    class Meta:
        model = GradingScaleConfig
        fields = ['id', 'name', 'calculation_method', 'is_default', 'bands', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceConfig
        fields = [
            'id', 'chronic_absence_threshold_percent', 'allow_any_assigned_teacher',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceStatusConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceStatusConfig
        fields = ['id', 'status_code', 'status_name', 'credit_value', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AcademicPolicyConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicPolicyConfig
        fields = [
            'id', 'admin_approval_required_for_promotion', 'min_promotion_percentage',
            'max_failing_subjects', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeePolicyConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePolicyConfig
        fields = ['id', 'grace_period_days', 'default_due_day_of_month', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LateFeeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LateFeeConfig
        fields = ['id', 'is_enabled', 'fee_type', 'amount', 'max_cap', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'username', 'full_name', 'admission_number', 'gender',
            'date_of_birth', 'b_form_encrypted', 'emergency_contact', 'blood_group',
            'medical_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            'id', 'user', 'username', 'full_name', 'employee_id', 'designation',
            'department', 'gender', 'date_of_birth', 'emergency_contact', 'joining_date',
            'is_active_faculty', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

