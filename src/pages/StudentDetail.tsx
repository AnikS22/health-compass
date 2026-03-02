import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Radio, Clock, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ── Types ─────────────────────────────────────── */
type StudentInfo = { id: string; display_name: string; email: string };

type AttemptRow = {
  id: string;
  lesson_version_id: string | null;
  started_at: string;
  completed_at: string | null;
  progress_percent: number;
  version_label?: string;
};

type AttemptResponseRow = {
  id: string;
  lesson_block_id: string;
  response_payload: any;
  confidence: number | null;
  score: number | null;
  submitted_at: string;
  block_title?: string;
  block_type?: string;
};

type LiveResponseRow = {
  id: string;
  live_session_id: string;
  lesson_block_id: string;
  response_payload: any;
  confidence: number | null;
  submitted_at: string;
  session_code?: string;
  block_title?: string;
  block_type?: string;
};

/* ── Main Component ─────────────────────────────── */
export default function StudentDetail() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [liveResponses, setLiveResponses] = useState<LiveResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [attemptResponses, setAttemptResponses] = useState<Record<string, AttemptResponseRow[]>>({});
  const [loadingResponses, setLoadingResponses] = useState<string | null>(null);

  const isTeacher = role === "teacher" || role === "school_admin";

  useEffect(() => {
    if (!studentId || !classId) return;
    loadStudentData();
  }, [studentId, classId]);

  async function loadStudentData() {
    setLoading(true);

    // 1. Verify student is enrolled in this class
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("user_id")
      .eq("class_id", classId!)
      .eq("user_id", studentId!)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      setLoading(false);
      return;
    }

    // 2. Get student info
    const { data: user } = await supabase
      .from("users")
      .select("id, display_name, email")
      .eq("id", studentId!)
      .single();
    setStudent(user as StudentInfo | null);

    // 3. Get independent attempts (via assignments for this class)
    const { data: classAssignments } = await supabase
      .from("assignments")
      .select("id, lesson_version_id")
      .eq("class_id", classId!);

    const assignmentIds = (classAssignments ?? []).map((a) => a.id);
    const lvIds = [...new Set((classAssignments ?? []).map((a) => a.lesson_version_id))];

    let studentAttempts: AttemptRow[] = [];
    if (assignmentIds.length > 0) {
      const { data: attData } = await supabase
        .from("independent_attempts")
        .select("id, lesson_version_id, started_at, completed_at, progress_percent, assignment_id")
        .eq("user_id", studentId!)
        .in("assignment_id", assignmentIds)
        .order("started_at", { ascending: false });
      studentAttempts = (attData ?? []) as AttemptRow[];
    }

    // Also get attempts by lesson_version_id (self-paced)
    if (lvIds.length > 0) {
      const { data: attData2 } = await supabase
        .from("independent_attempts")
        .select("id, lesson_version_id, started_at, completed_at, progress_percent")
        .eq("user_id", studentId!)
        .in("lesson_version_id", lvIds)
        .is("assignment_id", null)
        .order("started_at", { ascending: false });
      const existing = new Set(studentAttempts.map((a) => a.id));
      (attData2 ?? []).forEach((a: any) => { if (!existing.has(a.id)) studentAttempts.push(a); });
    }

    // Resolve version labels
    if (studentAttempts.length > 0) {
      const allLvIds = [...new Set(studentAttempts.map((a) => a.lesson_version_id).filter(Boolean))];
      if (allLvIds.length > 0) {
        const { data: lvs } = await supabase
          .from("lesson_versions")
          .select("id, version_label")
          .in("id", allLvIds as string[]);
        const map: Record<string, string> = {};
        (lvs ?? []).forEach((v: any) => { map[v.id] = v.version_label; });
        studentAttempts.forEach((a) => { if (a.lesson_version_id) a.version_label = map[a.lesson_version_id]; });
      }
    }
    setAttempts(studentAttempts);

    // 4. Get live session responses for sessions in this class
    const { data: classSessions } = await supabase
      .from("live_sessions")
      .select("id, session_code")
      .eq("class_id", classId!);

    const sessionIds = (classSessions ?? []).map((s) => s.id);
    const sessionMap: Record<string, string> = {};
    (classSessions ?? []).forEach((s) => { sessionMap[s.id] = s.session_code; });

    let liveResp: LiveResponseRow[] = [];
    if (sessionIds.length > 0) {
      const { data: lrData } = await supabase
        .from("live_responses")
        .select("id, live_session_id, lesson_block_id, response_payload, confidence, submitted_at")
        .eq("user_id", studentId!)
        .in("live_session_id", sessionIds)
        .order("submitted_at", { ascending: false });
      liveResp = (lrData ?? []) as LiveResponseRow[];
      liveResp.forEach((r) => { r.session_code = sessionMap[r.live_session_id]; });

      // Resolve block info
      const blockIds = [...new Set(liveResp.map((r) => r.lesson_block_id))];
      if (blockIds.length > 0) {
        const { data: blocks } = await supabase
          .from("lesson_blocks")
          .select("id, title, block_type")
          .in("id", blockIds);
        const bMap: Record<string, { title: string | null; block_type: string }> = {};
        (blocks ?? []).forEach((b: any) => { bMap[b.id] = b; });
        liveResp.forEach((r) => {
          r.block_title = bMap[r.lesson_block_id]?.title ?? undefined;
          r.block_type = bMap[r.lesson_block_id]?.block_type ?? undefined;
        });
      }
    }
    setLiveResponses(liveResp);
    setLoading(false);
  }

  async function toggleAttempt(attemptId: string) {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
      return;
    }
    setExpandedAttempt(attemptId);

    if (attemptResponses[attemptId]) return;

    setLoadingResponses(attemptId);
    const { data } = await supabase
      .from("attempt_responses")
      .select("id, lesson_block_id, response_payload, confidence, score, submitted_at")
      .eq("independent_attempt_id", attemptId)
      .eq("user_id", studentId!)
      .order("submitted_at", { ascending: true });

    const resp = (data ?? []) as AttemptResponseRow[];

    // Resolve block info
    const blockIds = [...new Set(resp.map((r) => r.lesson_block_id))];
    if (blockIds.length > 0) {
      const { data: blocks } = await supabase
        .from("lesson_blocks")
        .select("id, title, block_type")
        .in("id", blockIds);
      const bMap: Record<string, { title: string | null; block_type: string }> = {};
      (blocks ?? []).forEach((b: any) => { bMap[b.id] = b; });
      resp.forEach((r) => {
        r.block_title = bMap[r.lesson_block_id]?.title ?? undefined;
        r.block_type = bMap[r.lesson_block_id]?.block_type ?? undefined;
      });
    }

    setAttemptResponses((prev) => ({ ...prev, [attemptId]: resp }));
    setLoadingResponses(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading student data…</div></div>;
  }

  if (!student) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <p className="text-foreground font-semibold">Student not found or not enrolled in this class</p>
        <button onClick={() => navigate(`/classes/${classId}`)} className="text-primary text-sm font-bold hover:underline">Back to Class</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/classes/${classId}`)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{student.display_name}</h1>
          <p className="text-muted-foreground text-sm">{student.email}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Assignments Attempted</p>
          <p className="text-4xl font-extrabold text-foreground mt-2">{attempts.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Completed</p>
          <p className="text-4xl font-extrabold text-foreground mt-2">{attempts.filter((a) => a.completed_at).length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Live Responses</p>
          <p className="text-4xl font-extrabold text-foreground mt-2">{liveResponses.length}</p>
        </div>
      </div>

      {/* Independent Attempts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Assignment Attempts</h2>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
            No assignment attempts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((att) => (
              <div key={att.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleAttempt(att.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {att.completed_at
                      ? <CheckCircle2 className="w-5 h-5 text-primary" />
                      : <Clock className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{att.version_label || "Lesson"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(att.started_at).toLocaleDateString()} · {att.progress_percent}% progress
                        {att.completed_at ? " · Completed" : " · In Progress"}
                      </p>
                    </div>
                  </div>
                  {expandedAttempt === att.id
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expandedAttempt === att.id && (
                  <div className="border-t border-border p-5 space-y-3">
                    {loadingResponses === att.id ? (
                      <p className="text-sm text-muted-foreground animate-pulse">Loading responses…</p>
                    ) : (attemptResponses[att.id]?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">No responses recorded for this attempt.</p>
                    ) : (
                      attemptResponses[att.id]!.map((resp) => (
                        <ResponseCard key={resp.id} resp={resp} />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Session Responses */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Live Session Responses</h2>
        </div>

        {liveResponses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
            No live session responses yet.
          </div>
        ) : (
          <div className="space-y-3">
            {liveResponses.map((resp) => (
              <div key={resp.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                      {(resp.block_type ?? "response").replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{resp.block_title || "Activity"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Session {resp.session_code} · {new Date(resp.submitted_at).toLocaleString()}
                  </span>
                </div>
                <ResponsePayloadDisplay payload={resp.response_payload} />
                {resp.confidence != null && (
                  <p className="text-xs text-muted-foreground mt-2">Confidence: {resp.confidence}%</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Response Card (for attempt responses) ───── */
function ResponseCard({ resp }: { resp: AttemptResponseRow }) {
  return (
    <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
            {(resp.block_type ?? "response").replace(/_/g, " ")}
          </span>
          <span className="text-sm font-semibold text-foreground">{resp.block_title || "Activity"}</span>
        </div>
        <div className="flex items-center gap-3">
          {resp.score != null && (
            <span className="text-xs font-bold text-foreground">Score: {resp.score}</span>
          )}
          {resp.confidence != null && (
            <span className="text-xs text-muted-foreground">Confidence: {resp.confidence}%</span>
          )}
        </div>
      </div>
      <ResponsePayloadDisplay payload={resp.response_payload} />
      <p className="text-[10px] text-muted-foreground">{new Date(resp.submitted_at).toLocaleString()}</p>
    </div>
  );
}

/* ── Generic response payload renderer ────────── */
function ResponsePayloadDisplay({ payload }: { payload: any }) {
  if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
    return <p className="text-xs text-muted-foreground italic">No response data</p>;
  }

  // Text response
  if (typeof payload === "string") {
    return <p className="text-sm text-foreground bg-background/50 rounded-lg p-3">{payload}</p>;
  }

  // Common patterns
  if (payload.text) {
    return <p className="text-sm text-foreground bg-background/50 rounded-lg p-3">{payload.text}</p>;
  }
  if (payload.answer) {
    return <p className="text-sm text-foreground bg-background/50 rounded-lg p-3"><span className="font-semibold">Answer:</span> {String(payload.answer)}</p>;
  }
  if (payload.selected_option_id) {
    return <p className="text-sm text-foreground bg-background/50 rounded-lg p-3"><span className="font-semibold">Selected:</span> {payload.selected_option_id}</p>;
  }
  if (payload.selected_options && Array.isArray(payload.selected_options)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {payload.selected_options.map((opt: string, i: number) => (
          <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{opt}</span>
        ))}
      </div>
    );
  }
  if (payload.position) {
    return <p className="text-sm text-foreground bg-background/50 rounded-lg p-3"><span className="font-semibold">Position:</span> {payload.position}</p>;
  }

  // Fallback: show JSON
  return (
    <pre className="text-xs text-foreground bg-background/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}
