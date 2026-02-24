"use client";

import { FormEvent, useEffect, useState } from "react";
import { isTeacherFromSessionRole, teacherSupabase } from "../lib/supabase";
import { apiGet, apiPost, fetchAuthMe } from "../lib/api";

type ClassRow = {
  id: string;
  name: string;
  grade_band: string;
};

type LessonVersionRow = {
  id: string;
  version_label: string;
};

type RosterRow = {
  user_id: string;
  email: string;
  status: "active" | "invited" | "removed";
  accommodations: Record<string, unknown> | null;
};

type TeacherOverviewRow = {
  class_id: string;
  class_name: string;
  roster_count: string;
};

export default function TeacherHomePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [lessonVersions, setLessonVersions] = useState<LessonVersionRow[]>([]);
  const [status, setStatus] = useState("Loading classes...");
  const [roleHint, setRoleHint] = useState<string>("");
  const [className, setClassName] = useState("");
  const [gradeBand, setGradeBand] = useState("");
  const [savingClass, setSavingClass] = useState(false);
  const [assignmentClassId, setAssignmentClassId] = useState("");
  const [assignmentLessonVersionId, setAssignmentLessonVersionId] = useState("");
  const [assignmentDueAt, setAssignmentDueAt] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [rosterClassId, setRosterClassId] = useState("");
  const [rosterStatus, setRosterStatus] = useState("");
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    void loadClasses();
  }, []);

  useEffect(() => {
    if (!rosterClassId) return;
    void loadRoster(rosterClassId);
  }, [rosterClassId]);

  async function loadClasses() {
    if (!teacherSupabase) {
      setStatus("Missing Supabase env vars.");
      return;
    }
    const {
      data: { session }
    } = await teacherSupabase.auth.getSession();
    const me = await fetchAuthMe();
    const teacherViaApi = me.ok && me.data.roles.includes("teacher");
    const teacherViaSession = isTeacherFromSessionRole(session);
    if (!teacherViaApi && !teacherViaSession) {
      setStatus("Teacher access required. Sign in with a teacher account.");
      return;
    }
    if (teacherViaApi) {
      setRoleHint(`Role: ${me.data.primaryRole} | School: ${me.data.organizationId ?? "unassigned"}`);
    } else {
      setRoleHint("Role: teacher (session metadata fallback)");
    }

    const { data, error } = await teacherSupabase
      .from("classes")
      .select("id, name, grade_band")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      setStatus(`Could not load classes: ${error.message}`);
      return;
    }
    const classRows = (data as ClassRow[]) ?? [];
    setClasses(classRows);
    if (!assignmentClassId && classRows.length > 0) setAssignmentClassId(classRows[0].id);
    if (!rosterClassId && classRows.length > 0) setRosterClassId(classRows[0].id);

    const lessons = await teacherSupabase
      .from("lesson_versions")
      .select("id, version_label")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    if (lessons.error) {
      setStatus(`Could not load lessons: ${lessons.error.message}`);
      return;
    }
    const lessonRows = (lessons.data as LessonVersionRow[]) ?? [];
    setLessonVersions(lessonRows);
    if (!assignmentLessonVersionId && lessonRows.length > 0) setAssignmentLessonVersionId(lessonRows[0].id);

    const overview = await apiGet<TeacherOverviewRow[]>("/api/reports/teacher/overview");
    if (overview.ok) {
      const total = overview.data.reduce((sum, row) => sum + Number(row.roster_count ?? 0), 0);
      setTotalStudents(total);
    }
    setStatus(classRows.length > 0 ? "" : "No classes found.");
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!className.trim() || !gradeBand.trim()) {
      setStatus("Add both class name and grade band.");
      return;
    }
    setSavingClass(true);
    setStatus("Creating class...");
    const result = await apiPost<{ id: string; name: string; grade_band: string }>("/api/classes", {
      name: className.trim(),
      gradeBand: gradeBand.trim()
    });
    if (!result.ok) {
      setStatus(`Could not create class: ${result.error}`);
      setSavingClass(false);
      return;
    }
    setClassName("");
    setGradeBand("");
    setStatus("Class created.");
    await loadClasses();
    setSavingClass(false);
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentClassId || !assignmentLessonVersionId) {
      setStatus("Pick both a class and lesson version.");
      return;
    }
    setSavingAssignment(true);
    setStatus("Creating assignment...");
    const result = await apiPost("/api/assignments", {
      classId: assignmentClassId,
      lessonVersionId: assignmentLessonVersionId,
      dueAt: assignmentDueAt ? new Date(assignmentDueAt).toISOString() : undefined
    });
    if (!result.ok) {
      setStatus(`Could not create assignment: ${result.error}`);
      setSavingAssignment(false);
      return;
    }
    setStatus("Assignment created.");
    setAssignmentDueAt("");
    setSavingAssignment(false);
  }

  async function loadRoster(classId: string) {
    setRosterStatus("Loading roster...");
    const roster = await apiGet<RosterRow[]>(`/api/classes/${classId}/roster`);
    if (!roster.ok) {
      setRosterStatus(`Could not load roster: ${roster.error}`);
      return;
    }
    setRosterRows(roster.data);
    setRosterStatus(roster.data.length ? "" : "No students in this class yet.");
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">Teacher Dashboard</h1>
        <p className="subtitle">Manage your classes, run live lessons, and track outcomes in one place.</p>
        {roleHint ? <p className="subtitle">{roleHint}</p> : null}
      </section>

      {status ? <p className="status info">{status}</p> : null}

      <section className="split">
        <article className="formCard">
          <h2 style={{ marginTop: 0 }}>Create Class</h2>
          <form onSubmit={createClass}>
            <label className="fieldLabel" htmlFor="class-name">
              Class Name
            </label>
            <input
              id="class-name"
              className="input"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Ethics Period 2"
              required
            />
            <label className="fieldLabel" htmlFor="grade-band">
              Grade Band
            </label>
            <input
              id="grade-band"
              className="input"
              value={gradeBand}
              onChange={(event) => setGradeBand(event.target.value)}
              placeholder="6-8"
              required
            />
            <button className="primaryButton" disabled={savingClass} type="submit">
              {savingClass ? "Creating..." : "Create Class"}
            </button>
          </form>
        </article>

        <article className="card">
          <h2 style={{ marginTop: 0 }}>Quick Stats</h2>
          <div className="grid">
            <section className="card">
              <h3 className="cardTitle">My Classes</h3>
              <p className="cardValue">{classes.length}</p>
            </section>
            <section className="card">
              <h3 className="cardTitle">Students Across Classes</h3>
              <p className="cardValue">{totalStudents}</p>
            </section>
          </div>
        </article>
      </section>

      <section className="split" style={{ marginTop: 14 }}>
        <article className="formCard">
          <h2 style={{ marginTop: 0 }}>Create Assignment</h2>
          <form onSubmit={createAssignment}>
            <label className="fieldLabel" htmlFor="assignment-class">
              Class
            </label>
            <select
              id="assignment-class"
              className="input"
              value={assignmentClassId}
              onChange={(event) => setAssignmentClassId(event.target.value)}
              required
            >
              <option value="">Select class</option>
              {classes.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.name}
                </option>
              ))}
            </select>

            <label className="fieldLabel" htmlFor="assignment-lesson">
              Published Lesson Version
            </label>
            <select
              id="assignment-lesson"
              className="input"
              value={assignmentLessonVersionId}
              onChange={(event) => setAssignmentLessonVersionId(event.target.value)}
              required
            >
              <option value="">Select lesson</option>
              {lessonVersions.map((lessonVersion) => (
                <option key={lessonVersion.id} value={lessonVersion.id}>
                  {lessonVersion.version_label} ({lessonVersion.id.slice(0, 8)})
                </option>
              ))}
            </select>

            <label className="fieldLabel" htmlFor="assignment-due-at">
              Due At (optional)
            </label>
            <input
              id="assignment-due-at"
              className="input"
              type="datetime-local"
              value={assignmentDueAt}
              onChange={(event) => setAssignmentDueAt(event.target.value)}
            />

            <button className="primaryButton" disabled={savingAssignment} type="submit">
              {savingAssignment ? "Creating..." : "Create Assignment"}
            </button>
          </form>
        </article>

        <article className="card">
          <h2 style={{ marginTop: 0 }}>Class Roster</h2>
          <label className="fieldLabel" htmlFor="roster-class">
            Select Class
          </label>
          <select id="roster-class" className="input" value={rosterClassId} onChange={(event) => setRosterClassId(event.target.value)}>
            <option value="">Select class</option>
            {classes.map((classRow) => (
              <option key={classRow.id} value={classRow.id}>
                {classRow.name}
              </option>
            ))}
          </select>
          {rosterStatus ? <p className="status info">{rosterStatus}</p> : null}
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Accommodations</th>
              </tr>
            </thead>
            <tbody>
              {rosterRows.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                  <td>{row.accommodations && Object.keys(row.accommodations).length > 0 ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <h2 style={{ marginTop: 22 }}>Classes</h2>
      <section className="grid">
        {classes.map((row) => (
          <article className="card" key={row.id}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{row.name}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>Grade band: {row.grade_band}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
