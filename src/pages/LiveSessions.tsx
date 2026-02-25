import { useNavigate } from "react-router-dom";
import { Radio, Play, Square, Users, Clock, Eye, Plus, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type LiveSession = {
  id: string;
  session_code: string;
  started_at: string;
  ended_at: string | null;
  class_id: string;
  lesson_version_id: string;
};

type ClassRow = { id: string; name: string };
type LessonVersionRow = { id: string; version_label: string; lesson_id: string };

export default function LiveSessions() {
  const navigate = useNavigate();
  const { appUserId } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [lessonVersions, setLessonVersions] = useState<LessonVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [classId, setClassId] = useState("");
  const [lessonVersionId, setLessonVersionId] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [sessRes, classRes, lvRes] = await Promise.all([
      supabase
        .from("live_sessions")
        .select("id, session_code, started_at, ended_at, class_id, lesson_version_id")
        .order("started_at", { ascending: false })
        .limit(20),
      supabase.from("classes").select("id, name").order("created_at", { ascending: false }),
      supabase
        .from("lesson_versions")
        .select("id, version_label, lesson_id")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false }),
    ]);
    setSessions((sessRes.data as LiveSession[]) ?? []);
    const cls = (classRes.data as ClassRow[]) ?? [];
    const lvs = (lvRes.data as LessonVersionRow[]) ?? [];
    setClasses(cls);
    setLessonVersions(lvs);
    if (cls.length > 0 && !classId) setClassId(cls[0].id);
    if (lvs.length > 0 && !lessonVersionId) setLessonVersionId(lvs[0].id);
    setLoading(false);
  }

  function generateCode() {
    return "ETH-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !lessonVersionId || !appUserId) return;
    setCreating(true);

    const { data: orgData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", appUserId)
      .single();

    const code = generateCode();
    const { error } = await supabase.from("live_sessions").insert({
      class_id: classId,
      lesson_version_id: lessonVersionId,
      host_teacher_id: appUserId,
      organization_id: orgData?.organization_id ?? "",
      session_code: code,
    });

    if (error) {
      console.error("Failed to start session:", error.message);
    } else {
      setShowCreate(false);
      await loadData();
    }
    setCreating(false);
  }

  async function endSession(sessionId: string) {
    await supabase
      .from("live_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    await loadData();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getStatus(s: LiveSession) {
    if (s.ended_at) return "ended";
    return "active";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Loading sessions…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Live Sessions</h1>
          <p className="text-muted-foreground mt-1 text-sm">Start and manage real-time classroom sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/lesson/preview")}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="bg-card rounded-2xl border border-primary/30 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-foreground mb-4">Start a New Live Session</h2>
          <form onSubmit={startSession} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Lesson</label>
              <select
                value={lessonVersionId}
                onChange={(e) => setLessonVersionId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              >
                <option value="">Select a lesson</option>
                {lessonVersions.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.version_label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Starting…" : "Start Session"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">No sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start your first live session to engage students in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const status = getStatus(s);
            return (
              <div
                key={s.id}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        status === "active" ? "bg-success/10" : "bg-secondary"
                      }`}
                    >
                      {status === "active" ? (
                        <Radio className="w-5 h-5 text-success animate-pulse" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        Session Code:
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-lg text-foreground bg-secondary px-3 py-1 rounded-lg">
                          {s.session_code}
                        </span>
                        <button
                          onClick={() => copyCode(s.session_code)}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === s.session_code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(s.started_at).toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {status}
                    </span>
                    {status === "active" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/live/host?session=${s.id}`)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          <Play className="w-4 h-4 inline mr-1" />
                          Host
                        </button>
                        <button
                          onClick={() => endSession(s.id)}
                          className="px-4 py-2 border border-destructive/30 text-destructive rounded-xl text-sm font-semibold hover:bg-destructive/5 transition-colors"
                        >
                          End
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
