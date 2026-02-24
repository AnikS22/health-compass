"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSignedInAppUser, hasSupabaseEnv, supabase, type AppUser } from "../../lib/supabase";
import { fetchAuthMe } from "../../lib/api";

type StudentDashboardData = {
  user: AppUser | null;
  authRole: string | null;
  organizationId: string | null;
  totalAssignments: number;
  inProgressAttempts: number;
  completedAttempts: number;
  recentLiveSessions: number;
  certificates: number;
  upcomingAssignments: Array<{ id: string; due_at: string | null; lesson_version_id: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<StudentDashboardData>({
    user: null,
    authRole: null,
    organizationId: null,
    totalAssignments: 0,
    inProgressAttempts: 0,
    completedAttempts: 0,
    recentLiveSessions: 0,
    certificates: 0,
    upcomingAssignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!supabase) {
          setError("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
          return;
        }

        const { appUser, error: appUserError } = await getSignedInAppUser();
        if (!appUser) {
          setError(appUserError ?? "Please sign in.");
          return;
        }
        const authMe = await fetchAuthMe();

        const classEnrollments = await supabase
          .from("class_enrollments")
          .select("class_id")
          .eq("user_id", appUser.id)
          .eq("status", "active");

        const classIds = (classEnrollments.data ?? []).map((row) => row.class_id);

        const assignments =
          classIds.length > 0
            ? await supabase
                .from("assignments")
                .select("id, due_at, lesson_version_id")
                .in("class_id", classIds)
                .order("due_at", { ascending: true, nullsFirst: false })
                .limit(8)
            : { data: [] as Array<{ id: string; due_at: string | null; lesson_version_id: string }> };

        const attempts = await supabase
          .from("independent_attempts")
          .select("id, completed_at")
          .eq("user_id", appUser.id);

        const liveParticipation = await supabase
          .from("live_session_participants")
          .select("id")
          .eq("user_id", appUser.id);

        const certificates = await supabase
          .from("certificates")
          .select("id", { count: "exact", head: true })
          .eq("user_id", appUser.id);

        if (!mounted) return;

        const completedAttempts = (attempts.data ?? []).filter((row) => Boolean(row.completed_at)).length;
        setData({
          user: appUser,
          authRole: authMe.ok ? authMe.data.primaryRole : null,
          organizationId: authMe.ok ? authMe.data.organizationId : null,
          totalAssignments: assignments.data?.length ?? 0,
          inProgressAttempts: (attempts.data?.length ?? 0) - completedAttempts,
          completedAttempts,
          recentLiveSessions: liveParticipation.data?.length ?? 0,
          certificates: certificates.count ?? 0,
          upcomingAssignments: assignments.data ?? []
        });
      } catch (caught) {
        if (!mounted) return;
        setError(caught instanceof Error ? caught.message : "Failed to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <h1 className="title">Student Dashboard</h1>
        <p className="subtitle">
          {data.user ? `Welcome back, ${data.user.display_name}.` : "Sign in to view your classes and assignments."}
        </p>
        {data.authRole ? <p className="subtitle">Role: {data.authRole} | School: {data.organizationId ?? "unassigned"}</p> : null}
      </section>
      {!hasSupabaseEnv && (
        <p className="status warn">
          Supabase env keys are not set in this build yet. Add public env vars in Vercel to activate live data.
        </p>
      )}
      {error && <p className="status error">{error}</p>}
      {loading ? <p className="status info">Loading metrics...</p> : null}

      <div className="grid">
        <Card title="Assignments" value={data.totalAssignments} />
        <Card title="In Progress" value={data.inProgressAttempts} />
        <Card title="Completed" value={data.completedAttempts} />
        <Card title="Live Sessions Joined" value={data.recentLiveSessions} />
        <Card title="Certificates" value={data.certificates} />
      </div>

      <ul className="list">
        <li>Open assignments and continue independent checkpoints.</li>
        <li>Join teacher live sessions with a class code.</li>
        <li>Track completions and certificates over time.</li>
      </ul>
      <section style={{ marginTop: 14 }} className="card">
        <h3 style={{ marginTop: 0 }}>Upcoming Assignments</h3>
        {!data.upcomingAssignments.length ? (
          <p className="subtitle">No upcoming assignments yet.</p>
        ) : (
          <ul className="list" style={{ marginTop: 4 }}>
            {data.upcomingAssignments.map((assignment) => (
              <li key={assignment.id}>
                {assignment.lesson_version_id.slice(0, 8)} | Due{" "}
                {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No due date"}
              </li>
            ))}
          </ul>
        )}
      </section>
      {!data.user && (
        <p>
          <Link className="pillLink" href="/login">
            Go to login
          </Link>
        </p>
      )}
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <section className="card">
      <h3 className="cardTitle">{title}</h3>
      <p className="cardValue">{value}</p>
    </section>
  );
}
