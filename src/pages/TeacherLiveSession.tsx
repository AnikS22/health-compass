import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  BarChart3,
  Users,
  Eye,
  Timer,
  Radio,
  Copy,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StepRunner from "../components/steps/StepRunner";
import type { StepConfig } from "../components/steps/types";

type LessonBlock = {
  id: string;
  sequence_no: number;
  block_type: string;
  title: string | null;
  body: string | null;
  config: Record<string, unknown>;
  hints: unknown[];
  is_gate: boolean;
};

type Participant = {
  id: string;
  display_name: string;
  joined_at: string;
};

export default function TeacherLiveSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { appUserId } = useAuth();

  const [sessionCode, setSessionCode] = useState("");
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [lessonTitle, setLessonTitle] = useState("Live Session");
  const [currentStep, setCurrentStep] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

  // Subscribe to participant changes
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_session_participants", filter: `live_session_id=eq.${sessionId}` },
        (payload) => {
          const p = payload.new as Participant;
          setParticipants((prev) => [...prev, p]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  async function loadSession() {
    if (!sessionId) return;

    const { data: session } = await supabase
      .from("live_sessions")
      .select("id, session_code, lesson_version_id")
      .eq("id", sessionId)
      .single();

    if (!session) {
      setLoading(false);
      return;
    }

    setSessionCode(session.session_code);

    // Load lesson blocks
    const { data: blocks } = await supabase
      .from("lesson_blocks")
      .select("id, sequence_no, block_type, title, body, config, hints, is_gate")
      .eq("lesson_version_id", session.lesson_version_id)
      .order("sequence_no", { ascending: true });

    if (blocks) {
      const mapped: StepConfig[] = blocks.map((b: LessonBlock) => ({
        id: b.id,
        type: b.block_type as StepConfig["type"],
        title: b.title ?? `Step ${b.sequence_no}`,
        body: b.body ?? "",
        config: b.config,
        hints: (b.hints as string[]) ?? [],
        isGate: b.is_gate,
      }));
      setSteps(mapped);
    }

    // Load lesson title
    const { data: lv } = await supabase
      .from("lesson_versions")
      .select("lesson_id")
      .eq("id", session.lesson_version_id)
      .single();
    if (lv) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("title")
        .eq("id", lv.lesson_id)
        .single();
      if (lesson) setLessonTitle(lesson.title);
    }

    // Load participants
    const { data: parts } = await supabase
      .from("live_session_participants")
      .select("id, display_name, joined_at")
      .eq("live_session_id", sessionId);
    if (parts) setParticipants(parts as Participant[]);

    setLoading(false);
  }

  async function sendEvent(eventType: string, payload: Record<string, unknown> = {}) {
    if (!sessionId || !appUserId) return;
    await supabase.from("live_session_events").insert({
      live_session_id: sessionId,
      actor_user_id: appUserId,
      event_type: eventType,
      event_payload: payload,
    });
  }

  const goNext = useCallback(() => {
    setCurrentStep((i) => {
      const next = Math.min(i + 1, steps.length - 1);
      sendEvent("next_block");
      return next;
    });
    setShowDistribution(false);
    setLocked(false);
  }, [steps.length, sessionId, appUserId]);

  const goPrev = useCallback(() => {
    setCurrentStep((i) => {
      const prev = Math.max(i - 1, 0);
      sendEvent("previous_block");
      return prev;
    });
    setShowDistribution(false);
    setLocked(false);
  }, [sessionId, appUserId]);

  const toggleLock = useCallback(() => {
    setLocked((prev) => {
      sendEvent(prev ? "unlock" : "lock");
      return !prev;
    });
  }, [sessionId, appUserId]);

  const revealResults = useCallback(() => {
    setShowDistribution((prev) => {
      if (!prev) sendEvent("reveal_results");
      return !prev;
    });
  }, [sessionId, appUserId]);

  const startTimer = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
    sendEvent("timer", { duration: seconds });
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s === null || s <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [sessionId, appUserId]);

  function copyCode() {
    navigator.clipboard.writeText(sessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No session selected.</p>
          <button onClick={() => navigate("/live")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
            Go to Live Sessions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading session…</div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/live")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-success animate-pulse" />
              <span className="text-sm font-semibold text-foreground">Live Session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm bg-secondary text-foreground px-3 py-1 rounded-lg font-mono font-bold">
                {sessionCode}
              </span>
              <button onClick={copyCode} className="p-1 rounded hover:bg-secondary transition-colors">
                {copiedCode ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {participants.length} joined
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 overflow-y-auto">
          {steps.length > 0 ? (
            <StepRunner
              steps={steps}
              lessonTitle={lessonTitle}
              controlledIndex={currentStep}
              isLive
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No lesson blocks found for this session.
            </div>
          )}
        </div>

        {timerRunning && timerSeconds !== null && (
          <div className="fixed top-20 right-[340px] bg-card border border-border rounded-xl shadow-lg p-4 text-center">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Time remaining</p>
            <p className="text-4xl font-bold text-foreground tabular-nums mt-1">
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </p>
          </div>
        )}
      </div>

      <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Teacher Controls</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step {currentStep + 1} of {steps.length}: {step?.title ?? "—"}
          </p>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={goNext}
              disabled={currentStep === steps.length - 1}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-border space-y-2">
          <button
            onClick={toggleLock}
            className={`w-full py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              locked ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {locked ? "Responses Locked" : "Lock Responses"}
          </button>
          <button
            onClick={revealResults}
            className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showDistribution ? "Hide Distribution" : "Reveal Distribution"}
          </button>
          <button
            onClick={() => startTimer(60)}
            disabled={timerRunning}
            className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Timer className="w-4 h-4" /> Start 60s Timer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Participants</h4>
            <span className="text-xs text-muted-foreground">{participants.length}</span>
          </div>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Waiting for students to join with code <span className="font-mono font-bold">{sessionCode}</span>
            </p>
          ) : (
            <div className="space-y-1.5">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                  <span className="text-sm text-foreground">{p.display_name}</span>
                  <span className="text-xs text-success font-medium">✓</span>
                </div>
              ))}
            </div>
          )}

          <button className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors mt-3">
            <Eye className="w-4 h-4" /> Spotlight a Response
          </button>
        </div>
      </aside>
    </div>
  );
}
