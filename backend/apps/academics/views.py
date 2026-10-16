"""
API Views and ViewSets for Academics, Grading, Attendance, Tasks, Behaviour, Skills, AQI Engine, and Configurations.
Enforces strict multi-tenant Row-Level Security, role boundaries, and audit logging.
"""
import io
import csv
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied

from apps.core.context import get_current_school
from apps.core.permissions import IsTenantMember, IsSchoolAdmin, IsOrgAdmin, IsPrincipal
from apps.core.models import School, Campus, AcademicSession, AuditLog
from apps.authentication.models import (
    User,
    UserRole,
    StudentProfile,
    StaffProfile,
    ParentStudentRelation,
    GuardianLink,
)
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
    ResultCorrection,
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
    AQIConfig,
    GradingScaleConfig,
    GradingScaleBand,
    AttendanceConfig,
    AttendanceStatusConfig,
    AcademicPolicyConfig,
    FeePolicyConfig,
    LateFeeConfig,
)
from apps.academics.serializers import (
    TermSerializer,
    GradeSerializer,
    SectionSerializer,
    SubjectSerializer,
    SubjectTeacherAssignmentSerializer,
    StudentEnrollmentSerializer,
    StudentTransferRecordSerializer,
    AssessmentSerializer,
    AssessmentResultSerializer,
    ResultCorrectionSerializer,
    AttendanceRecordSerializer,
    ParticipationRecordSerializer,
    BehaviourCategorySerializer,
    BehaviourRecordSerializer,
    SkillDimensionSerializer,
    SkillRatingSerializer,
    TaskSerializer,
    TaskSubmissionSerializer,
    AQISnapshotSerializer,
    EarlyInterventionFlagSerializer,
    FinanceRecordSerializer,
    AQIConfigSerializer,
    GradingScaleConfigSerializer,
    GradingScaleBandSerializer,
    AttendanceConfigSerializer,
    AttendanceStatusConfigSerializer,
    AcademicPolicyConfigSerializer,
    FeePolicyConfigSerializer,
    LateFeeConfigSerializer,
    StudentProfileSerializer,
    StaffProfileSerializer,
)
from apps.academics.aqi_engine import (
    calculate_student_academic_average,
    calculate_class_aqi,
    calculate_grade_aqi,
    calculate_campus_aqi,
    calculate_organization_aqi,
    snapshot_aqi,
    get_status_band,
    get_active_aqi_config,
)


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsSchoolAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def get_queryset(self):
        return Term.objects.all().order_by('start_date')


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsOrgAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def get_queryset(self):
        return Grade.objects.all().order_by('level_order', 'name')


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsSchoolAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def perform_create(self, serializer):
        user = self.request.user
        campus = serializer.validated_data.get('campus')
        if user.role == UserRole.PRINCIPAL:
            if campus and user.primary_campus_id != campus.id:
                raise PermissionDenied("Principals can only create sections for their assigned campus.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        campus = serializer.validated_data.get('campus') or serializer.instance.campus
        if user.role == UserRole.PRINCIPAL:
            if campus and user.primary_campus_id != campus.id:
                raise PermissionDenied("Principals can only update sections for their assigned campus.")
        serializer.save()

    def get_queryset(self):
        qs = Section.objects.all().select_related('grade', 'campus')
        user = self.request.user

        # Teacher Class Isolation: Teachers can only view sections they are assigned to
        if getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(
                teacher=user
            ).values_list('section_id', flat=True)
            qs = qs.filter(id__in=assigned_sections)

        grade_id = self.request.query_params.get('grade')
        campus_id = self.request.query_params.get('campus')
        if grade_id:
            qs = qs.filter(grade_id=grade_id)
        if campus_id:
            qs = qs.filter(campus_id=campus_id)
        return qs.order_by('grade__level_order', 'name')


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsOrgAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def get_queryset(self):
        qs = Subject.objects.all().select_related('grade')
        grade_id = self.request.query_params.get('grade')
        if grade_id:
            qs = qs.filter(grade_id=grade_id)
        return qs.order_by('name')


class SubjectTeacherAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectTeacherAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsSchoolAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def perform_create(self, serializer):
        user = self.request.user
        teacher = serializer.validated_data.get('teacher')
        section = serializer.validated_data.get('section')
        if user.role == UserRole.PRINCIPAL:
            if section and user.primary_campus_id != section.campus_id:
                raise PermissionDenied("Principals can only assign teachers for sections in their assigned campus.")
        if teacher and teacher.role not in (UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ORG_ADMIN, UserRole.OWNER):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"teacher": "Only teachers and academic faculty can be assigned to subjects."})
        serializer.save()

    def get_queryset(self):
        qs = SubjectTeacherAssignment.objects.all().select_related('teacher', 'section', 'subject', 'session')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.TEACHER:
            qs = qs.filter(teacher=user)

        section_id = self.request.query_params.get('section')
        teacher_id = self.request.query_params.get('teacher')
        if section_id:
            qs = qs.filter(section_id=section_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs


class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'transfer']:
            return [permissions.IsAuthenticated(), IsTenantMember(), IsSchoolAdmin()]
        return [permissions.IsAuthenticated(), IsTenantMember()]

    def perform_create(self, serializer):
        user = self.request.user
        student = serializer.validated_data.get('student')
        section = serializer.validated_data.get('section')
        if user.role == UserRole.PRINCIPAL:
            if section and user.primary_campus_id != section.campus_id:
                raise PermissionDenied("Principals can only enroll students in sections in their assigned campus.")
        if student and student.role != UserRole.STUDENT:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"student": "Only users with the student role can be enrolled in classes."})
        serializer.save()

    def get_queryset(self):
        qs = StudentEnrollment.objects.all().select_related('student', 'section', 'session', 'section__campus')
        user = self.request.user

        # Role-based scoping
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(section_id__in=assigned_sections)

        section_id = self.request.query_params.get('section')
        session_id = self.request.query_params.get('session')
        if section_id:
            qs = qs.filter(section_id=section_id)
        if session_id:
            qs = qs.filter(session_id=session_id)
        return qs

    @action(detail=True, methods=['post'], url_path='transfer')
    def transfer(self, request, pk=None):
        """
        Transfers student to another campus or section while PRESERVING historical transfer records.
        """
        enrollment = self.get_object()
        from_section = enrollment.section
        from_campus = from_section.campus
        to_section_id = request.data.get('to_section')
        reason = request.data.get('reason', '')

        if not to_section_id:
            return Response({"error": "to_section is required for student transfer."}, status=status.HTTP_400_BAD_REQUEST)

        to_section = get_object_or_404(Section, id=to_section_id)
        to_campus = to_section.campus

        with transaction.atomic():
            StudentTransferRecord.objects.create(
                school=enrollment.school,
                student=enrollment.student,
                from_campus=from_campus,
                to_campus=to_campus,
                from_section=from_section,
                to_section=to_section,
                reason=reason,
                approved_by=request.user
            )

            enrollment.section = to_section
            enrollment.campus = to_campus
            if request.data.get('roll_number'):
                enrollment.roll_number = str(request.data.get('roll_number')).strip()
            enrollment.save(update_fields=['section', 'campus', 'roll_number'])

        return Response(StudentEnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Assessment.objects.all().select_related('term', 'subject', 'section')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(Q(section__isnull=True) | Q(section_id__in=assigned_sections))

        term_id = self.request.query_params.get('term')
        subject_id = self.request.query_params.get('subject')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs


class AssessmentResultViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentResult.objects.all().select_related('assessment', 'student')
        user = self.request.user

        # Role-based visibility isolation
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(
                Q(assessment__section_id__in=assigned_sections) |
                Q(student__academic_enrollments__section_id__in=assigned_sections)
            ).distinct()

        assessment_id = self.request.query_params.get('assessment')
        student_id = self.request.query_params.get('student')
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        assessment = serializer.validated_data.get('assessment')
        if getattr(user, 'role', None) == UserRole.TEACHER and assessment and assessment.section:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=user, section=assessment.section
            ).exists()
            if not is_assigned:
                raise PermissionDenied("Access denied: You are not assigned to enter results for this section.")
        serializer.save(school=get_current_school(), recorded_by=user)

    def update(self, request, *args, **kwargs):
        """
        Guarantees that published results cannot change without an audited correction.
        """
        instance = self.get_object()
        if instance.publication_locked:
            reason = request.data.get('correction_reason')
            if not reason or not str(reason).strip():
                return Response(
                    {"error": "Published results are locked. An audited correction_reason is required to modify this result."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            prev_marks = instance.attained_marks
            new_marks = Decimal(str(request.data.get('attained_marks', prev_marks)))

            # Perform standard update
            response = super().update(request, *args, **kwargs)

            # Record audited correction
            ResultCorrection.objects.create(
                school=instance.school,
                result=instance,
                previous_attained_marks=prev_marks,
                new_attained_marks=new_marks,
                reason=reason,
                corrected_by=request.user
            )

            AuditLog.objects.create(
                school=instance.school,
                actor=request.user,
                actor_username=request.user.username,
                actor_role=request.user.role,
                action="ASSESSMENT_RESULT_CORRECTED",
                resource_type="AssessmentResult",
                resource_id=str(instance.id),
                details={
                    "previous_marks": str(prev_marks),
                    "new_marks": str(new_marks),
                    "reason": reason
                }
            )
            return response

        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='publish')
    def publish_results(self, request):
        """
        Publishes assessment scores, locking them from silent modification.
        """
        assessment_id = request.data.get('assessment_id')
        if not assessment_id:
            return Response({"error": "assessment_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = AssessmentResult.objects.filter(assessment_id=assessment_id).update(
            is_published=True,
            published_at=timezone.now(),
            publication_locked=True
        )

        AuditLog.objects.create(
            school=get_current_school(),
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="ASSESSMENT_RESULTS_PUBLISHED",
            resource_type="Assessment",
            resource_id=str(assessment_id),
            details={"updated_count": updated_count}
        )

        return Response({"detail": f"{updated_count} results published and locked successfully."})

    @action(detail=False, methods=['post'], url_path='unpublish')
    def unpublish_results(self, request):
        """
        Unpublishes assessment scores (admin only), unlocking draft mode.
        """
        user = request.user
        if user.role not in (UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PRINCIPAL):
            raise PermissionDenied("Only administrative leaders can unlock published assessment results.")
        assessment_id = request.data.get('assessment_id')
        if not assessment_id:
            return Response({"error": "assessment_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = AssessmentResult.objects.filter(assessment_id=assessment_id).update(
            is_published=False,
            publication_locked=False
        )
        AuditLog.objects.create(
            school=get_current_school(),
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="ASSESSMENT_RESULTS_UNPUBLISHED",
            resource_type="Assessment",
            resource_id=str(assessment_id),
            details={"updated_count": updated_count}
        )
        return Response({"detail": f"{updated_count} results unlocked to draft mode."})

    @action(detail=False, methods=['post'], url_path='bulk-enter')
    def bulk_enter(self, request):
        """
        Continuous assessment marks entry grid for an entire class section.
        Validates 0 <= attained <= max_marks.
        Enforces Teacher Section Isolation.
        Rejects modifications to published/locked marks without an audited correction_reason.
        """
        assessment_id = request.data.get('assessment_id')
        results_data = request.data.get('results', [])

        if not assessment_id or not isinstance(results_data, list):
            return Response({"error": "assessment_id and results list are required."}, status=status.HTTP_400_BAD_REQUEST)

        assessment = get_object_or_404(Assessment, id=assessment_id)
        user = request.user

        # Teacher Section Scoping
        if user.role == UserRole.TEACHER and assessment.section:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=user, section=assessment.section
            ).exists()
            if not is_assigned:
                return Response(
                    {"error": "Access denied: You are not assigned to enter results for this section."},
                    status=status.HTTP_403_FORBIDDEN
                )

        saved_count = 0
        corrections_count = 0
        school = get_current_school() or assessment.school

        with transaction.atomic():
            for item in results_data:
                student_id = item.get('student_id')
                attained_val = item.get('attained_marks')
                reason = item.get('correction_reason', '').strip()

                if student_id is None or attained_val is None:
                    continue

                try:
                    attained_marks = Decimal(str(attained_val))
                except Exception:
                    return Response({"error": f"Invalid marks value for student {student_id}"}, status=status.HTTP_400_BAD_REQUEST)

                if attained_marks < Decimal("0.00"):
                    return Response({"error": "Attained marks cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

                if attained_marks > assessment.max_marks:
                    return Response(
                        {"error": f"Attained marks ({attained_marks}) cannot exceed assessment maximum ({assessment.max_marks})."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                existing = AssessmentResult.objects.filter(assessment=assessment, student_id=student_id).first()

                if existing:
                    if existing.publication_locked and existing.attained_marks != attained_marks:
                        if not reason:
                            return Response(
                                {"error": f"Result for student {student_id} is locked. An audited correction_reason is required to modify."},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        prev_marks = existing.attained_marks
                        existing.attained_marks = attained_marks
                        existing.save()

                        ResultCorrection.objects.create(
                            school=school,
                            result=existing,
                            previous_attained_marks=prev_marks,
                            new_attained_marks=attained_marks,
                            reason=reason,
                            corrected_by=user
                        )
                        corrections_count += 1
                    else:
                        existing.attained_marks = attained_marks
                        existing.save()
                    saved_count += 1
                else:
                    AssessmentResult.objects.create(
                        school=school,
                        assessment=assessment,
                        student_id=student_id,
                        attained_marks=attained_marks,
                        recorded_by=user
                    )
                    saved_count += 1

        return Response({
            "detail": f"{saved_count} scores recorded successfully.",
            "saved_count": saved_count,
            "corrections_count": corrections_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='class-benchmark')
    def class_benchmark(self, request):
        """
        Privacy-safe class attainment benchmark.
        Returns aggregate class average percentage only.
        STRICT PRIVACY GUARANTEE: Never includes peer names, student IDs, or individual student scores.
        """
        section_id = request.query_params.get('section')
        subject_id = request.query_params.get('subject')
        term_id = request.query_params.get('term')

        if not section_id or not subject_id:
            return Response({"error": "section and subject are required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = AssessmentResult.objects.filter(
            assessment__section_id=section_id,
            assessment__subject_id=subject_id,
            is_published=True
        )
        if term_id:
            qs = qs.filter(assessment__term_id=term_id)

        count = qs.values('student').distinct().count()
        avg_score = qs.aggregate(avg=Avg('percentage'))['avg'] or Decimal('0.00')

        return Response({
            "section_id": str(section_id),
            "subject_id": str(subject_id),
            "class_average_percentage": round(float(avg_score), 2),
            "student_count": count,
            # Explicit confirmation: Zero peer scores or names
            "peer_records": [],
        })


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceRecord.objects.all().select_related('student', 'section')
        user = self.request.user

        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(section_id__in=assigned_sections)

        section_id = self.request.query_params.get('section')
        date_str = self.request.query_params.get('date')
        student_id = self.request.query_params.get('student')
        if section_id:
            qs = qs.filter(section_id=section_id)
        if date_str:
            qs = qs.filter(date=date_str)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        section = serializer.validated_data.get('section')
        if getattr(user, 'role', None) == UserRole.TEACHER and section:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=user, section=section
            ).exists()
            if not is_assigned:
                raise PermissionDenied("Access denied: You are not assigned to mark attendance for this section.")
        serializer.save(school=get_current_school(), marked_by=user)

    @action(detail=False, methods=['post'], url_path='bulk-mark')
    def bulk_mark(self, request):
        """
        Rapid 1-click attendance marking for an entire class section.
        Enforces Teacher Class Isolation: Teachers cannot mark unassigned classes.
        """
        section_id = request.data.get('section_id')
        date_val = request.data.get('date', str(timezone.now().date()))
        records_data = request.data.get('records', [])

        if not section_id or not records_data:
            return Response({"error": "section_id and records are required."}, status=status.HTTP_400_BAD_REQUEST)

        section = get_object_or_404(Section, id=section_id)

        # Teacher Class Isolation Check
        if request.user.role == UserRole.TEACHER:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=request.user, section=section
            ).exists()
            if not is_assigned:
                return Response(
                    {"error": "Access denied: You are not assigned to mark attendance for this section."},
                    status=status.HTTP_403_FORBIDDEN
                )

        saved = 0
        with transaction.atomic():
            for item in records_data:
                st_id = item.get('student_id')
                stat = item.get('status', 'present')
                rem = item.get('remarks', '')
                AttendanceRecord.objects.update_or_create(
                    school=section.school,
                    student_id=st_id,
                    section=section,
                    date=date_val,
                    defaults={
                        "campus": section.campus,
                        "status": stat,
                        "remarks": rem,
                        "marked_by": request.user,
                    }
                )
                saved += 1

        return Response({"detail": f"{saved} student attendance records marked successfully.", "date": date_val})


class ParticipationRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ParticipationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ParticipationRecord.objects.all().select_related('student', 'section')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(section_id__in=assigned_sections)

        student_id = self.request.query_params.get('student')
        section_id = self.request.query_params.get('section')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs


class BehaviourCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = BehaviourCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BehaviourCategory.objects.all()


class BehaviourRecordViewSet(viewsets.ModelViewSet):
    serializer_class = BehaviourRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = BehaviourRecord.objects.all().select_related('student', 'section', 'category')
        user = self.request.user

        # Behaviour Note Privacy: Sensitive observations hidden from non-administrators
        if getattr(user, 'role', None) not in [UserRole.SUPERADMIN, UserRole.SCHOOL_ADMIN, UserRole.HEADMASTER]:
            qs = qs.filter(is_sensitive=False)

        # Student & Parent Isolation
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(section_id__in=assigned_sections)

        student_id = self.request.query_params.get('student')
        section_id = self.request.query_params.get('section')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        section = serializer.validated_data.get('section')
        if getattr(user, 'role', None) == UserRole.TEACHER and section:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=user, section=section
            ).exists()
            if not is_assigned:
                raise PermissionDenied("Access denied: You are not assigned to record behaviour for this section.")
        serializer.save(school=get_current_school(), recorded_by=user)


class SkillDimensionViewSet(viewsets.ModelViewSet):
    serializer_class = SkillDimensionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SkillDimension.objects.all().select_related('subject')


class SkillRatingViewSet(viewsets.ModelViewSet):
    serializer_class = SkillRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = SkillRating.objects.all().select_related('student', 'skill_dimension')
        user = self.request.user

        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)

        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.all().select_related('teacher', 'subject', 'section')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.TEACHER:
            qs = qs.filter(teacher=user)

        section_id = self.request.query_params.get('section')
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        section = serializer.validated_data.get('section')
        if getattr(user, 'role', None) == UserRole.TEACHER and section:
            is_assigned = SubjectTeacherAssignment.objects.filter(
                teacher=user, section=section
            ).exists()
            if not is_assigned:
                raise PermissionDenied("Access denied: You are not assigned to create tasks for this section.")
        serializer.save(school=get_current_school(), teacher=user)


class TaskSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TaskSubmission.objects.all().select_related('task', 'student')
        user = self.request.user

        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        elif getattr(user, 'role', None) == UserRole.TEACHER:
            assigned_sections = SubjectTeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True)
            qs = qs.filter(task__section_id__in=assigned_sections)

        task_id = self.request.query_params.get('task')
        student_id = self.request.query_params.get('student')
        if task_id:
            qs = qs.filter(task_id=task_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_submission(self, request, pk=None):
        sub = self.get_object()
        marks = request.data.get('marks_obtained')
        feedback = request.data.get('feedback', '')
        sub.submission_status = "verified"
        if marks is not None:
            sub.marks_obtained = Decimal(str(marks))
        sub.feedback = feedback
        sub.verified_by = request.user
        sub.verified_at = timezone.now()
        sub.save()
        return Response(TaskSubmissionSerializer(sub).data)


class EarlyInterventionViewSet(viewsets.ModelViewSet):
    serializer_class = EarlyInterventionFlagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = EarlyInterventionFlag.objects.all().select_related('student', 'assigned_to')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(student=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=linked_ids)
        return qs


# ==============================================================================
# CONFIGURATION VIEWSETS (Checkpoint 1a Foundation)
# ==============================================================================

class AQIConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AQIConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AQIConfig.objects.all()


class GradingScaleConfigViewSet(viewsets.ModelViewSet):
    serializer_class = GradingScaleConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradingScaleConfig.objects.all().prefetch_related('bands')


class AttendanceConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AttendanceConfig.objects.all()


class AttendanceStatusConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceStatusConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AttendanceStatusConfig.objects.all()


class AcademicPolicyConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicPolicyConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AcademicPolicyConfig.objects.all()


class FeePolicyConfigViewSet(viewsets.ModelViewSet):
    serializer_class = FeePolicyConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FeePolicyConfig.objects.all()


class LateFeeConfigViewSet(viewsets.ModelViewSet):
    serializer_class = LateFeeConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LateFeeConfig.objects.all()


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = StudentProfile.objects.all().select_related('user')
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.STUDENT:
            qs = qs.filter(user=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(user_id__in=linked_ids)
        return qs


class StaffProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StaffProfile.objects.all().select_related('user')


class ResultCorrectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResultCorrectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ResultCorrection.objects.all().select_related('result', 'corrected_by')


class AQIOverviewView(APIView):
    """
    Central API returning the multi-level AQI intelligence for the active school context.
    Thresholds and calculations are resolved dynamically via tenant AQIConfig.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = get_current_school()
        if not school:
            return Response({"error": "No tenant context found."}, status=status.HTTP_400_BAD_REQUEST)

        session_id = request.query_params.get('session')
        term_id = request.query_params.get('term')

        config = get_active_aqi_config(school=school)
        calc_method = config.calculation_method if config else "weighted_percentage"

        org_aqi = calculate_organization_aqi(
            school_id=school.id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calc_method
        )
        return Response(org_aqi)


class OnboardingBulkCSVView(APIView):
    """
    Handles Bulk CSV import and downloadable pre-formatted templates.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, target_type):
        response = Response(content_type='text/csv')
        if target_type == 'students':
            response['Content-Disposition'] = 'attachment; filename="optimus_orien_students_template.csv"'
            writer = csv.writer(response)
            writer.writerow(['roll_number', 'admission_number', 'full_name', 'username', 'email', 'phone', 'gender', 'grade', 'section'])
            writer.writerow(['101', 'REG-2026-001', 'Ayan Rehman', 'ayan.rehman', 'ayan@example.com', '+923001234567', 'male', 'Grade 10', 'A'])
            writer.writerow(['102', 'REG-2026-002', 'Zainab Fatima', 'zainab.fatima', 'zainab@example.com', '+923019876543', 'female', 'Grade 10', 'A'])
        elif target_type == 'teachers':
            response['Content-Disposition'] = 'attachment; filename="optimus_orien_teachers_template.csv"'
            writer = csv.writer(response)
            writer.writerow(['full_name', 'username', 'email', 'phone', 'gender', 'subject_code'])
            writer.writerow(['Tariq Mahmood', 'tariq.mahmood', 'tariq@example.com', '+923215551234', 'male', 'PHY-10'])
        else:
            response['Content-Disposition'] = 'attachment; filename="optimus_orien_curriculum_template.csv"'
            writer = csv.writer(response)
            writer.writerow(['grade_name', 'section_name', 'subject_name', 'subject_code'])
            writer.writerow(['Grade 10', 'A', 'Physics', 'PHY-10'])
            writer.writerow(['Grade 10', 'A', 'Mathematics', 'MTH-10'])
        return response

    def post(self, request, target_type):
        school = get_current_school()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "CSV file is required."}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = file_obj.read().decode('utf-8-sig')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        active_session = AcademicSession.objects.filter(school=school, is_current=True).first()
        main_campus = Campus.objects.filter(school=school, is_main=True).first()

        imported_count = 0
        with transaction.atomic():
            for row in reader:
                if target_type == 'students':
                    username = row.get('username', '').strip().lower()
                    full_name = row.get('full_name', '').strip()
                    email = row.get('email', '').strip()
                    roll = row.get('roll_number', '').strip()
                    adm = row.get('admission_number', '').strip() or roll
                    gender = row.get('gender', '').strip().lower()
                    grade_name = row.get('grade', 'Grade 10').strip()
                    sec_name = row.get('section', 'A').strip()

                    if not username:
                        continue

                    user, _ = User.objects.get_or_create(
                        username=username,
                        defaults={
                            "school": school,
                            "first_name": full_name,
                            "email": email,
                            "role": UserRole.STUDENT,
                        }
                    )
                    user.set_password("Student123#")
                    user.must_change_password = True
                    user.save()

                    # Link StudentProfile with RLS
                    StudentProfile.objects.get_or_create(
                        school=school,
                        user=user,
                        defaults={
                            "admission_number": adm,
                            "gender": gender if gender in ['male', 'female', 'other'] else '',
                        }
                    )

                    grade, _ = Grade.objects.get_or_create(school=school, name=grade_name)
                    section, _ = Section.objects.get_or_create(
                        school=school, campus=main_campus, grade=grade, name=sec_name
                    )

                    if active_session:
                        StudentEnrollment.objects.update_or_create(
                            school=school,
                            student=user,
                            session=active_session,
                            defaults={
                                "campus": main_campus,
                                "section": section,
                                "roll_number": roll,
                                "admission_number": adm,
                                "status": "enrolled",
                            }
                        )
                    imported_count += 1

                elif target_type == 'teachers':
                    username = row.get('username', '').strip().lower()
                    full_name = row.get('full_name', '').strip()
                    email = row.get('email', '').strip()
                    gender = row.get('gender', '').strip().lower()
                    if not username:
                        continue

                    user, _ = User.objects.get_or_create(
                        username=username,
                        defaults={
                            "school": school,
                            "first_name": full_name,
                            "email": email,
                            "role": UserRole.TEACHER,
                        }
                    )
                    user.set_password("Teacher123#")
                    user.must_change_password = True
                    user.save()

                    StaffProfile.objects.get_or_create(
                        school=school,
                        user=user,
                        defaults={
                            "employee_id": f"EMP-{user.username}",
                            "designation": "Teacher",
                            "department": "Academics",
                            "gender": gender if gender in ['male', 'female', 'other'] else '',
                        }
                    )
                    imported_count += 1

                elif target_type == 'curriculum':
                    grade_name = row.get('grade_name', '').strip()
                    sec_name = row.get('section_name', 'A').strip()
                    sub_name = row.get('subject_name', '').strip()
                    sub_code = row.get('subject_code', '').strip()

                    if grade_name and sub_name:
                        grade, _ = Grade.objects.get_or_create(school=school, name=grade_name)
                        if sec_name:
                            Section.objects.get_or_create(
                                school=school, campus=main_campus, grade=grade, name=sec_name
                            )
                        Subject.objects.get_or_create(
                            school=school, grade=grade, code=sub_code,
                            defaults={"name": sub_name}
                        )
                        imported_count += 1

        return Response({
            "detail": f"Successfully imported {imported_count} {target_type} records.",
            "imported_count": imported_count
        })


class ResultCorrectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResultCorrectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        result_id = self.request.query_params.get('result')
        qs = ResultCorrection.objects.all().select_related('result', 'corrected_by')
        if result_id:
            qs = qs.filter(result_id=result_id)
        return qs.order_by('-corrected_at')


class AQIConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AQIConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AQIConfig.objects.all().order_by('-is_active', '-created_at')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class GradingScaleConfigViewSet(viewsets.ModelViewSet):
    serializer_class = GradingScaleConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradingScaleConfig.objects.all().prefetch_related('bands').order_by('-is_default', 'name')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class GradingScaleBandViewSet(viewsets.ModelViewSet):
    serializer_class = GradingScaleBandSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        scale_id = self.request.query_params.get('scale')
        qs = GradingScaleBand.objects.all()
        if scale_id:
            qs = qs.filter(scale_id=scale_id)
        return qs.order_by('-min_percentage')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class AttendanceConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AttendanceConfig.objects.all()

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class AttendanceStatusConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceStatusConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AttendanceStatusConfig.objects.all().order_by('-credit_value')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class AcademicPolicyConfigViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicPolicyConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AcademicPolicyConfig.objects.all()

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class FeePolicyConfigViewSet(viewsets.ModelViewSet):
    serializer_class = FeePolicyConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FeePolicyConfig.objects.all()

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class LateFeeConfigViewSet(viewsets.ModelViewSet):
    serializer_class = LateFeeConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LateFeeConfig.objects.all()

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = StudentProfile.objects.all().select_related('user')
        if getattr(user, 'role', None) == UserRole.STUDENT:
            return qs.filter(user=user)
        elif getattr(user, 'role', None) == UserRole.PARENT:
            linked_student_ids = ParentStudentRelation.objects.filter(parent=user).values_list('student_id', flat=True)
            return qs.filter(user_id__in=linked_student_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class StaffProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = StaffProfile.objects.all().select_related('user')
        if getattr(user, 'role', None) in [UserRole.TEACHER, UserRole.ACCOUNTANT]:
            return qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())

