import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Lock, Unlock,
  BarChart3, Users, Timer, Radio, Copy, Check, Play,
  Maximize, Minimize, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StepBlock, Hint } from "../components/steps/types";
import type { Json } from "@/integrations/supabase/types";

type Participant = { id: string; display_name: string; joined_at: string };

function getBlockIcon(type: string) {
  switch (type) {
    case "video": return "🎬";
    case "concept_reveal": return "💡";
    case "micro_challenge": return "🧩";
    case "reasoning_response": return "✍️";
    case "peer_compare": return "👥";
    case "poll": return "📊";
    case "scenario": return "🎭";
    case "debate": return "⚖️";
    case "exit_ticket": return "🎫";
    default: return "📝";
  }
}

function isInteractiveBlock(type: string) {
  return ["micro_challenge", "reasoning_response", "peer_compare", "poll", "mcq", "multi_select", "short_answer", "debate", "exit_ticket", "scenario", "dilemma_tree"].includes(type);
}

export default function TeacherLiveSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { appUserId } = useAuth();

  const [sessionCode, setSessionCode] = useState("");
  const [steps, setSteps] = useState<StepBlock[]>([]);
  const [lessonTitle, setLessonTitle] = useState("Live Session");
  const [currentStep, setCurrentStep] = useState(0);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const presentationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

  // Subscribe to participants
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_session_participants", filter: `live_session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => [...prev, payload.new as Participant])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Subscribe to live responses for count
  useEffect(() => {
    if (!sessionId || !started) return;
    const channel = supabase
      .channel(`responses-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_responses", filter: `live_session_id=eq.${sessionId}` },
        () => setResponseCount((c) => c + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, started]);

  // Reset response count on step change
  useEffect(() => { setResponseCount(0); }, [currentStep]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!started) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "l") toggleLock();
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, steps.length, currentStep, locked, isFullscreen]);

  async function loadSession() {
    if (!sessionId) return;
    const { data: session } = await supabase.from("live_sessions").select("id, session_code, lesson_version_id").eq("id", sessionId).single();
    if (!session) { setLoading(false); return; }
    setSessionCode(session.session_code);

    const { data: blocks } = await supabase
      .from("lesson_blocks")
      .select("id, sequence_no, block_type, title, body, config, hints, is_gate, mastery_rules")
      .eq("lesson_version_id", session.lesson_version_id)
      .order("sequence_no", { ascending: true });

    if (blocks) {
      setSteps(blocks.map((b) => ({
        id: b.id, sequence_no: b.sequence_no,
        block_type: b.block_type as StepBlock["block_type"],
        title: b.title, body: b.body,
        config: (b.config ?? {}) as Record<string, unknown>,
        hints: (b.hints ?? []) as unknown as Hint[],
        is_gate: b.is_gate,
        mastery_rules: (b.mastery_rules ?? {}) as Record<string, unknown>,
      })));
    }

    const { data: lv } = await supabase.from("lesson_versions").select("lesson_id").eq("id", session.lesson_version_id).single();
    if (lv) {
      const { data: lesson } = await supabase.from("lessons").select("title").eq("id", lv.lesson_id).single();
      if (lesson) setLessonTitle(lesson.title);
    }

    const { data: parts } = await supabase.from("live_session_participants").select("id, display_name, joined_at").eq("live_session_id", sessionId);
    if (parts) setParticipants(parts as Participant[]);
    setLoading(false);
  }

  async function sendEvent(eventType: string, payload: Record<string, unknown> = {}) {
    if (!sessionId || !appUserId) return;
    await supabase.from("live_session_events").insert([{
      live_session_id: sessionId, actor_user_id: appUserId,
      event_type: eventType,
      event_payload: payload as unknown as Json,
    }]);
  }

  const goNext = useCallback(() => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    sendEvent("next_block", { step_index: next });
    setLocked(false);
  }, [currentStep, steps.length, sessionId, appUserId]);

  const goPrev = useCallback(() => {
    if (currentStep <= 0) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    sendEvent("previous_block", { step_index: prev });
    setLocked(false);
  }, [currentStep, sessionId, appUserId]);

  const toggleLock = useCallback(() => {
    setLocked((prev) => { sendEvent(prev ? "unlock" : "lock"); return !prev; });
  }, [sessionId, appUserId]);

  const startTimer = useCallback((seconds: number) => {
    setTimerSeconds(seconds); setTimerRunning(true);
    sendEvent("timer", { duration: seconds });
    const interval = setInterval(() => {
      setTimerSeconds((s) => { if (s === null || s <= 1) { clearInterval(interval); setTimerRunning(false); return 0; } return s - 1; });
    }, 1000);
  }, [sessionId, appUserId]);

  function copyCode() {
    navigator.clipboard.writeText(sessionCode);
    setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      presentationRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function handleStart() {
    setStarted(true);
    sendEvent("session_started");
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No session selected.</p>
          <button onClick={() => navigate("/live")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">Go to Live Sessions</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background"><div className="animate-pulse text-muted-foreground text-sm">Loading session…</div></div>;
  }

  // ---------- LOBBY SCREEN (before starting) ----------
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <button onClick={() => navigate("/live")} className="absolute top-6 left-6 p-2 rounded-lg hover:bg-muted transition-colors z-10">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto px-4">
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Session</span>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{lessonTitle}</h1>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Students join with code:</p>
            <div className="flex items-center justify-center gap-3">
              <div className="bg-card border-2 border-primary/30 rounded-2xl px-8 py-5 shadow-lg">
                <span className="text-5xl font-mono font-extrabold text-foreground tracking-[0.3em]">
                  {sessionCode}
                </span>
              </div>
              <button onClick={copyCode} className="p-3 rounded-xl bg-card border border-border hover:bg-secondary transition-colors">
                {copiedCode ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Students Joined
              </h3>
              <span className="text-2xl font-extrabold text-primary">{participants.length}</span>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {participants.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {p.display_name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={steps.length === 0}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-extrabold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center gap-3 mx-auto"
          >
            <Play className="w-5 h-5" />
            Start Lesson ({steps.length} steps)
          </button>
        </div>
      </div>
    );
  }

  // ---------- PRESENTATION MODE ----------
  const step = steps[currentStep];
  const isInteractive = step ? isInteractiveBlock(step.block_type) : false;
  const config = step?.config as Record<string, unknown>;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div ref={presentationRef} className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStarted(false); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{lessonTitle}</span>
          </div>
          <span className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-lg font-mono font-bold">{sessionCode}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {participants.length}
          </span>
          {isInteractive && (
            <span className="text-xs text-primary font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {responseCount} responses
            </span>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4 text-muted-foreground" /> : <Maximize className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary shrink-0">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Main presentation area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {step && (
            <div className="w-full max-w-4xl space-y-6 animate-in fade-in duration-500">
              {/* Step type badge */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getBlockIcon(step.block_type)}</span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  {step.title && (
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{step.title}</h2>
                  )}
                </div>
              </div>

              {/* Body text */}
              {step.body && (
                <p className="text-xl text-muted-foreground leading-relaxed">{step.body}</p>
              )}

              {/* Content rendering based on block type */}
              {(step.block_type as string) === "video" && (
                <div className="rounded-2xl overflow-hidden border border-border bg-card aspect-video flex items-center justify-center">
                  {config.video_url ? (
                    <video src={config.video_url as string} controls className="w-full h-full" />
                  ) : (
                    <div className="text-center space-y-3">
                      <span className="text-6xl">🎬</span>
                      <p className="text-muted-foreground font-medium">Video content</p>
                    </div>
                  )}
                </div>
              )}

              {step.block_type === "concept_reveal" && (
                <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-3xl">💡</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{String(config.key_idea ?? "")}</h3>
                      {config.detail != null && <p className="text-lg text-muted-foreground mt-2">{String(config.detail)}</p>}
                    </div>
                  </div>
                </div>
              )}

              {(step.block_type === "micro_challenge" || (step.block_type as string) === "mcq") && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.question as string) ?? ""}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {((config.options as Array<{ id: string; text: string }>) ?? []).map((opt, i) => (
                      <div key={opt.id} className="rounded-2xl border-2 border-border bg-card p-5 flex items-center gap-3 hover:border-primary/30 transition-colors">
                        <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground font-medium">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      📱 Students answer on their devices
                    </span>
                  </div>
                </div>
              )}

              {step.block_type === "reasoning_response" && (
                <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                    ✍️ Students writing on their devices
                  </span>
                </div>
              )}

              {step.block_type === "peer_compare" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                  {((config.options as Array<{ id: string; text: string }>) ?? []).length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {((config.options as Array<{ id: string; text: string }>) ?? []).map((opt, i) => (
                        <div key={opt.id} className="rounded-2xl border-2 border-border bg-card p-5 flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-foreground font-medium">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      👥 Students sharing perspectives
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback for other types */}
              {!["video", "concept_reveal", "micro_challenge", "mcq", "reasoning_response", "peer_compare"].includes(step.block_type) && (
                <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
                  <span className="text-5xl">{getBlockIcon(step.block_type)}</span>
                  <p className="text-lg font-medium text-foreground capitalize">{step.block_type.replace(/_/g, " ")}</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                    📱 Students interact on their devices
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timer overlay */}
          {timerRunning && timerSeconds !== null && (
            <div className="absolute top-4 right-4 bg-card border border-border rounded-2xl shadow-lg p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Timer</p>
              <p className="text-3xl font-bold text-foreground tabular-nums mt-1">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar controls */}
        <aside className="w-72 border-l border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex gap-2">
              <button onClick={goPrev} disabled={currentStep === 0} className="flex-1 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-1 hover:bg-muted transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button onClick={goNext} disabled={currentStep === steps.length - 1} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-border space-y-2">
            <button onClick={toggleLock} className={`w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${locked ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-card text-foreground hover:bg-muted"}`}>
              {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {locked ? "Locked" : "Lock Responses"}
            </button>
            <button onClick={() => startTimer(60)} disabled={timerRunning} className="w-full py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-40">
              <Timer className="w-4 h-4" /> 60s Timer
            </button>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Steps</p>
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentStep(i); sendEvent("goto_block", { step_index: i }); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                  i === currentStep ? "bg-primary/10 text-primary" : i < currentStep ? "text-muted-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                <span>{getBlockIcon(s.block_type)}</span>
                <span className="truncate">{s.title ?? `Step ${i + 1}`}</span>
              </button>
            ))}
          </div>

          {/* Participants count */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-4 h-4" /> Joined</span>
              <span className="font-bold text-foreground">{participants.length}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
