"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignedInAppUser, supabase } from "../../lib/supabase";
import { apiPost } from "../../lib/api";

type AssignmentItem = {
  id: string;
  class_id: string;
  due_at: string | null;
  lesson_version_id: string;
};

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [status, setStatus] = useState("Loading assignments...");
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        setStatus("Add Supabase public env vars to load assignments.");
        return;
      }

      const { appUser, error: appUserError } = await getSignedInAppUser();
      if (!appUser) {
        setStatus(appUserError ?? "Please sign in to view assignments.");
        return;
      }

      const { data: enrollments, error: enrollmentError } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("user_id", appUser.id)
        .eq("status", "active");
      if (enrollmentError) {
        setStatus(`Failed to load enrollments: ${enrollmentError.message}`);
        return;
      }
      const classIds = (enrollments ?? []).map((row) => row.class_id);
      if (classIds.length === 0) {
        setAssignments([]);
        setStatus("No assignments found yet.");
        return;
      }

      const { data, error } = await supabase
        .from("assignments")
        .select("id, class_id, due_at, lesson_version_id")
        .in("class_id", classIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!mounted) return;

      if (error) {
        setStatus(`Failed to load assignments: ${error.message}`);
        return;
      }

      setAssignments((data as AssignmentItem[]) ?? []);
      setStatus(data && data.length > 0 ? "" : "No assignments found yet.");
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function startAssignment(assignmentId: string) {
    setStartingAssignmentId(assignmentId);
    setStatus("Starting assignment...");
    const result = await apiPost<{ id: string }>("/api/assignments/" + assignmentId + "/start", {});
    if (!result.ok) {
      setStatus(`Could not start assignment: ${result.error}`);
      setStartingAssignmentId(null);
      return;
    }
    router.push(`/independent/${result.data.id}`);
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">My Assignments</h1>
        <p className="subtitle">Track upcoming independent work and lesson deadlines.</p>
      </section>
      {status ? <p className="status info">{status}</p> : null}
      <section className="grid">
        {assignments.map((assignment) => (
          <article className="card" key={assignment.id}>
            <h3 className="cardTitle">Assignment {assignment.id.slice(0, 8)}</h3>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Lesson Version: {assignment.lesson_version_id.slice(0, 8)}
            </p>
            <p className="subtitle">Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No due date"}</p>
            <div className="buttonRow" style={{ marginTop: 8 }}>
              <button
                className="button"
                onClick={() => startAssignment(assignment.id)}
                disabled={startingAssignmentId === assignment.id}
              >
                {startingAssignmentId === assignment.id ? "Opening..." : "Start / Continue"}
              </button>
            </div>
          </article>
        ))}
      </section>
      {!assignments.length ? (
        <p className="subtitle">
          Need help getting enrolled? Go to <Link href="/dashboard">Dashboard</Link> and check your school/class assignment.
        </p>
      ) : null}
    </main>
  );
}
