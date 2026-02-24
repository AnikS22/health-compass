"use client";

import { useEffect, useState } from "react";
import { isTeacherFromSessionRole, teacherSupabase } from "../../lib/supabase";
import { fetchAuthMe } from "../../lib/api";

type ReportRow = {
  student_email: string;
  score: number | null;
  submitted_at: string;
};

export default function TeacherReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [status, setStatus] = useState("Loading report...");

  useEffect(() => {
    let mounted = true;
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

      const responses = await teacherSupabase
        .from("attempt_responses")
        .select("user_id, score, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(50);
      if (!mounted) return;

      if (responses.error) {
        setStatus(`Could not load report rows: ${responses.error.message}`);
        return;
      }
      const uniqueUserIds = Array.from(new Set((responses.data ?? []).map((row) => row.user_id)));
      const users = uniqueUserIds.length
        ? await teacherSupabase.from("users").select("id, email").in("id", uniqueUserIds)
        : { data: [] as Array<{ id: string; email: string }> };
      const emailById = new Map((users.data ?? []).map((user) => [user.id, user.email]));

      const normalized: ReportRow[] = (responses.data ?? []).map((row) => ({
        student_email: emailById.get(row.user_id) ?? row.user_id,
        score: row.score,
        submitted_at: row.submitted_at
      }));
      setRows(normalized);
      setStatus(normalized.length > 0 ? "" : "No rows yet.");
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <h1 className="title">Teacher Reports</h1>
        <p className="subtitle">Review recent student responses and quick score snapshots.</p>
      </section>
      {status ? <p className="status info">{status}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Score</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.student_email}-${row.submitted_at}`}>
              <td>{row.student_email}</td>
              <td>{row.score ?? "-"}</td>
              <td>{new Date(row.submitted_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
