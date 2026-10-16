"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken, getCurrentUser, getSchoolSlug } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ShieldAlert,
  Search,
  Users,
} from "lucide-react";

interface TermItem {
  id: string;
  name: string;
  term_code: string;
  start_date: string;
  end_date: string;
  weight_percentage: string;
  is_current: boolean;
  is_closed: boolean;
}

interface GradeItem {
  id: string;
  name: string;
  code: string;
  level_order: number;
}

interface SectionItem {
  id: string;
  name: string;
  grade: string;
  grade_name?: string;
  campus: string;
  campus_name?: string;
  room_number: string;
  capacity: number;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  grade: string;
  grade_name?: string;
  is_elective: boolean;
  credit_hours: string;
}

interface AssignmentItem {
  id: string;
  teacher: string;
  teacher_name?: string;
  teacher_username?: string;
  section: string;
  section_name?: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  is_class_teacher: boolean;
}

interface EnrollmentItem {
  id: string;
  student: string;
  student_name?: string;
  student_username?: string;
  student_gender?: string;
  section: string;
  section_name?: string;
  grade_name?: string;
  campus_name?: string;
  roll_number: string;
  admission_number: string;
  status: string;
}

export default function AcademicStructurePage() {
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"terms" | "grades_sections" | "subjects" | "allocations" | "enrollments">("terms");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);

  // Filter
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null);

  // Form inputs
  const [newTerm, setNewTerm] = useState({ name: "", term_code: "", start_date: "", end_date: "", weight_percentage: "25.00", is_current: false });
  const [newGrade, setNewGrade] = useState({ name: "", code: "", level_order: 10 });
  const [newSection, setNewSection] = useState({ name: "", grade: "", campus: "", room_number: "", capacity: 35 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", grade: "", is_elective: false, credit_hours: "3.00" });
  const [newAssignment, setNewAssignment] = useState({ teacher: "", section: "", subject: "", is_class_teacher: false });
  const [transferForm, setTransferForm] = useState({ to_section: "", roll_number: "", reason: "" });

  const isRTL = lang === "ur" || lang === "ar";

  useEffect(() => {
    const handleLangChange = (e: any) => {
      setLang(e.detail || "en");
    };
    window.addEventListener("app_lang_changed", handleLangChange);
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved) setLang(saved);
    } catch (e) {}

    loadAcademicData();
    return () => window.removeEventListener("app_lang_changed", handleLangChange);
  }, []);

  const loadAcademicData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const [
          sessionsRes,
          campusesRes,
          termsRes,
          gradesRes,
          sectionsRes,
          subjectsRes,
          assignRes,
          enrollRes,
          usersRes
        ]: any = await Promise.allSettled([
          apiRequest("/api/v1/core/sessions/"),
          apiRequest("/api/v1/core/campuses/"),
          apiRequest("/api/v1/academics/terms/"),
          apiRequest("/api/v1/academics/grades/"),
          apiRequest("/api/v1/academics/sections/"),
          apiRequest("/api/v1/academics/subjects/"),
          apiRequest("/api/v1/academics/teacher-assignments/"),
          apiRequest("/api/v1/academics/enrollments/"),
          apiRequest("/api/v1/auth/users/?role=teacher"),
        ]);

        if (sessionsRes.status === "fulfilled" && sessionsRes.value) {
          const sList = Array.isArray(sessionsRes.value) ? sessionsRes.value : sessionsRes.value?.results || [];
          setSessions(sList);
          const current = sList.find((s: any) => s.is_current) || sList[0];
          setActiveSession(current);
        }

        if (campusesRes.status === "fulfilled" && campusesRes.value) {
          const cList = Array.isArray(campusesRes.value) ? campusesRes.value : campusesRes.value?.results || [];
          setCampuses(cList);
          if (cList.length > 0 && !newSection.campus) {
            setNewSection((prev) => ({ ...prev, campus: cList[0].id }));
          }
        }

        if (termsRes.status === "fulfilled" && termsRes.value) {
          setTerms(Array.isArray(termsRes.value) ? termsRes.value : termsRes.value?.results || []);
        }
        if (gradesRes.status === "fulfilled" && gradesRes.value) {
          const gList = Array.isArray(gradesRes.value) ? gradesRes.value : gradesRes.value?.results || [];
          setGrades(gList);
          if (gList.length > 0) {
            setNewSection((prev) => ({ ...prev, grade: gList[0].id }));
            setNewSubject((prev) => ({ ...prev, grade: gList[0].id }));
          }
        }
        if (sectionsRes.status === "fulfilled" && sectionsRes.value) {
          const secList = Array.isArray(sectionsRes.value) ? sectionsRes.value : sectionsRes.value?.results || [];
          setSections(secList);
          if (secList.length > 0) {
            setNewAssignment((prev) => ({ ...prev, section: secList[0].id }));
          }
        }
        if (subjectsRes.status === "fulfilled" && subjectsRes.value) {
          const subList = Array.isArray(subjectsRes.value) ? subjectsRes.value : subjectsRes.value?.results || [];
          setSubjects(subList);
          if (subList.length > 0) {
            setNewAssignment((prev) => ({ ...prev, subject: subList[0].id }));
          }
        }
        if (assignRes.status === "fulfilled" && assignRes.value) {
          setAssignments(Array.isArray(assignRes.value) ? assignRes.value : assignRes.value?.results || []);
        }
        if (enrollRes.status === "fulfilled" && enrollRes.value) {
          setEnrollments(Array.isArray(enrollRes.value) ? enrollRes.value : enrollRes.value?.results || []);
        }
        if (usersRes.status === "fulfilled" && usersRes.value) {
          const tList = Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.results || [];
          setTeachersList(tList);
          if (tList.length > 0) {
            setNewAssignment((prev) => ({ ...prev, teacher: tList[0].id }));
          }
        }
      } else {
        // Fallback for visual preview and verification
        setActiveSession({ id: "s1", name: "2026-2027", is_current: true });
        setCampuses([
          { id: "c1", name: "Main Campus (Gulberg)", code: "MAIN", is_main: true },
          { id: "c2", name: "City Branch (Johar Town)", code: "JT", is_main: false },
        ]);
        setTerms([
          { id: "t1", name: "First Term (Diagnostic)", term_code: "T1", start_date: "2026-08-15", end_date: "2026-11-20", weight_percentage: "25.00", is_current: false, is_closed: true },
          { id: "t2", name: "Mid-Term Examination", term_code: "T2", start_date: "2026-12-01", end_date: "2027-02-28", weight_percentage: "25.00", is_current: true, is_closed: false },
          { id: "t3", name: "Final Examination", term_code: "FINAL", start_date: "2027-03-01", end_date: "2027-06-15", weight_percentage: "50.00", is_current: false, is_closed: false },
        ]);
        setGrades([
          { id: "g8", name: "Grade 8 (Middle Tier)", code: "G8", level_order: 8 },
          { id: "g9", name: "Grade 9 (Secondary Tier)", code: "G9", level_order: 9 },
          { id: "g10", name: "Grade 10 (Matriculation)", code: "G10", level_order: 10 },
        ]);
        setSections([
          { id: "sec1", name: "10-A (Science Alpha)", grade: "g10", grade_name: "Grade 10", campus: "c1", campus_name: "Main Campus", room_number: "Room 101", capacity: 35 },
          { id: "sec2", name: "10-B (Science Beta)", grade: "g10", grade_name: "Grade 10", campus: "c1", campus_name: "Main Campus", room_number: "Room 102", capacity: 35 },
          { id: "sec3", name: "9-A (Pre-Medical)", grade: "g9", grade_name: "Grade 9", campus: "c2", campus_name: "City Branch", room_number: "Lab Wing B", capacity: 30 },
        ]);
        setSubjects([
          { id: "sub1", name: "Mathematics (Advanced)", code: "MTH-10", grade: "g10", grade_name: "Grade 10", is_elective: false, credit_hours: "4.00" },
          { id: "sub2", name: "Physics & Lab Practical", code: "PHY-10", grade: "g10", grade_name: "Grade 10", is_elective: false, credit_hours: "4.00" },
          { id: "sub3", name: "English Language & Composition", code: "ENG-10", grade: "g10", grade_name: "Grade 10", is_elective: false, credit_hours: "3.00" },
          { id: "sub4", name: "Urdu Literature & Grammar", code: "URD-10", grade: "g10", grade_name: "Grade 10", is_elective: false, credit_hours: "3.00" },
        ]);
        setAssignments([
          { id: "a1", teacher: "u1", teacher_name: "Sir Tariq Mahmood", section: "sec1", section_name: "10-A (Science Alpha)", subject: "sub1", subject_name: "Mathematics (Advanced)", subject_code: "MTH-10", is_class_teacher: true },
          { id: "a2", teacher: "u2", teacher_name: "Madam Ayesha Khan", section: "sec1", section_name: "10-A (Science Alpha)", subject: "sub2", subject_name: "Physics & Lab Practical", subject_code: "PHY-10", is_class_teacher: false },
          { id: "a3", teacher: "u3", teacher_name: "Sir Farhan Akram", section: "sec3", section_name: "9-A (Pre-Medical)", subject: "sub3", subject_name: "English Language", subject_code: "ENG-10", is_class_teacher: true },
        ]);
        setEnrollments([
          { id: "e1", student: "s1", student_name: "Zain Ali", student_username: "zain_10a", student_gender: "Male", section: "sec1", section_name: "10-A (Science Alpha)", grade_name: "Grade 10", campus_name: "Main Campus", roll_number: "1001", admission_number: "ADM-2025-012", status: "enrolled" },
          { id: "e2", student: "s2", student_name: "Fatima Noor", student_username: "fatima_10a", student_gender: "Female", section: "sec1", section_name: "10-A (Science Alpha)", grade_name: "Grade 10", campus_name: "Main Campus", roll_number: "1002", admission_number: "ADM-2025-015", status: "enrolled" },
          { id: "e3", student: "s3", student_name: "Hamza Bilal", student_username: "hamza_9a", student_gender: "Male", section: "sec3", section_name: "9-A (Pre-Medical)", grade_name: "Grade 9", campus_name: "City Branch", roll_number: "901", admission_number: "ADM-2026-088", status: "enrolled" },
        ]);
        setTeachersList([
          { id: "u1", username: "tariq_math", full_name: "Sir Tariq Mahmood" },
          { id: "u2", username: "ayesha_phy", full_name: "Madam Ayesha Khan" },
          { id: "u3", username: "farhan_eng", full_name: "Sir Farhan Akram" },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      await apiRequest("/api/v1/academics/terms/", {
        method: "POST",
        body: JSON.stringify({
          session: activeSession.id,
          name: newTerm.name,
          term_code: newTerm.term_code,
          start_date: newTerm.start_date,
          end_date: newTerm.end_date,
          weight_percentage: newTerm.weight_percentage,
          is_current: newTerm.is_current,
        }),
      });
      setSuccessMsg("Academic Term created successfully.");
      setShowAddTermModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create term.");
    }
  };

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/v1/academics/grades/", {
        method: "POST",
        body: JSON.stringify(newGrade),
      });
      setSuccessMsg("Grade Level created successfully.");
      setShowAddGradeModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create grade.");
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/v1/academics/sections/", {
        method: "POST",
        body: JSON.stringify(newSection),
      });
      setSuccessMsg("Section created successfully.");
      setShowAddSectionModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create section.");
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/v1/academics/subjects/", {
        method: "POST",
        body: JSON.stringify(newSubject),
      });
      setSuccessMsg("Subject curriculum created successfully.");
      setShowAddSubjectModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create subject.");
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      await apiRequest("/api/v1/academics/teacher-assignments/", {
        method: "POST",
        body: JSON.stringify({
          ...newAssignment,
          session: activeSession.id,
        }),
      });
      setSuccessMsg("Teacher assignment recorded successfully.");
      setShowAssignModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign teacher.");
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    try {
      await apiRequest(`/api/v1/academics/enrollments/${selectedEnrollment.id}/transfer/`, {
        method: "POST",
        body: JSON.stringify(transferForm),
      });
      setSuccessMsg("Student transferred and historical record audited successfully.");
      setShowTransferModal(false);
      loadAcademicData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to transfer student.");
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (selectedCampusId && e.campus_name && !e.campus_name.includes(selectedCampusId)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.student_name?.toLowerCase().includes(q) ||
        e.student_username?.toLowerCase().includes(q) ||
        e.roll_number.toLowerCase().includes(q) ||
        e.admission_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppShell
      activeRole={getCurrentUser()?.role || "admin"}
      userName={getCurrentUser()?.full_name || getCurrentUser()?.username || "Admin Office"}
      schoolName={getCurrentUser()?.school?.name || "Optimus Orien"}
      schoolSlug={getCurrentUser()?.school?.slug || getSchoolSlug() || "portal"}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {isRTL ? "تعلیمی ڈھانچہ اور نصاب" : "Institutional Academic Structure & Curriculum"}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              {isRTL
                ? "کلاسیں، سیکشنز، ٹرمز، مضامین، اساتذہ کی تعیناتی اور طلبہ کے اندراج کا نظم کریں"
                : "Manage terms, grade tiers, sections, curriculum subjects, faculty allocations, and student cohorts."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeSession && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {isRTL ? `فعال تعلیمی سیشن: ${activeSession.name}` : `Active Session: ${activeSession.name}`}
              </span>
            )}
            <button
              onClick={loadAcademicData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-medium border border-slate-700/60"
              title="Refresh Directory"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-xs text-rose-400 hover:text-white">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-xs text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "terms"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            {isRTL ? "ٹرمز اور امتحانی ادوار" : "1. Terms & Assessment Periods"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-300">{terms.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("grades_sections")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "grades_sections"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            {isRTL ? "گریڈز اور سیکشنز" : "2. Grades & Class Sections"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-300">{sections.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "subjects"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {isRTL ? "تعلیمی مضامین" : "3. Curriculum Subjects"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-300">{subjects.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("allocations")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "allocations"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {isRTL ? "اساتذہ کی تعیناتی" : "4. Faculty Allocations"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-300">{assignments.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("enrollments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "enrollments"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            {isRTL ? "طلبہ کا اندراج اور ٹرانسفر" : "5. Student Cohorts & Transfers"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-300">{enrollments.length}</span>
          </button>
        </div>

        {/* Tab 1: Terms & Assessment Periods */}
        {activeTab === "terms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isRTL ? "ٹرمز اور امتحانی ادوار کی ترتیب" : "Configured Assessment Terms & Cumulative Weights"}</span>
              </h2>
              <button
                onClick={() => setShowAddTermModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {isRTL ? "+ نیا ٹرم شامل کریں" : "+ Add Term"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {terms.map((t) => (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                    t.is_current
                      ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-900/20"
                      : "bg-slate-900/40 border-slate-800/80"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] font-bold">
                        {t.term_code}
                      </span>
                      {t.is_current ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          ● Active Term
                        </span>
                      ) : t.is_closed ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">Closed</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">Upcoming</span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-white">{t.name}</h3>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="font-medium text-slate-300">{t.start_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End Date:</span>
                        <span className="font-medium text-slate-300">{t.end_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Annual AQI Weight:</span>
                    <span className="font-bold text-indigo-400 font-mono text-sm">{t.weight_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Grades & Sections */}
        {activeTab === "grades_sections" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">{isRTL ? "گریڈز اور کلاس سیکشنز" : "Educational Grade Tiers & Class Sections"}</h2>
                <p className="text-xs text-slate-400">Class sections belong to specific campus branches with designated room capacity.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddGradeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + New Grade Tier
                </button>
                <button
                  onClick={() => setShowAddSectionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + New Section
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                      {s.grade_name || "Grade"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {s.campus_name || "Main Campus"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white">{s.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Room Number</span>
                      <span className="font-medium text-slate-200">{s.room_number || "Not assigned"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Capacity Limit</span>
                      <span className="font-medium text-slate-200">{s.capacity} students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Curriculum Subjects */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">{isRTL ? "مضامین کا نصاب" : "Academic Curriculum Subjects"}</h2>
                <p className="text-xs text-slate-400">Authorized curriculum subjects mapped to grade tiers with designated credit hours.</p>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Subject
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Code</th>
                      <th className="px-5 py-3.5">Subject Name</th>
                      <th className="px-5 py-3.5">Grade Level</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Credit Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 font-mono text-indigo-400 font-bold">{sub.code}</td>
                        <td className="px-5 py-3.5 text-white font-bold">{sub.name}</td>
                        <td className="px-5 py-3.5 text-slate-300">{sub.grade_name || "Grade Tier"}</td>
                        <td className="px-5 py-3.5">
                          {sub.is_elective ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                              Elective
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                              Compulsory
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-300">{sub.credit_hours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Teacher Allocations */}
        {activeTab === "allocations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">{isRTL ? "اساتذہ کی تعیناتی" : "Faculty Subject & Class Teacher Assignments"}</h2>
                <p className="text-xs text-slate-400">Class teachers (Homeroom In-charge) take daily attendance; Subject teachers enter continuous marks.</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                + Allocate Teacher
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Teacher / Faculty</th>
                      <th className="px-5 py-3.5">Section</th>
                      <th className="px-5 py-3.5">Assigned Subject</th>
                      <th className="px-5 py-3.5">Role Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 text-white font-bold flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-indigo-400">
                            👤
                          </span>
                          {a.teacher_name || a.teacher_username || a.teacher}
                        </td>
                        <td className="px-5 py-3.5 text-slate-200">{a.section_name || a.section}</td>
                        <td className="px-5 py-3.5 text-indigo-400 font-medium">{a.subject_name || a.subject}</td>
                        <td className="px-5 py-3.5">
                          {a.is_class_teacher ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              ★ Homeroom Class Teacher
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                              Subject Teacher
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Student Cohorts & Transfers */}
        {activeTab === "enrollments" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">{isRTL ? "طلبہ کا اندراج اور ٹرانسفر ریکارڈ" : "Student Enrollment & Intra-Session Transfers"}</h2>
                <p className="text-xs text-slate-400">Past session records remain immutable. Transfers preserve full historical context.</p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student or roll..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Roll #</th>
                      <th className="px-5 py-3.5">Student Name</th>
                      <th className="px-5 py-3.5">Admission ID</th>
                      <th className="px-5 py-3.5">Class / Section</th>
                      <th className="px-5 py-3.5">Branch Campus</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredEnrollments.map((en) => (
                      <tr key={en.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 font-mono text-indigo-400 font-bold">{en.roll_number}</td>
                        <td className="px-5 py-3.5 text-white font-bold">{en.student_name || en.student_username}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">{en.admission_number}</td>
                        <td className="px-5 py-3.5 text-slate-200">{en.section_name}</td>
                        <td className="px-5 py-3.5 text-slate-300">{en.campus_name || "Main Campus"}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            {en.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedEnrollment(en);
                              setTransferForm({ to_section: "", roll_number: en.roll_number, reason: "" });
                              setShowTransferModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Transfer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Term */}
        {showAddTermModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Create New Assessment Term</h3>
              <form onSubmit={handleCreateTerm} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Term Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Term, Mid-Term Exam"
                    value={newTerm.name}
                    onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Term Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. T1, MID"
                      value={newTerm.term_code}
                      onChange={(e) => setNewTerm({ ...newTerm, term_code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Weight Percentage (%)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="25.00"
                      value={newTerm.weight_percentage}
                      onChange={(e) => setNewTerm({ ...newTerm, weight_percentage: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newTerm.start_date}
                      onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={newTerm.end_date}
                      onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={newTerm.is_current}
                    onChange={(e) => setNewTerm({ ...newTerm, is_current: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="is_current" className="text-slate-300">Set as currently active term</label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddTermModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Save Term</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Transfer Student */}
        {showTransferModal && selectedEnrollment && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                  Intra-Session Student Transfer
                </h3>
                <p className="text-xs text-slate-400">
                  Reassigning <strong>{selectedEnrollment.student_name || selectedEnrollment.student_username}</strong> to a different class section or campus.
                </p>
              </div>

              <form onSubmit={handleTransferStudent} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Target Section</label>
                  <select
                    required
                    value={transferForm.to_section}
                    onChange={(e) => setTransferForm({ ...transferForm, to_section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Destination Section --</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grade_name || "Grade"} - {s.name} ({s.campus_name || "Main Campus"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">New Section Roll Number</label>
                  <input
                    type="text"
                    required
                    value={transferForm.roll_number}
                    onChange={(e) => setTransferForm({ ...transferForm, roll_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Audited Transfer Reason</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Relocated to city branch, stream change to Pre-Medical..."
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Confirm Transfer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
