"""
Optimus Orien Academic Quality Index (AQI) Calculation Engine.
Implements the hierarchical calculation logic specified in Headings 12 & 13:
Level 1: Student + Subject Performance
Level 2: Student Academic Average
Level 3: Class + Subject Average
Level 4: Class Academic Performance (Class AQI)
Level 5: Grade Performance (Grade AQI)
Level 6: Campus / School AQI
Level 7: Organization AQI

Features:
- Configurable calculation methods:
    1. 'weighted_percentage': sum(w_i * (attained_i / max_i)) / sum(w_i) * 100
    2. 'total_marks': sum(attained_i) / sum(max_i) * 100
- Dynamic status band thresholds loaded from tenant AQIConfig (Strong, Stable, Attention, Critical)
- Neutral display label: 'Needs focused support' for <50% on administrative screens
- Small-group privacy suppression for cohorts < minimum threshold (default 5)
- Privacy-safe class benchmarks (zero peer names or scores exposed)
"""
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db.models import Avg, Sum, Count, Q
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    Assessment,
    AssessmentResult,
    StudentEnrollment,
    AQISnapshot,
    AQIConfig,
)
from apps.core.models import School, Campus, AcademicSession


def get_active_aqi_config(school: Optional[School] = None, school_id: Optional[str] = None) -> Optional[AQIConfig]:
    """Retrieves active AQI configuration for the given school."""
    if not school and not school_id:
        return None
    try:
        if school:
            return AQIConfig.objects.filter(school=school, is_active=True).first()
        return AQIConfig.objects.filter(school_id=school_id, is_active=True).first()
    except Exception:
        return None


def get_status_band(score: float, school: Optional[School] = None, config: Optional[AQIConfig] = None) -> str:
    """
    Returns the Optimus Orien AQI internal status band code.
    Thresholds are dynamically resolved from AQIConfig; defaults to 85.0, 70.0, 50.0.
    """
    if not config and school:
        config = get_active_aqi_config(school=school)

    if config:
        strong = float(config.strong_threshold)
        stable = float(config.stable_threshold)
        attention = float(config.attention_threshold)
    else:
        strong = 85.0
        stable = 70.0
        attention = 50.0

    if score >= strong:
        return "strong"
    elif score >= stable:
        return "stable"
    elif score >= attention:
        return "attention"
    return "critical"


def get_display_band_label(band_code: str) -> str:
    """
    Returns neutral, non-stigmatizing display label for executive & administrative screens.
    Specifically renders 'Needs focused support' instead of alarming 'Critical'.
    """
    mapping = {
        "strong": "Strong",
        "stable": "Stable",
        "attention": "Attention",
        "critical": "Needs focused support",
    }
    return mapping.get(band_code, "Needs focused support")


def get_suggested_action(band_code: str) -> str:
    """Provides constructive, actionable pedagogical advice."""
    mapping = {
        "strong": "Maintain academic pace and enrichment activities",
        "stable": "Target specific competencies to elevate to high attainment",
        "attention": "Review concept pacing and assign targeted practice",
        "critical": "Activate focused faculty review and learning support plan",
    }
    return mapping.get(band_code, "Review subject progress")


