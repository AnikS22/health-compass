import { useNavigate } from "react-router-dom";
import { Radio, Play, Square, Users, Clock, Eye, Plus, Copy, Check, History, Trash2, Pencil } from "lucide-react";
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
  custom_name: string | null;
};

type ClassRow = { id: string; name: string; organization_id: string };
type LessonRow = { id: string; title: string; unit_id: string | null };
type VersionRow = { id: string; version_label: string; lesson_id: string; publish_status: string };
type UnitRow = { id: string; title: string; course_id: string };
type CourseRow = { id: string; title: string };

export default function LiveSessions() {
  const navigate = useNavigate();
  const { appUserId } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessonVersionId, setLessonVersionId] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!appUserId) return;
    const [sessRes, classRes, courseRes, unitRes, lessonRes, versionRes] = await Promise.all([
      supabase
        .from("live_sessions")
        .select("id, session_code, started_at, ended_at, class_id, lesson_version_id, custom_name")
        .eq("host_teacher_id", appUserId)
        .order("started_at", { ascending: false })
        .limit(50),
      supabase.from("classes").select("id, name, organization_id").eq("teacher_id", appUserId).order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("title"),
      supabase.from("units").select("id, title, course_id").order("sequence_no"),
      supabase.from("lessons").select("id, title, unit_id").order("title"),
      supabase
        .from("lesson_versions")
        .select("id, version_label, lesson_id, publish_status")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false }),
    ]);
    setSessions((sessRes.data as LiveSession[]) ?? []);
    const cls = (classRes.data as ClassRow[]) ?? [];
    const crs = (courseRes.data as CourseRow[]) ?? [];
    const uts = (unitRes.data as UnitRow[]) ?? [];
    const lss = (lessonRes.data as LessonRow[]) ?? [];
    const vrs = (versionRes.data as VersionRow[]) ?? [];
    setClasses(cls);
    setCourses(crs);
    setUnits(uts);
    setLessons(lss);
    setVersions(vrs);
    if (cls.length > 0 && !classId) setClassId(cls[0].id);
    if (crs.length > 0 && !courseId) setCourseId(crs[0].id);
    setLoading(false);
  }

  // Derived: filter lessons by selected course
  const courseUnits = units.filter(u => u.course_id === courseId);
  const courseUnitIds = new Set(courseUnits.map(u => u.id));
  const courseLessons = lessons.filter(l => l.unit_id && courseUnitIds.has(l.unit_id));
  const selectedLessonVersions = versions.filter(v => v.lesson_id === lessonId);

  // Auto-select first lesson when course changes
  useEffect(() => {
    if (courseLessons.length > 0) {
      const first = courseLessons[0];
      setLessonId(first.id);
    } else {
      setLessonId("");
      setLessonVersionId("");
    }
  }, [courseId, lessons.length]);

  // Auto-select first version when lesson changes
  useEffect(() => {
    const lvs = versions.filter(v => v.lesson_id === lessonId);
    if (lvs.length > 0) {
      setLessonVersionId(lvs[0].id);
    } else {
      setLessonVersionId("");
    }
  }, [lessonId, versions.length]);

  function generateCode() {
    return "ETH-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!classId || !lessonVersionId || !appUserId) {
      setErrorMsg("Please select a class and a published lesson version.");
      return;
    }
    setCreating(true);

    // Derive org from the selected class (works even if user has no org, e.g. ethics_admin)
    const selectedClass = classes.find((c) => c.id === classId);
    const orgId = selectedClass?.organization_id;
    if (!orgId) {
      setErrorMsg("Selected class has no organization. Cannot start session.");
      setCreating(false);
      return;
    }

    const code = generateCode();
    const { data: newSession, error } = await supabase.from("live_sessions").insert({
      class_id: classId,
      lesson_version_id: lessonVersionId,
      host_teacher_id: appUserId,
      organization_id: orgId,
      session_code: code,
    }).select("id").single();

    if (error) {
      setErrorMsg(`Failed to start session: ${error.message}`);
      setCreating(false);
    } else if (newSession) {
      navigate(`/live/host?session=${newSession.id}`);
    }
  }

  async function endSession(sessionId: string) {
    await supabase
      .from("live_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("host_teacher_id", appUserId!);
    await loadData();
  }

  async function renameSession(sessionId: string, name: string) {
    await supabase
      .from("live_sessions")
      .update({ custom_name: name || null })
      .eq("id", sessionId)
      .eq("host_teacher_id", appUserId!);
    setRenamingSession(null);
    setRenameValue("");
    await loadData();
  }

  async function deleteSession(sessionId: string) {
    // Delete related data first, then the session
    await Promise.all([
      supabase.from("live_responses").delete().eq("live_session_id", sessionId),
      supabase.from("live_session_events").delete().eq("live_session_id", sessionId),
      supabase.from("live_session_participants").delete().eq("live_session_id", sessionId),
    ]);
    await supabase.from("live_sessions").delete().eq("id", sessionId).eq("host_teacher_id", appUserId!);
    setDeletingSession(null);
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
          {errorMsg && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive font-medium">
              {errorMsg}
            </div>
          )}
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
              <label className="block text-sm font-semibold text-foreground mb-1.5">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Lesson</label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              >
                <option value="">Select a lesson</option>
                {courseLessons.map((l) => {
                  const unit = courseUnits.find(u => u.id === l.unit_id);
                  return (
                    <option key={l.id} value={l.id}>
                      {unit ? `${unit.title} → ` : ""}{l.title}
                    </option>
                  );
                })}
              </select>
              {courseLessons.length === 0 && courseId && (
                <p className="text-xs text-muted-foreground mt-1">No lessons found in this course.</p>
              )}
            </div>
            {selectedLessonVersions.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Version</label>
                <select
                  value={lessonVersionId}
                  onChange={(e) => setLessonVersionId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                >
                  {selectedLessonVersions.map((v) => (
                    <option key={v.id} value={v.id}>{v.version_label}</option>
                  ))}
                </select>
              </div>
            )}
            {lessonId && selectedLessonVersions.length === 0 && (
              <p className="text-xs text-destructive">No published versions for this lesson. Publish a version first.</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !lessonVersionId}
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

      {/* Active Sessions */}
      {(() => {
        const activeSessions = sessions.filter(s => !s.ended_at);
        const pastSessions = sessions.filter(s => s.ended_at);
        return (
          <>
            {activeSessions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-success animate-pulse" /> Active Sessions
                </h2>
                {activeSessions.map((s) => (
                  <div key={s.id} className="bg-card rounded-2xl border border-success/30 p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-success/10">
                          <Radio className="w-5 h-5 text-success animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {(() => { const ver = versions.find(v => v.id === s.lesson_version_id); const lesson = ver ? lessons.find(l => l.id === ver.lesson_id) : null; return lesson?.title ?? "Untitled Lesson"; })()}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono font-bold text-lg text-foreground bg-secondary px-3 py-1 rounded-lg">{s.session_code}</span>
                            <button onClick={() => copyCode(s.session_code)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Copy code">
                              {copiedCode === s.session_code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(s.started_at).toLocaleString()}</span>
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-success/10 text-success">active</span>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/live/host?session=${s.id}`)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                            <Play className="w-4 h-4 inline mr-1" />Host
                          </button>
                          <button onClick={() => endSession(s.id)} className="px-4 py-2 border border-destructive/30 text-destructive rounded-xl text-sm font-semibold hover:bg-destructive/5 transition-colors">End</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past Sessions */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4" /> Past Sessions ({pastSessions.length})
              </h2>
              {pastSessions.length === 0 && activeSessions.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-semibold">No sessions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start your first live session to engage students in real time.</p>
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">No past sessions yet. Ended sessions will appear here with collected response data.</p>
                </div>
              ) : (
                pastSessions.map((s) => (
                  <div key={s.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary">
                          <Square className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {(() => { const ver = versions.find(v => v.id === s.lesson_version_id); const lesson = ver ? lessons.find(l => l.id === ver.lesson_id) : null; return lesson?.title ?? "Untitled Lesson"; })()}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono font-bold text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded">{s.session_code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(s.started_at).toLocaleString()}</span>
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-secondary text-muted-foreground">ended</span>
                        <button
                          onClick={() => navigate(`/live/review?session=${s.id}`)}
                          className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          Review Data
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
