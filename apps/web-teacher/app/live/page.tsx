"use client";

import { FormEvent, useEffect, useState } from "react";
import { isTeacherFromSessionRole, teacherSupabase } from "../../lib/supabase";
import { apiPost, fetchAuthMe } from "../../lib/api";

type SessionRow = {
  id: string;
  session_code: string;
  started_at: string;
};

type ClassRow = {
  id: string;
  name: string;
};

type LessonVersionRow = {
  id: string;
  version_label: string;
};

export default function TeacherLivePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [lessonVersions, setLessonVersions] = useState<LessonVersionRow[]>([]);
  const [classId, setClassId] = useState("");
  const [lessonVersionId, setLessonVersionId] = useState("");
  const [status, setStatus] = useState("Loading sessions...");
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
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
      setStatus("Teacher access required.");
      return;
    }

    const [sessionsResult, classesResult, lessonsResult] = await Promise.all([
      teacherSupabase
        .from("live_sessions")
        .select("id, session_code, started_at")
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(20),
      teacherSupabase.from("classes").select("id, name").order("created_at", { ascending: false }).limit(100),
      teacherSupabase
        .from("lesson_versions")
        .select("id, version_label")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

    if (sessionsResult.error) {
      setStatus(`Failed to load sessions: ${sessionsResult.error.message}`);
      return;
    }
    if (classesResult.error) {
      setStatus(`Failed to load classes: ${classesResult.error.message}`);
      return;
    }
    if (lessonsResult.error) {
      setStatus(`Failed to load lessons: ${lessonsResult.error.message}`);
      return;
    }

    const loadedClasses = (classesResult.data as ClassRow[]) ?? [];
    const loadedLessons = (lessonsResult.data as LessonVersionRow[]) ?? [];

    setSessions((sessionsResult.data as SessionRow[]) ?? []);
    setClasses(loadedClasses);
    setLessonVersions(loadedLessons);
    if (!classId && loadedClasses.length > 0) setClassId(loadedClasses[0].id);
    if (!lessonVersionId && loadedLessons.length > 0) setLessonVersionId(loadedLessons[0].id);
    setStatus(sessionsResult.data && sessionsResult.data.length > 0 ? "" : "No active sessions.");
  }

  async function sendEvent(sessionId: string, eventType: string) {
    const result = await apiPost("/api/live/sessions/event", {
      liveSessionId: sessionId,
      eventType,
      eventPayload: {}
    });
    setStatus(result.ok ? `Sent ${eventType} to session.` : `Event failed: ${result.error}`);
  }

  async function startLiveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classId || !lessonVersionId) {
      setStatus("Pick a class and lesson version before starting.");
      return;
    }
    setStartingSession(true);
    setStatus("Starting session...");
    const result = await apiPost<{ id: string; session_code: string }>("/api/live/sessions/start", {
      classId,
      lessonVersionId
    });
    if (!result.ok) {
      setStatus(`Could not start session: ${result.error}`);
      setStartingSession(false);
      return;
    }
    setStatus(`Live session started. Code: ${result.data.session_code}`);
    await load();
    setStartingSession(false);
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">Live Session Controls</h1>
        <p className="subtitle">Start lessons and control pacing in real time.</p>
      </section>

      {status ? <p className="status info">{status}</p> : null}

      <section className="formCard" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Start New Live Session</h2>
        <form onSubmit={startLiveSession}>
          <label className="fieldLabel" htmlFor="class-select">
            Class
          </label>
          <select id="class-select" className="input" value={classId} onChange={(event) => setClassId(event.target.value)} required>
            <option value="">Select class</option>
            {classes.map((classRow) => (
              <option key={classRow.id} value={classRow.id}>
                {classRow.name}
              </option>
            ))}
          </select>

          <label className="fieldLabel" htmlFor="lesson-select">
            Lesson Version
          </label>
          <select
            id="lesson-select"
            className="input"
            value={lessonVersionId}
            onChange={(event) => setLessonVersionId(event.target.value)}
            required
          >
            <option value="">Select lesson version</option>
            {lessonVersions.map((lessonRow) => (
              <option key={lessonRow.id} value={lessonRow.id}>
                {lessonRow.version_label} ({lessonRow.id.slice(0, 8)})
              </option>
            ))}
          </select>

          <button className="primaryButton" disabled={startingSession} type="submit">
            {startingSession ? "Starting..." : "Start Session"}
          </button>
        </form>
      </section>

      <section className="grid">
        {sessions.map((session) => (
          <article className="card" key={session.id}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Code: {session.session_code}</h3>
            <p className="subtitle">Started: {new Date(session.started_at).toLocaleString()}</p>
            <div className="buttonRow" style={{ marginTop: 10 }}>
              <button className="button" onClick={() => sendEvent(session.id, "next_block")}>
                Next
              </button>
              <button className="button" onClick={() => sendEvent(session.id, "lock")}>
                Lock
              </button>
              <button className="button" onClick={() => sendEvent(session.id, "unlock")}>
                Unlock
              </button>
              <button className="button" onClick={() => sendEvent(session.id, "reveal_results")}>
                Show Results
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