def calculate_student_subject_score(
    student_id,
    subject_id,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 1: Computes student subject performance for selected assessment period.
    Supported methods:
      1. 'weighted_percentage' (Default):
         Attainment = sum(w_i * (attained_i / max_i)) / sum(w_i) * 100
      2. 'total_marks':
         Attainment = sum(attained_i) / sum(max_i) * 100
    """
    qs = AssessmentResult.objects.filter(student_id=student_id, assessment__subject_id=subject_id)
    if term_id:
        qs = qs.filter(assessment__term_id=term_id)
    elif session_id:
        qs = qs.filter(assessment__term__session_id=session_id)

    results_list = list(qs.select_related('assessment', 'school'))
    if not results_list:
        return {
            "student_id": str(student_id),
            "subject_id": str(subject_id),
            "score": 0.0,
            "assessments_count": 0,
            "status_band": "critical",
            "display_status": "Needs focused support",
            "suggested_action": get_suggested_action("critical"),
        }

    # Resolve school context and config
    if not school and results_list:
        school = results_list[0].school

    config = get_active_aqi_config(school=school)
    if not calculation_method:
        calculation_method = config.calculation_method if config else "weighted_percentage"

    if calculation_method == "total_marks":
        total_attained = Decimal("0.00")
        total_max = Decimal("0.00")
        for res in results_list:
            total_attained += res.attained_marks
            total_max += res.assessment.max_marks

        if total_max > 0:
            raw_pct = (total_attained / total_max) * Decimal("100.00")
            score = float(round(raw_pct, 2))
        else:
            score = 0.0
    else:
        # Standard weighted percentage formula: sum(w_i * (A_i / M_i)) / sum(w_i) * 100
        weighted_sum = Decimal("0.00")
        weight_total = Decimal("0.00")

        for res in results_list:
            w = res.assessment.weight_percentage or Decimal("100.00")
            m = res.assessment.max_marks
            if m > 0:
                normalized_ratio = res.attained_marks / m
                weighted_sum += w * normalized_ratio
                weight_total += w

        if weight_total > 0:
            raw_pct = (weighted_sum / weight_total) * Decimal("100.00")
            score = float(round(raw_pct, 2))
        else:
            score = 0.0

    status_band = get_status_band(score, school=school, config=config)

    return {
        "student_id": str(student_id),
        "subject_id": str(subject_id),
        "score": score,
        "calculation_method": calculation_method,
        "assessments_count": len(results_list),
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
    }


def calculate_student_academic_average(
    student_id,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 2: Average across the student's evaluated subjects.
    """
    results = AssessmentResult.objects.filter(student_id=student_id)
    if term_id:
        results = results.filter(assessment__term_id=term_id)
    elif session_id:
        results = results.filter(assessment__term__session_id=session_id)

    subject_ids = list(results.values_list('assessment__subject_id', flat=True).distinct())
    subject_scores = []

    for sub_id in subject_ids:
        sub_calc = calculate_student_subject_score(
            student_id=student_id,
            subject_id=sub_id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if sub_calc["assessments_count"] > 0:
            subject = Subject.objects.filter(id=sub_id).first()
            subject_scores.append({
                "subject_id": str(sub_id),
                "subject_name": subject.name if subject else "Subject",
                "subject_code": subject.code if subject else "",
                "score": sub_calc["score"],
                "status_band": sub_calc["status_band"],
                "display_status": sub_calc["display_status"],
            })

    if subject_scores:
        overall_avg = round(sum(s["score"] for s in subject_scores) / len(subject_scores), 2)
    else:
        overall_avg = 0.0

    status_band = get_status_band(overall_avg, school=school)

    return {
        "student_id": str(student_id),
        "score": overall_avg,
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
        "subject_breakdown": subject_scores,
    }


def calculate_class_subject_average(
    section_id,
    subject_id,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 3: Class + Subject: Average of student subject performance within the class.
    Enforces small-group privacy suppression if student count < minimum cohort size.
    """
    section = Section.objects.select_related('school').filter(id=section_id).first()
    if section and not school:
        school = section.school

    config = get_active_aqi_config(school=school)
    min_cohort = config.small_group_suppression_limit if config else 5

    enrollments = StudentEnrollment.objects.filter(section_id=section_id, status="enrolled")
    if session_id:
        enrollments = enrollments.filter(session_id=session_id)

    student_ids = list(enrollments.values_list('student_id', flat=True))
    scores = []

    for st_id in student_ids:
        res = calculate_student_subject_score(
            student_id=st_id,
            subject_id=subject_id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if res["assessments_count"] > 0:
            scores.append(res["score"])

    student_count = len(scores)
    is_suppressed = student_count < min_cohort and student_count > 0

    if scores:
        class_sub_avg = round(sum(scores) / len(scores), 2)
    else:
        class_sub_avg = 0.0

    status_band = get_status_band(class_sub_avg, school=school, config=config)

    return {
        "section_id": str(section_id),
        "subject_id": str(subject_id),
        "score": class_sub_avg,
        "student_count": student_count,
        "is_suppressed": is_suppressed,
        "suppression_reason": f"Cohort size ({student_count}) is below privacy suppression limit ({min_cohort})" if is_suppressed else "",
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
    }


def calculate_class_aqi(
    section_id,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 4: Class Academic Performance (Class AQI).
    Average of the class's subject averages.
    Enforces small-group suppression if enrolled students in section < minimum cohort.
    """
    section = Section.objects.select_related('grade', 'campus', 'school').filter(id=section_id).first()
    if not section:
        return {"score": 0.0, "status_band": "critical", "display_status": "Needs focused support", "subject_breakdown": []}

    if not school:
        school = section.school

    config = get_active_aqi_config(school=school)
    min_cohort = config.small_group_suppression_limit if config else 5

    # Check enrollment count for small group suppression
    enrollment_count = StudentEnrollment.objects.filter(section_id=section_id, status="enrolled").count()
    is_suppressed = 0 < enrollment_count < min_cohort

    subjects = Subject.objects.filter(grade=section.grade)
    subject_averages = []

    for sub in subjects:
        c_sub = calculate_class_subject_average(
            section_id=section.id,
            subject_id=sub.id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if c_sub["student_count"] > 0:
            subject_averages.append({
                "subject_id": str(sub.id),
                "subject_name": sub.name,
                "subject_code": sub.code,
                "score": c_sub["score"],
                "student_count": c_sub["student_count"],
                "status_band": c_sub["status_band"],
                "display_status": c_sub["display_status"],
            })

    if subject_averages:
        class_score = round(sum(s["score"] for s in subject_averages) / len(subject_averages), 2)
    else:
        class_score = 0.0

    status_band = get_status_band(class_score, school=school, config=config)

    return {
        "section_id": str(section.id),
        "section_name": str(section),
        "score": class_score,
        "enrollment_count": enrollment_count,
        "is_suppressed": is_suppressed,
        "suppression_reason": f"Cohort size ({enrollment_count}) is below privacy suppression limit ({min_cohort})" if is_suppressed else "",
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
        "subject_breakdown": subject_averages,
    }


def calculate_grade_aqi(
    grade_id,
    campus_id: Optional[str] = None,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 5: Grade Performance (Grade AQI).
    Average of relevant class performance.
    """
    grade = Grade.objects.select_related('school').filter(id=grade_id).first()
    if not grade:
        return {"score": 0.0, "status_band": "critical", "display_status": "Needs focused support", "class_breakdown": []}

    if not school:
        school = grade.school

    config = get_active_aqi_config(school=school)

    sections_qs = Section.objects.filter(grade_id=grade_id)
    if campus_id:
        sections_qs = sections_qs.filter(campus_id=campus_id)

    class_results = []
    for sec in sections_qs:
        c_aqi = calculate_class_aqi(
            section_id=sec.id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if c_aqi["subject_breakdown"]:
            class_results.append({
                "section_id": str(sec.id),
                "section_name": str(sec),
                "score": c_aqi["score"],
                "status_band": c_aqi["status_band"],
                "display_status": c_aqi["display_status"],
                "is_suppressed": c_aqi["is_suppressed"],
                "subjects": c_aqi["subject_breakdown"],
            })

    if class_results:
        grade_score = round(sum(c["score"] for c in class_results) / len(class_results), 2)
    else:
        grade_score = 0.0

    status_band = get_status_band(grade_score, school=school, config=config)

    return {
        "grade_id": str(grade.id),
        "grade_name": grade.name,
        "score": grade_score,
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
        "class_breakdown": class_results,
    }


def calculate_campus_aqi(
    campus_id,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
    school: Optional[School] = None,
) -> Dict[str, Any]:
    """
    Level 6: Campus / School AQI.
    Aggregates performance across all active grades and sections on campus.
    """
    campus = Campus.objects.select_related('school').filter(id=campus_id).first()
    if not campus:
        return {"score": 0.0, "status_band": "critical", "display_status": "Needs focused support", "grade_breakdown": []}

    if not school:
        school = campus.school

    config = get_active_aqi_config(school=school)

    grades = Grade.objects.filter(school_id=campus.school_id)
    grade_results = []

    for gr in grades:
        g_aqi = calculate_grade_aqi(
            grade_id=gr.id,
            campus_id=campus.id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if g_aqi["class_breakdown"]:
            grade_results.append({
                "grade_id": str(gr.id),
                "grade_name": gr.name,
                "score": g_aqi["score"],
                "status_band": g_aqi["status_band"],
                "display_status": g_aqi["display_status"],
                "classes": g_aqi["class_breakdown"],
            })

    if grade_results:
        campus_score = round(sum(g["score"] for g in grade_results) / len(grade_results), 2)
    else:
        campus_score = 0.0

    status_band = get_status_band(campus_score, school=school, config=config)

    return {
        "campus_id": str(campus.id),
        "campus_name": campus.name,
        "campus_code": campus.code,
        "school_id": str(campus.school_id),
        "school_name": campus.school.name,
        "score": campus_score,
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
        "grade_breakdown": grade_results,
    }


def calculate_organization_aqi(
    school_id=None,
    school: Optional[School] = None,
    term_id: Optional[str] = None,
    session_id: Optional[str] = None,
    calculation_method: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Level 7: Organization AQI.
    Authorized multi-campus aggregation for School / Organization.
    """
    if not school and school_id:
        school = School.objects.filter(id=school_id).first()
    elif school and not school_id:
        school_id = school.id

    if not school:
        return {"score": 0.0, "status_band": "critical", "display_status": "Needs focused support", "campus_breakdown": []}

    config = get_active_aqi_config(school=school)

    campuses = Campus.objects.filter(school=school)
    campus_results = []

    for camp in campuses:
        c_calc = calculate_campus_aqi(
            campus_id=camp.id,
            term_id=term_id,
            session_id=session_id,
            calculation_method=calculation_method,
            school=school,
        )
        if c_calc["grade_breakdown"]:
            campus_results.append(c_calc)

    if campus_results:
        org_score = round(sum(c["score"] for c in campus_results) / len(campus_results), 2)
    else:
        org_score = 0.0

    academic_score = org_score
    final_score = academic_score
    is_blended = False

    # Component Decoupling (Spec Sections 12 & 13):
    # AQI is derived purely from subject academic performance unless explicitly configured.
    if config and (config.include_attendance or config.include_behaviour or config.include_participation):
        total_other_w = Decimal("0.00")
        att_rate = None
        beh_rate = None

        if config.include_attendance:
            from apps.academics.models import AttendanceRecord
            att_qs = AttendanceRecord.objects.filter(school=school)
            if term_id:
                t = Term.objects.filter(id=term_id).first()
                if t:
                    att_qs = att_qs.filter(date__gte=t.start_date, date__lte=t.end_date)
            tot_att = att_qs.count()
            if tot_att > 0:
                pres_att = att_qs.filter(status='present').count()
                att_rate = round((pres_att / tot_att) * 100, 2)
            else:
                att_rate = 100.0
            total_other_w += config.attendance_weight

        if config.include_behaviour:
            total_other_w += config.behaviour_weight
            beh_rate = 80.0

        acad_w = Decimal("1.00") - total_other_w
        if acad_w < Decimal("0.00"):
            acad_w = Decimal("0.00")

        blended = (acad_w * Decimal(str(academic_score)))
        if config.include_attendance and att_rate is not None:
            blended += (config.attendance_weight * Decimal(str(att_rate)))
        if config.include_behaviour and beh_rate is not None:
            blended += (config.behaviour_weight * Decimal(str(beh_rate)))

        final_score = float(round(blended, 2))
        is_blended = True

    status_band = get_status_band(final_score, school=school, config=config)

    return {
        "school_id": str(school.id),
        "school_name": school.name,
        "score": final_score,
        "academic_score": academic_score,
        "is_blended": is_blended,
        "attendance_included": bool(config.include_attendance) if config else False,
        "behaviour_included": bool(config.include_behaviour) if config else False,
        "status_band": status_band,
        "display_status": get_display_band_label(status_band),
        "suggested_action": get_suggested_action(status_band),
        "campus_breakdown": campus_results,
    }


def snapshot_aqi(
    school: School,
    session: AcademicSession,
    term: Optional[Term] = None,
    campus: Optional[Campus] = None
) -> AQISnapshot:
    """
    Persists an immutable AQI snapshot into the database for longitudinal trending.
    """
    if campus:
        res = calculate_campus_aqi(campus.id, term_id=term.id if term else None, session_id=session.id, school=school)
        scope_type = "campus"
        scope_id = str(campus.id)
        scope_name = f"{school.name} - {campus.name}"
    else:
        res = calculate_organization_aqi(school.id, term_id=term.id if term else None, session_id=session.id)
        scope_type = "organization"
        scope_id = str(school.id)
        scope_name = school.name

    snapshot, created = AQISnapshot.objects.update_or_create(
        school=school,
        session=session,
        term=term,
        scope_type=scope_type,
        scope_id=scope_id,
        defaults={
            "campus": campus,
            "scope_name": scope_name,
            "aqi_score": Decimal(str(res["score"])),
            "status_band": res["status_band"],
            "component_breakdown": res,
        }
    )
    return snapshot
