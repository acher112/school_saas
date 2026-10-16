"""
URL routing for Academics, Grading, Attendance, Tasks, Skills, and AQI Engine.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.academics.views import (
    TermViewSet,
    GradeViewSet,
    SectionViewSet,
    SubjectViewSet,
    SubjectTeacherAssignmentViewSet,
    StudentEnrollmentViewSet,
    AssessmentViewSet,
    AssessmentResultViewSet,
    AttendanceRecordViewSet,
    ParticipationRecordViewSet,
    BehaviourCategoryViewSet,
    BehaviourRecordViewSet,
    SkillDimensionViewSet,
    SkillRatingViewSet,
    TaskViewSet,
    TaskSubmissionViewSet,
    EarlyInterventionViewSet,
    AQIOverviewView,
    OnboardingBulkCSVView,
    ResultCorrectionViewSet,
    AQIConfigViewSet,
    GradingScaleConfigViewSet,
    GradingScaleBandViewSet,
    AttendanceConfigViewSet,
    AttendanceStatusConfigViewSet,
    AcademicPolicyConfigViewSet,
    FeePolicyConfigViewSet,
    LateFeeConfigViewSet,
    StudentProfileViewSet,
    StaffProfileViewSet,
)

router = DefaultRouter()
router.register(r'terms', TermViewSet, basename='academic-terms')
router.register(r'grades', GradeViewSet, basename='academic-grades')
router.register(r'sections', SectionViewSet, basename='academic-sections')
router.register(r'subjects', SubjectViewSet, basename='academic-subjects')
router.register(r'teacher-assignments', SubjectTeacherAssignmentViewSet, basename='academic-teacher-assignments')
router.register(r'enrollments', StudentEnrollmentViewSet, basename='academic-enrollments')
router.register(r'assessments', AssessmentViewSet, basename='academic-assessments')
router.register(r'results', AssessmentResultViewSet, basename='academic-results')
router.register(r'assessment-results', AssessmentResultViewSet, basename='academic-assessment-results')
router.register(r'result-corrections', ResultCorrectionViewSet, basename='academic-result-corrections')
router.register(r'attendance', AttendanceRecordViewSet, basename='academic-attendance')
router.register(r'participation', ParticipationRecordViewSet, basename='academic-participation')
router.register(r'behaviour/categories', BehaviourCategoryViewSet, basename='academic-behaviour-categories')
router.register(r'behaviour/records', BehaviourRecordViewSet, basename='academic-behaviour-records')
router.register(r'skills/dimensions', SkillDimensionViewSet, basename='academic-skill-dimensions')
router.register(r'skills/ratings', SkillRatingViewSet, basename='academic-skill-ratings')
router.register(r'tasks', TaskViewSet, basename='academic-tasks')
router.register(r'task-submissions', TaskSubmissionViewSet, basename='academic-task-submissions')
router.register(r'interventions', EarlyInterventionViewSet, basename='academic-interventions')
router.register(r'configs/aqi', AQIConfigViewSet, basename='config-aqi')
router.register(r'configs/grading-scales', GradingScaleConfigViewSet, basename='config-grading-scales')
router.register(r'configs/grading-bands', GradingScaleBandViewSet, basename='config-grading-bands')
router.register(r'configs/attendance', AttendanceConfigViewSet, basename='config-attendance')
router.register(r'configs/attendance-statuses', AttendanceStatusConfigViewSet, basename='config-attendance-statuses')
router.register(r'configs/academic-policies', AcademicPolicyConfigViewSet, basename='config-academic-policies')
router.register(r'configs/fee-policies', FeePolicyConfigViewSet, basename='config-fee-policies')
router.register(r'configs/late-fees', LateFeeConfigViewSet, basename='config-late-fees')
router.register(r'profiles/students', StudentProfileViewSet, basename='profiles-students')
router.register(r'profiles/staff', StaffProfileViewSet, basename='profiles-staff')

urlpatterns = [
    path('aqi/overview/', AQIOverviewView.as_view(), name='academic-aqi-overview'),
    path('onboarding/csv/<str:target_type>/', OnboardingBulkCSVView.as_view(), name='academic-onboarding-csv'),
    path('', include(router.urls)),
]
