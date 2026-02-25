import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, BookOpen, Radio, ClipboardList, Plus, Play, Copy, Check, Key, Clock, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ClassInfo = { id: string; name: string; grade_band: string; teacher_id: string; organization_id: string };
type EnrollmentRow = { user_id: string; status: string; email?: string; display_name?: string };
type AssignmentRow = { id: string; lesson_version_id: string; due_at: string | null; created_at: string; version_label?: string };
type SessionRow = { id: string; session_code: string; started_at: string; ended_at: string | null; lesson_version_id: string };
type LessonVersionRow = { id: string; version_label: string; lesson_id: string; publish_status: string };
type JoinCodeRow = { id: string; join_code: string; is_active: boolean };

type Tab = "roster" | "curriculum" | "assignments" | "live";

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { appUserId, role } = useAuth();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [tab, setTab] = useState<Tab>(role === "student" ? "curriculum" : "roster");
  const [loading, setLoading] = useState(true);

  // Roster
  const [roster, setRoster] = useState<EnrollmentRow[]>([]);

  // Curriculum - published lesson versions
  const [lessonVersions, setLessonVersions] = useState<LessonVersionRow[]>([]);

  // Assignments
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  // Live sessions
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  // Join code
  const [joinCode, setJoinCode] = useState<JoinCodeRow | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Create assignment
  const [showAssign, setShowAssign] = useState(false);
  const [assignLvId, setAssignLvId] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Create live session
  const [showStartLive, setShowStartLive] = useState(false);
  const [liveLvId, setLiveLvId] = useState("");
  const [startingLive, setStartingLive] = useState(false);

  useEffect(() => {
    if (!classId) return;
    loadAll();
  }, [classId]);

  async function loadAll() {
    setLoading(true);
    const { data: cls } = await supabase
      .from("classes")
      .select("id, name, grade_band, teacher_id, organization_id")
      .eq("id", classId!)
      .single();

    if (!cls) { setLoading(false); return; }
    setClassInfo(cls as ClassInfo);

    await Promise.all([loadRoster(), loadCurriculum(), loadAssignments(), loadSessions(), loadJoinCode()]);
    setLoading(false);
  }

  async function loadRoster() {
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("user_id, status")
      .eq("class_id", classId!)
      .eq("status", "active");

    if (!enrollments || enrollments.length === 0) { setRoster([]); return; }

    const userIds = enrollments.map((e) => e.user_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, email, display_name")
      .in("id", userIds);

    const userMap: Record<string, { email: string; display_name: string }> = {};
    (users ?? []).forEach((u) => { userMap[u.id] = u; });

    setRoster(
      enrollments.map((e) => ({
        ...e,
        email: userMap[e.user_id]?.email,
        display_name: userMap[e.user_id]?.display_name,
      }))
    );
  }

  async function loadCurriculum() {
    const { data } = await supabase
      .from("lesson_versions")
      .select("id, version_label, lesson_id, publish_status")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false });
    setLessonVersions((data ?? []) as LessonVersionRow[]);
  }

  async function loadAssignments() {
    const { data } = await supabase
      .from("assignments")
      .select("id, lesson_version_id, due_at, created_at")
      .eq("class_id", classId!)
      .order("created_at", { ascending: false });

    const items = (data ?? []) as AssignmentRow[];

    if (items.length > 0) {
      const lvIds = [...new Set(items.map((a) => a.lesson_version_id))];
      const { data: lvs } = await supabase
        .from("lesson_versions")
        .select("id, version_label")
        .in("id", lvIds);
      const map: Record<string, string> = {};
      (lvs ?? []).forEach((v: { id: string; version_label: string }) => { map[v.id] = v.version_label; });
      items.forEach((a) => { a.version_label = map[a.lesson_version_id]; });
    }

    setAssignments(items);
  }

  async function loadSessions() {
    const { data } = await supabase
      .from("live_sessions")
      .select("id, session_code, started_at, ended_at, lesson_version_id")
      .eq("class_id", classId!)
      .order("started_at", { ascending: false })
      .limit(20);
    setSessions((data ?? []) as SessionRow[]);
  }

  async function loadJoinCode() {
    const { data } = await supabase
      .from("class_join_codes")
      .select("id, join_code, is_active")
      .eq("class_id", classId!)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    setJoinCode(data as JoinCodeRow | null);
  }

  async function generateNewJoinCode() {
    setGeneratingCode(true);
    if (joinCode) {
      await supabase.from("class_join_codes").update({ is_active: false }).eq("id", joinCode.id);
    }
    const code = "CLS-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabase.from("class_join_codes").insert({ class_id: classId!, join_code: code, is_active: true });
    await loadJoinCode();
    setGeneratingCode(false);
  }

  function copyJoinCode() {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!appUserId || !assignLvId) return;
    setAssigning(true);
    const { data: userData } = await supabase.from("users").select("organization_id").eq("id", appUserId).single();
    await supabase.from("assignments").insert({
      class_id: classId!,
      lesson_version_id: assignLvId,
      assigned_by_user_id: appUserId,
      organization_id: userData?.organization_id ?? "",
      due_at: assignDue || null,
    });
    setShowAssign(false);
    setAssignLvId("");
    setAssignDue("");
    setAssigning(false);
    loadAssignments();
  }

  async function handleStartLive(e: React.FormEvent) {
    e.preventDefault();
    if (!appUserId || !liveLvId) return;
    setStartingLive(true);
    const { data: userData } = await supabase.from("users").select("organization_id").eq("id", appUserId).single();
    const code = "ETH-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { data: session, error } = await supabase.from("live_sessions").insert({
      class_id: classId!,
      lesson_version_id: liveLvId,
      host_teacher_id: appUserId,
      organization_id: userData?.organization_id ?? "",
      session_code: code,
    }).select("id").single();

    setStartingLive(false);
    if (!error && session) {
      navigate(`/live/host?session=${session.id}`);
    }
  }

  const isTeacher = role === "teacher" || role === "school_admin";
  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    ...(isTeacher ? [{ key: "roster" as Tab, label: "Roster", icon: Users }] : []),
    { key: "curriculum", label: "Curriculum", icon: BookOpen },
    { key: "assignments", label: "Assignments", icon: ClipboardList },
    { key: "live", label: "Live Sessions", icon: Radio },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading class…</div></div>;
  }

  if (!classInfo) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <p className="text-foreground font-semibold">Class not found</p>
        <button onClick={() => navigate("/classes")} className="text-primary text-sm font-bold hover:underline">Back to Classes</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/classes")} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{classInfo.name}</h1>
          <p className="text-muted-foreground text-sm">Grade {classInfo.grade_band} · {roster.length} student{roster.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Join code for teachers */}
        {isTeacher && (
          <div className="flex items-center gap-2">
            {joinCode ? (
              <>
                <Key className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-sm bg-secondary px-3 py-1.5 rounded-lg">{joinCode.join_code}</span>
                <button onClick={copyJoinCode} className="p-1.5 rounded hover:bg-secondary transition-colors">
                  {copiedCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={generateNewJoinCode} disabled={generatingCode} className="text-xs text-primary hover:underline">Regenerate</button>
              </>
            ) : (
              <button onClick={generateNewJoinCode} disabled={generatingCode} className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary/30 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50">
                <Key className="w-3.5 h-3.5" />
                {generatingCode ? "Generating…" : "Generate Join Code"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "roster" && isTeacher && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Student Roster</h3>
          </div>
          {roster.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No students enrolled yet. Share the join code to invite students.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.user_id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{r.display_name || "—"}</td>
                    <td className="p-4 text-muted-foreground">{r.email || "—"}</td>
                    <td className="p-4">
                      <span className="text-xs bg-success/10 text-success px-3 py-1 rounded-full font-bold">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "curriculum" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Published lessons available for this class.</p>
          {lessonVersions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
              No published lessons available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lessonVersions.map((lv) => (
                <div key={lv.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{lv.version_label}</p>
                      <p className="text-xs text-muted-foreground">Published</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "assignments" && (
        <div className="space-y-4">
          {isTeacher && (
            <div className="flex justify-end">
              <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
                <Plus className="w-4 h-4" /> Assign Lesson
              </button>
            </div>
          )}

          {showAssign && (
            <form onSubmit={handleAssign} className="bg-card rounded-2xl border border-primary/30 p-6 shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-foreground">Assign a Lesson</h3>
              <select value={assignLvId} onChange={(e) => setAssignLvId(e.target.value)} required className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary">
                <option value="">Select a lesson</option>
                {lessonVersions.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.version_label}</option>
                ))}
              </select>
              <input type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary" placeholder="Due date (optional)" />
              <div className="flex gap-2">
                <button type="submit" disabled={assigning} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">{assigning ? "Assigning…" : "Assign"}</button>
                <button type="button" onClick={() => setShowAssign(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
              </div>
            </form>
          )}

          {assignments.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
              No assignments for this class yet.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{a.version_label || "Lesson"}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {a.due_at ? new Date(a.due_at).toLocaleDateString() : "No due date"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "live" && (
        <div className="space-y-4">
          {isTeacher && (
            <div className="flex justify-end">
              <button onClick={() => setShowStartLive(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
                <Plus className="w-4 h-4" /> Start Live Session
              </button>
            </div>
          )}

          {showStartLive && (
            <form onSubmit={handleStartLive} className="bg-card rounded-2xl border border-primary/30 p-6 shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-foreground">Start Live Session for {classInfo.name}</h3>
              <select value={liveLvId} onChange={(e) => setLiveLvId(e.target.value)} required className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary">
                <option value="">Select a lesson</option>
                {lessonVersions.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.version_label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={startingLive} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">{startingLive ? "Starting…" : "Start Session"}</button>
                <button type="button" onClick={() => setShowStartLive(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
              </div>
            </form>
          )}

          {sessions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
              No live sessions for this class yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const isActive = !s.ended_at;
                return (
                  <div key={s.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-success/10" : "bg-secondary"}`}>
                          <Radio className={`w-5 h-5 ${isActive ? "text-success animate-pulse" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-foreground">{s.session_code}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(s.started_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${isActive ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                          {isActive ? "Active" : "Ended"}
                        </span>
                        {isActive && isTeacher && (
                          <button
                            onClick={() => navigate(`/live/host?session=${s.id}`)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90"
                          >
                            <Play className="w-4 h-4 inline mr-1" /> Host
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
