import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Radio, Smartphone, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StepBlock, Hint, StepResponse } from "../components/steps/types";
import type { Json } from "@/integrations/supabase/types";
import ConceptRevealStep from "../components/steps/ConceptRevealStep";
import MicroChallengeStep from "../components/steps/MicroChallengeStep";
import ReasoningResponseStep from "../components/steps/ReasoningResponseStep";
import PeerCompareStep from "../components/steps/PeerCompareStep";
import DebateStep from "../components/steps/DebateStep";
import type { DebateConfig } from "../components/steps/DebateStep";
import CollaborativeBoardStep from "../components/steps/CollaborativeBoardStep";
import type { CollaborativeBoardConfig } from "../components/steps/CollaborativeBoardStep";
import PeerReviewStep from "../components/steps/PeerReviewStep";
import type { PeerReviewConfig } from "../components/steps/PeerReviewStep";
import GroupChallengeStep from "../components/steps/GroupChallengeStep";
import type { GroupChallengeConfig } from "../components/steps/GroupChallengeStep";
import ShortAnswerStep from "../components/steps/ShortAnswerStep";
import type { ShortAnswerConfig } from "../components/steps/ShortAnswerStep";
import ExitTicketStep from "../components/steps/ExitTicketStep";
import type { ExitTicketConfig } from "../components/steps/ExitTicketStep";
import ScenarioStep from "../components/steps/ScenarioStep";
import type { ScenarioConfig } from "../components/steps/ScenarioStep";
import DilemmaTreeStep from "../components/steps/DilemmaTreeStep";
import type { DilemmaTreeConfig } from "../components/steps/DilemmaTreeStep";
import DragDropStep from "../components/steps/DragDropStep";
import type { DragDropConfig } from "../components/steps/DragDropStep";
import MatchingStep from "../components/steps/MatchingStep";
import type { MatchingConfig } from "../components/steps/MatchingStep";
import DrawingStep from "../components/steps/DrawingStep";
import type { DrawingConfig } from "../components/steps/DrawingStep";
import RedTeamStep from "../components/steps/RedTeamStep";
import type { RedTeamConfig } from "../components/steps/RedTeamStep";
import type {
  ConceptRevealConfig, MicroChallengeConfig,
  ReasoningResponseConfig, PeerCompareConfig,
} from "../components/steps/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import VideoCheckpointStep from "../components/steps/VideoCheckpointStep";
import type { VideoCheckpointConfig } from "../components/steps/VideoCheckpointStep";

function videoHasCheckpoints(config: Record<string, unknown>): boolean {
  return Array.isArray(config.checkpoints) && config.checkpoints.length > 0;
}

function isInteractiveBlock(type: string, config?: Record<string, unknown>) {
  if (type === "video" && config && videoHasCheckpoints(config)) return true;
  return [
    "micro_challenge", "reasoning_response", "peer_compare",
    "poll", "mcq", "multi_select", "short_answer", "debate",
    "exit_ticket", "scenario", "dilemma_tree", "concept_reveal",
    "collaborative_board", "group_board", "group_challenge",
    "peer_review", "drag_drop", "matching", "drawing", "red_team",
  ].includes(type);
}

