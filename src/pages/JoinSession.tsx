import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, ArrowRight, Podcast, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveSession {
  id: string;
  session_code: string;
  started_at: string;
  class_name: string;
  teacher_name: string;
  lesson_title: string;
}

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolSessions, setSchoolSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();
  const { user, appUserId } = useAuth();

  // Fetch active sessions for the student's school
  useEffect(() => {
    if (!appUserId) {
      setLoadingSessions(false);
      return;
    }

    async function fetchSchoolSessions() {
      // Get student's org
      const { data: userData } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", appUserId)
        .maybeSingle();

      if (!userData?.organization_id) {
        setLoadingSessions(false);
        return;
      }

      // Get active sessions for their org
      const { data: sessions } = await supabase
        .from("live_sessions")
        .select(`
          id,
          session_code,
          started_at,
          class_id,
          host_teacher_id,
          lesson_version_id
        `)
        .eq("organization_id", userData.organization_id)
        .is("ended_at", null)
        .order("started_at", { ascending: false });

      if (!sessions || sessions.length === 0) {
        setSchoolSessions([]);
        setLoadingSessions(false);
        return;
      }

      // Enrich with class names, teacher names, lesson titles
      const classIds = [...new Set(sessions.map(s => s.class_id))];
      const teacherIds = [...new Set(sessions.map(s => s.host_teacher_id))];
      const lvIds = [...new Set(sessions.map(s => s.lesson_version_id))];

      const [classRes, teacherRes, lvRes] = await Promise.all([
        supabase.from("classes").select("id, name").in("id", classIds),
        supabase.from("users").select("id, display_name").in("id", teacherIds),
        supabase.from("lesson_versions").select("id, lesson_id").in("id", lvIds),
      ]);

      const classMap = Object.fromEntries((classRes.data ?? []).map(c => [c.id, c.name]));
      const teacherMap = Object.fromEntries((teacherRes.data ?? []).map(t => [t.id, t.display_name]));

      // Get lesson titles
      const lessonIds = [...new Set((lvRes.data ?? []).map(lv => lv.lesson_id))];
      const { data: lessonsData } = lessonIds.length > 0
        ? await supabase.from("lessons").select("id, title").in("id", lessonIds)
        : { data: [] };
      const lessonMap = Object.fromEntries((lessonsData ?? []).map(l => [l.id, l.title]));
      const lvToLesson = Object.fromEntries((lvRes.data ?? []).map(lv => [lv.id, lv.lesson_id]));

      const enriched: ActiveSession[] = sessions.map(s => ({
        id: s.id,
        session_code: s.session_code,
        started_at: s.started_at,
        class_name: classMap[s.class_id] || "Class",
        teacher_name: teacherMap[s.host_teacher_id] || "Teacher",
        lesson_title: lessonMap[lvToLesson[s.lesson_version_id]] || "Lesson",
      }));

      setSchoolSessions(enriched);
      setLoadingSessions(false);
    }

    fetchSchoolSessions();
  }, [appUserId]);

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await joinSession(code.trim().toUpperCase());
  }

  async function joinSession(sessionCode: string) {
    setLoading(true);
    setStatus("");

    const displayName = user?.user_metadata?.full_name || user?.email || "Student";

    const { data, error } = await supabase.rpc("join_live_session_by_code", {
      p_code: sessionCode,
      p_display_name: displayName,
    });

    if (error) {
      setStatus("Failed to join: " + error.message);
      setLoading(false);
      return;
    }

    const result = data as unknown as { ok: boolean; error?: string; session_id?: string };

    if (!result.ok) {
      setStatus(result.error || "Session not found.");
      setLoading(false);
      return;
    }

    navigate(`/live/student?session=${result.session_id}`);
    setLoading(false);
  }

  function timeAgo(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return "Just started";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Join Live Session</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Join an active session from your school or enter a session code.
        </p>
      </div>

      {/* Active School Sessions */}
      {appUserId && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Sessions at Your School
          </h2>
          {loadingSessions ? (
            <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading sessions…</span>
            </div>
          ) : schoolSessions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No active sessions right now. Use a code below to join.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schoolSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => joinSession(s.session_code)}
                  disabled={loading}
                  className="w-full text-left bg-card hover:bg-accent/50 rounded-2xl border border-border p-4 transition-colors disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{s.lesson_title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {s.class_name} · {s.teacher_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">{timeAgo(s.started_at)}</span>
                      </div>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-lg">
                        {s.session_code}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Code Entry */}
      <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Podcast className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Or Enter a Session Code
        </h2>

        <form onSubmit={handleJoinByCode} className="space-y-4">
          <div className="relative">
            <Radio className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ETH-XXXX"
              maxLength={10}
              className="w-full pl-12 pr-4 py-4 bg-card border border-input rounded-2xl text-lg text-center font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? "Joining…" : "Join Session"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {status && (
          <p className={`text-sm font-medium text-center ${status.includes("not found") || status.includes("Failed") || status.includes("error") ? "text-destructive" : "text-success"}`}>
            {status}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Ask your teacher for the session code
        </p>
      </div>
    </div>
  );
}