function PollMultiSelectStep({ options, isMulti, body, onComplete }: {
  options: string[]; isMulti: boolean; body: string | null;
  onComplete: (r: StepResponse) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (opt: string) => {
    if (isMulti) {
      setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
    } else {
      setSelected([opt]);
    }
  };
  return (
    <div className="space-y-4">
      {body && <p className="text-lg text-foreground">{body}</p>}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button key={i} type="button" onClick={() => toggle(opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              selected.includes(opt)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-primary/30"
            }`}>
            <span className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                selected.includes(opt) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onComplete({ selected_options: selected, answer: isMulti ? selected : selected[0] })}
        disabled={selected.length === 0}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Submit {isMulti ? `(${selected.length} selected)` : ""}
      </button>
    </div>
  );
}

export default function StudentLiveView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { appUserId } = useAuth();

  const [steps, setSteps] = useState<StepBlock[]>([]);
  const [lessonTitle, setLessonTitle] = useState("Live Session");
  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [revealedResults, setRevealedResults] = useState<Record<string, unknown> | null>(null);
  const broadcastRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

  // Broadcast channel for real-time teacher events
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`live-session-${sessionId}`);

    channel.on("broadcast", { event: "teacher_event" }, (payload) => {
      const data = payload.payload as { event_type: string; [key: string]: unknown };
      handleEvent(data);
    });

    channel.subscribe();
    broadcastRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, steps.length]);

  function handleEvent(evt: { event_type: string; [key: string]: unknown }) {
    switch (evt.event_type) {
      case "session_started":
        setSessionStarted(true);
        break;
      case "session_ended":
        setSessionEnded(true);
        break;
      case "next_block":
        setActiveIndex((i) => Math.min(i + 1, Math.max(steps.length - 1, 0)));
        setLocked(false); setSubmitted(false); setRevealedResults(null);
        break;
      case "previous_block":
        setActiveIndex((i) => Math.max(i - 1, 0));
        setLocked(false); setSubmitted(false); setRevealedResults(null);
        break;
      case "goto_block":
        if (typeof evt.step_index === "number") {
          setActiveIndex(evt.step_index);
          setLocked(false); setSubmitted(false); setRevealedResults(null);
        }
        break;
      case "reveal_results":
        setRevealedResults(evt as Record<string, unknown>);
        break;
      case "lock":
        setLocked(true);
        break;
      case "unlock":
        setLocked(false);
        break;
      case "timer":
        if (typeof evt.duration === "number") {
          setTimerSeconds(evt.duration);
          const interval = setInterval(() => {
            setTimerSeconds((s) => {
              if (s === null || s <= 1) { clearInterval(interval); return null; }
              return s - 1;
            });
          }, 1000);
        }
        break;
    }
  }

  async function loadSession() {
    if (!sessionId) return;

    const { data: session } = await supabase
      .from("live_sessions").select("id, session_code, lesson_version_id, ended_at").eq("id", sessionId).single();
    if (!session) { setLoading(false); return; }

    if (session.ended_at) {
      setSessionEnded(true);
      setLoading(false);
      return;
    }

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

    // Replay persisted events (for late joins)
    const { data: events } = await supabase
      .from("live_session_events").select("event_type, event_payload, created_at")
      .eq("live_session_id", sessionId).order("created_at", { ascending: true });

    if (events && blocks) {
      let idx = 0;
      let isStarted = false;
      for (const evt of events) {
        if (evt.event_type === "session_started") isStarted = true;
        if (evt.event_type === "next_block") idx = Math.min(idx + 1, blocks.length - 1);
        else if (evt.event_type === "previous_block") idx = Math.max(idx - 1, 0);
        else if (evt.event_type === "goto_block" && typeof (evt.event_payload as Record<string, unknown>).step_index === "number") {
          idx = (evt.event_payload as Record<string, unknown>).step_index as number;
        }
        else if (evt.event_type === "lock") setLocked(true);
        else if (evt.event_type === "unlock") setLocked(false);
      }
      setActiveIndex(idx);
      setSessionStarted(isStarted);
    }

    setLoading(false);
  }

  const handleStepComplete = useCallback(async (response: StepResponse = {}) => {
    if (!sessionId || !appUserId || !steps[activeIndex]) return;
    setSubmitted(true);

    // Save to DB
    await supabase.from("live_responses").insert([{
      live_session_id: sessionId,
      lesson_block_id: steps[activeIndex].id,
      user_id: appUserId,
      response_payload: (response ?? {}) as unknown as Json,
      confidence: 3,
    }]);

    // Notify teacher via broadcast
    broadcastRef.current?.send({
      type: "broadcast",
      event: "student_response",
      payload: { block_id: steps[activeIndex].id },
    });
  }, [sessionId, appUserId, activeIndex, steps]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No session ID provided.</p>
          <button onClick={() => navigate("/join")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">Join a Session</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Connecting to session…</p>
        </div>
      </div>
    );
  }

  // ---------- SESSION ENDED ----------
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6">
          <span className="text-6xl">🏁</span>
          <h1 className="text-2xl font-extrabold text-foreground">Session Complete</h1>
          <p className="text-muted-foreground">Your teacher has ended this live session. Great work!</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------- WAITING FOR TEACHER TO START ----------
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative z-10 text-center space-y-6 px-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <Radio className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{lessonTitle}</h1>
          <p className="text-muted-foreground">Waiting for your teacher to start the lesson…</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // ---------- ACTIVE SESSION ----------
  const step = steps[activeIndex];
  const isInteractive = step ? isInteractiveBlock(step.block_type, step.config) : false;
  const progress = steps.length > 0 ? ((activeIndex + 1) / steps.length) * 100 : 0;

  // ---------- LOOK UP SCREEN ----------
  if (step && !isInteractive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
            <span className="text-sm font-semibold text-foreground truncate">{lessonTitle}</span>
          </div>
          <span className="text-xs text-muted-foreground">Step {activeIndex + 1}/{steps.length}</span>
        </div>
        <div className="h-1 bg-secondary"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Eye className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-foreground">Look Up! 👀</h2>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              Watch the screen at the front of the classroom
            </p>
          </div>
          {step.title && (
            <div className="bg-card rounded-2xl border border-border px-6 py-4">
              <p className="text-sm text-muted-foreground font-medium">Currently showing</p>
              <p className="text-foreground font-bold mt-1">{step.title}</p>
            </div>
          )}
        </div>

        {timerSeconds !== null && (
          <div className="border-t border-border bg-card px-4 py-3 text-center">
            <span className="text-lg font-bold text-foreground tabular-nums">
              ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}

        {locked && (
          <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-3 text-center">
            <span className="text-sm font-bold text-destructive">🔒 Responses are locked</span>
          </div>
        )}
      </div>
    );
  }

  // ---------- INTERACTIVE STEP ----------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
          <span className="text-sm font-semibold text-foreground truncate">{lessonTitle}</span>
        </div>
        <span className="text-xs text-muted-foreground">Step {activeIndex + 1}/{steps.length}</span>
      </div>
      <div className="h-1 bg-secondary"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
              <Smartphone className="w-4 h-4" />
              Your Turn!
            </div>
            {step?.title && (
              <h2 className="text-xl font-extrabold text-foreground">{step.title}</h2>
            )}
          </div>

          {timerSeconds !== null && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-bold tabular-nums">
                ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {locked ? (
            <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-8 text-center space-y-3 animate-in fade-in duration-300">
              <span className="text-4xl">🔒</span>
              <p className="text-destructive font-bold">Responses are locked</p>
              <p className="text-sm text-muted-foreground">Wait for your teacher to unlock</p>
            </div>
          ) : submitted ? (
            <div className="rounded-2xl border-2 border-success/20 bg-success/5 p-8 text-center space-y-3 animate-in fade-in duration-300">
              <span className="text-4xl">✅</span>
              <p className="text-success font-bold text-lg">Response submitted!</p>
              <p className="text-sm text-muted-foreground">Waiting for the class…</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms" }}>
              {step?.block_type === "video" && videoHasCheckpoints(step.config) && (
                <VideoCheckpointStep
                  config={step.config as unknown as VideoCheckpointConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {step?.block_type === "concept_reveal" && (
                <ConceptRevealStep
                  config={step.config as unknown as ConceptRevealConfig}
                  body={step.body}
                  onComplete={() => handleStepComplete()}
                />
              )}
              {(step?.block_type === "micro_challenge" || (step?.block_type as string) === "mcq") && (
                <MicroChallengeStep
                  config={step.config as unknown as MicroChallengeConfig}
                  hints={step.hints}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "reasoning_response" && (
                <ReasoningResponseStep
                  config={step.config as unknown as ReasoningResponseConfig}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "peer_compare" && (
                <PeerCompareStep
                  config={step.config as unknown as PeerCompareConfig}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {(step?.block_type === "poll" || step?.block_type === "multi_select") && (
                <PollMultiSelectStep
                  key={step.id}
                  options={Array.isArray((step.config as any).options) ? (step.config as any).options : []}
                  isMulti={step.block_type === "multi_select"}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "short_answer" && (
                <ShortAnswerStep
                  config={step.config as unknown as ShortAnswerConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "exit_ticket" && (
                <ExitTicketStep
                  config={step.config as unknown as ExitTicketConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "scenario" && (
                <ScenarioStep
                  config={step.config as unknown as ScenarioConfig}
                  body={step.body}
                  hints={step.hints}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "dilemma_tree" && (
                <DilemmaTreeStep
                  config={step.config as unknown as DilemmaTreeConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "debate" && (
                <DebateStep
                  config={step.config as unknown as DebateConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {(step?.block_type === "collaborative_board" || step?.block_type === "group_board") && (
                <CollaborativeBoardStep
                  config={step.config as unknown as CollaborativeBoardConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {step?.block_type === "group_challenge" && (
                <GroupChallengeStep
                  config={step.config as unknown as GroupChallengeConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {step?.block_type === "peer_review" && (
                <PeerReviewStep
                  config={step.config as unknown as PeerReviewConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                  isLive
                />
              )}
              {step?.block_type === "drag_drop" && (
                <DragDropStep
                  config={step.config as unknown as DragDropConfig}
                  body={step.body}
                  hints={step.hints}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "matching" && (
                <MatchingStep
                  config={step.config as unknown as MatchingConfig}
                  body={step.body}
                  hints={step.hints}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "drawing" && (
                <DrawingStep
                  config={step.config as unknown as DrawingConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
              {step?.block_type === "red_team" && (
                <RedTeamStep
                  config={step.config as unknown as RedTeamConfig}
                  body={step.body}
                  onComplete={(r) => handleStepComplete(r)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
