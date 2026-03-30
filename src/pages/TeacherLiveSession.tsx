import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Lock, Unlock,
  BarChart3, Users, Timer, Radio, Copy, Check, Play,
  Maximize, Minimize, Eye, Monitor, StickyNote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StepBlock, Hint } from "../components/steps/types";
import type { Json } from "@/integrations/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import VideoEmbed from "@/components/VideoEmbed";
import VideoCheckpointStep from "@/components/steps/VideoCheckpointStep";
import type { VideoCheckpointConfig } from "@/components/steps/VideoCheckpointStep";

type Participant = { id: string; display_name: string; joined_at: string; user_id?: string };
type LiveResponse = { id: string; user_id: string; response_payload: Record<string, unknown>; submitted_at: string };

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
    case "dilemma_tree": return "🌳";
    case "collaborative_board": case "group_board": return "📋";
    case "short_answer": return "📝";
    case "drag_drop": return "🎯";
    case "matching": return "🔗";
    case "drawing": return "🎨";
    case "red_team": return "🔴";
    case "slides": return "📑";
    case "group_challenge": return "🏆";
    case "peer_review": return "📖";
    default: return "📝";
  }
}

function isInteractiveBlock(type: string, config?: Record<string, unknown>) {
  if (type === "video" && config && videoHasCheckpoints(config)) return true;
  return [
    "micro_challenge", "reasoning_response", "peer_compare",
    "poll", "mcq", "multi_select", "short_answer", "debate",
    "exit_ticket", "scenario", "dilemma_tree",
    "collaborative_board", "group_board", "group_challenge",
    "peer_review", "drag_drop", "matching", "drawing", "red_team",
  ].includes(type);
}

function videoHasCheckpoints(config: Record<string, unknown>): boolean {
  return Array.isArray(config.checkpoints) && config.checkpoints.length > 0;
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
  const [liveResponses, setLiveResponses] = useState<LiveResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const presentationRef = useRef<HTMLDivElement>(null);
  const broadcastRef = useRef<RealtimeChannel | null>(null);
  const presenterChannelRef = useRef<BroadcastChannel | null>(null);
  const [speakerNotes, setSpeakerNotes] = useState("");
  const [liveSlideIndex, setLiveSlideIndex] = useState(0);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [collectData, setCollectData] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);

  // Set up broadcast channel
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`live-session-${sessionId}`);
    
    channel.on("broadcast", { event: "student_response" }, () => {
      setResponseCount((c) => c + 1);
    });

    channel.on("broadcast", { event: "student_joined" }, (payload) => {
      const p = payload.payload as Participant;
      setParticipants((prev) => {
        if (prev.some((x) => x.id === p.id)) return prev;
        return [...prev, p];
      });
    });

    channel.subscribe();
    broadcastRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Poll for participants in lobby (before session starts) and during session
  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    async function refreshParticipants() {
      const { data: parts } = await supabase
        .from("live_session_participants")
        .select("id, display_name, joined_at, user_id")
        .eq("live_session_id", sessionId!)
        .is("left_at", null);
      if (!mounted || !parts) return;
      setParticipants(parts as Participant[]);
      const nameMap: Record<string, string> = {};
      parts.forEach((p: any) => { if (p.user_id) nameMap[p.user_id] = p.display_name; });
      setParticipantNames(nameMap);
    }
    const interval = setInterval(refreshParticipants, 3000);
    return () => { mounted = false; clearInterval(interval); };
  }, [sessionId]);

  // Reset response count on step change
  useEffect(() => { setResponseCount(0); setLiveResponses([]); setShowResults(false); }, [currentStep]);

  // Poll for live responses on the active block
  useEffect(() => {
    if (!sessionId || !started || !steps[currentStep]) return;
    const blockId = steps[currentStep].id;
    let mounted = true;

    async function fetchResponses() {
      const [respResult, partResult] = await Promise.all([
        supabase
          .from("live_responses")
          .select("id, user_id, response_payload, submitted_at")
          .eq("live_session_id", sessionId!)
          .eq("lesson_block_id", blockId)
          .order("submitted_at", { ascending: true })
          .limit(200),
        supabase
          .from("live_session_participants")
          .select("id, display_name, joined_at, user_id")
          .eq("live_session_id", sessionId!)
          .is("left_at", null)
      ]);
      if (!mounted) return;
      if (respResult.data) {
        setLiveResponses(respResult.data as unknown as LiveResponse[]);
        setResponseCount(respResult.data.length);
      }
      if (partResult.data) {
        setParticipants(partResult.data as Participant[]);
        const nameMap: Record<string, string> = {};
        (partResult.data as any[]).forEach((p) => { if (p.user_id) nameMap[p.user_id] = p.display_name; });
        setParticipantNames(nameMap);
      }
    }

    void fetchResponses();
    const timer = setInterval(fetchResponses, 3000);
    return () => { mounted = false; clearInterval(timer); };
  }, [sessionId, started, currentStep, steps]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Presenter BroadcastChannel - sync state to projector window
  useEffect(() => {
    if (!sessionId) return;
    const bc = new BroadcastChannel(`presenter-${sessionId}`);
    presenterChannelRef.current = bc;
    return () => bc.close();
  }, [sessionId]);

  // Sync state to projector whenever relevant state changes
  useEffect(() => {
    presenterChannelRef.current?.postMessage({
      type: "sync_state",
      currentStep,
      showResults,
      locked,
      timerSeconds,
      timerRunning,
    });
  }, [currentStep, showResults, locked, timerSeconds, timerRunning]);

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

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

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

    const { data: parts } = await supabase
      .from("live_session_participants")
      .select("id, display_name, joined_at, user_id")
      .eq("live_session_id", sessionId)
      .is("left_at", null);
    if (parts) {
      setParticipants(parts as Participant[]);
      const nameMap: Record<string, string> = {};
      parts.forEach((p: any) => { if (p.user_id) nameMap[p.user_id] = p.display_name; });
      setParticipantNames(nameMap);
    }
    setLoading(false);
  }

  // Broadcast an event to all students AND persist to DB
  function broadcast(eventType: string, payload: Record<string, unknown> = {}) {
    broadcastRef.current?.send({
      type: "broadcast",
      event: "teacher_event",
      payload: { event_type: eventType, ...payload },
    });

    if (sessionId && appUserId) {
      supabase.from("live_session_events").insert([{
        live_session_id: sessionId, actor_user_id: appUserId,
        event_type: eventType,
        event_payload: payload as unknown as Json,
      }]).then(() => {});
    }
  }

  const goNext = useCallback(() => {
    if (currentStep >= steps.length - 1) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    broadcast("next_block", { step_index: next });
    setLocked(false);
  }, [currentStep, steps.length, sessionId, appUserId]);

  const goPrev = useCallback(() => {
    if (currentStep <= 0) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    broadcast("previous_block", { step_index: prev });
    setLocked(false);
  }, [currentStep, sessionId, appUserId]);

  const toggleLock = useCallback(() => {
    setLocked((prev) => { broadcast(prev ? "unlock" : "lock"); return !prev; });
  }, [sessionId, appUserId]);

  const startTimer = useCallback((seconds: number) => {
    setTimerSeconds(seconds); setTimerRunning(true);
    broadcast("timer", { duration: seconds });
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
    broadcast("session_started");
  }

  async function handleEndSession(goToReview = false) {
    if (!sessionId) return;
    await supabase
      .from("live_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("host_teacher_id", appUserId!);
    broadcast("session_ended");
    setShowEndModal(false);
    if (goToReview) {
      navigate(`/live/review?session=${sessionId}`);
    } else {
      navigate("/live");
    }
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

  // ---------- LOBBY SCREEN ----------
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <button onClick={() => navigate("/classes")} className="absolute top-6 left-6 p-2 rounded-lg hover:bg-muted transition-colors z-10">
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

          {/* Collect Data Toggle */}
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Collect Response Data</p>
                <p className="text-xs text-muted-foreground">Save all student responses for review after session ends</p>
              </div>
            </div>
            <button
              onClick={() => setCollectData(!collectData)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${collectData ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${collectData ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <button
            onClick={handleStart}
            disabled={steps.length === 0}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-extrabold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center gap-3 mx-auto"
          >
            <Play className="w-5 h-5" />
            Start Lesson ({steps.length} steps)
          </button>

          {steps.length === 0 && (
            <p className="text-sm text-destructive font-medium">This lesson has no content blocks. Choose a lesson with published blocks.</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- PRESENTATION MODE ----------
  const step = steps[currentStep];
  const isInteractive = step ? isInteractiveBlock(step.block_type, step.config) : false;
  const config = step?.config as Record<string, unknown>;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // Helper to get student name from user_id
  function getStudentName(userId: string): string {
    return participantNames[userId] || "Student";
  }

  // Aggregate poll/multi_select results - handles both {selected_option} and {answer} and {selected_options}
  function getPollTallies(): { option: string; count: number; students: string[] }[] {
    const options = ((config.options as string[]) ?? []);
    const tally: Record<string, { count: number; students: string[] }> = {};
    options.forEach(o => { tally[o] = { count: 0, students: [] }; });
    for (const r of liveResponses) {
      const payload = r.response_payload;
      const name = getStudentName(r.user_id);
      if (payload.selected_option && typeof payload.selected_option === "string") {
        if (tally[payload.selected_option]) { tally[payload.selected_option].count++; tally[payload.selected_option].students.push(name); }
      }
      if (payload.selected_options && Array.isArray(payload.selected_options)) {
        for (const opt of payload.selected_options) {
          if (typeof opt === "string" && tally[opt]) { tally[opt].count++; tally[opt].students.push(name); }
        }
      }
      if (!payload.selected_option && !payload.selected_options && payload.answer) {
        if (typeof payload.answer === "string" && tally[payload.answer]) { tally[payload.answer].count++; tally[payload.answer].students.push(name); }
        if (Array.isArray(payload.answer)) payload.answer.forEach((a: string) => { if (tally[a]) { tally[a].count++; tally[a].students.push(name); } });
      }
    }
    return options.map(o => ({ option: o, count: tally[o]?.count ?? 0, students: tally[o]?.students ?? [] }));
  }

  function getPeerCompareTallies(): { option: string; count: number; students: string[] }[] | null {
    const options = ((config.options as Array<{ id: string; text: string }>) ?? []);
    if (options.length === 0) return null;

    const tally: Record<string, { count: number; students: string[] }> = {};
    options.forEach((opt) => {
      tally[opt.id] = { count: 0, students: [] };
    });

    for (const r of liveResponses) {
      const payload = r.response_payload;
      const name = getStudentName(r.user_id);
      const answer = (payload.selected_option_id ?? payload.selected_option ?? payload.answer) as string | undefined;
      if (answer && tally[answer]) {
        tally[answer].count++;
        tally[answer].students.push(name);
      }
    }

    return options.map((opt) => ({
      option: opt.text,
      count: tally[opt.id]?.count ?? 0,
      students: tally[opt.id]?.students ?? [],
    }));
  }

  // Aggregate MCQ results
  function getMcqTallies(): { option: string; count: number; students: string[] }[] {
    const options = ((config.options as Array<{ id: string; text: string }>) ?? []);
    const tally: Record<string, { count: number; students: string[] }> = {};
    options.forEach(o => { tally[o.id] = { count: 0, students: [] }; });
    for (const r of liveResponses) {
      const payload = r.response_payload;
      const name = getStudentName(r.user_id);
      const ans = (payload.selected_option_id ?? payload.selected_option ?? payload.answer) as string;
      if (ans && tally[ans]) { tally[ans].count++; tally[ans].students.push(name); }
    }
    return options.map(o => ({ option: o.text, count: tally[o.id]?.count ?? 0, students: tally[o.id]?.students ?? [] }));
  }

  // Get text responses - handles various payload shapes
  function getTextResponses(): { text: string; userId: string }[] {
    return liveResponses
      .map(r => {
        const p = r.response_payload;
        const text = (p.text ?? p.answer ?? p.argument ?? p.post ?? p.feedback ?? p.review ?? p.counter_argument ?? "") as string;
        return { text, userId: r.user_id };
      })
      .filter(r => r.text.length > 0);
  }

  // Get scenario responses with choice info
  function getScenarioResponses(): { choiceId: string; userId: string }[] {
    return liveResponses.map(r => ({
      choiceId: (r.response_payload.selected_choice_id ?? "") as string,
      userId: r.user_id,
    })).filter(r => r.choiceId.length > 0);
  }

  function getScenarioTallies(): { choice: string; count: number; students: string[] }[] {
    const choices = ((config.choices as Array<{ id: string; text: string }>) ?? []);
    const tally: Record<string, { count: number; students: string[] }> = {};
    choices.forEach(c => { tally[c.id] = { count: 0, students: [] }; });
    for (const r of getScenarioResponses()) {
      if (tally[r.choiceId]) {
        tally[r.choiceId].count++;
        tally[r.choiceId].students.push(getStudentName(r.userId));
      }
    }
    return choices.map(c => ({ choice: c.text, count: tally[c.id]?.count ?? 0, students: tally[c.id]?.students ?? [] }));
  }

  // Get collaborative board posts
  function getBoardPosts(): { text: string; userId: string }[] {
    const posts: { text: string; userId: string }[] = [];
    for (const r of liveResponses) {
      const p = r.response_payload;
      if (Array.isArray(p.posts)) {
        for (const post of p.posts) {
          posts.push({ text: String(post), userId: r.user_id });
        }
      } else if (p.text || p.post) {
        posts.push({ text: String(p.text ?? p.post ?? ""), userId: r.user_id });
      }
    }
    return posts.filter(p => p.text.length > 0);
  }

  // Get drag-drop category aggregation: for each item, what % placed it in each category
  function getDragDropAggregation(): { categories: string[]; items: { id: string; text: string; correct_category: string; distribution: Record<string, number> }[] } {
    const categories = (config.categories as string[]) ?? [];
    const items = (config.items as Array<{ id: string; text: string; correct_category: string }>) ?? [];
    const totalResponses = liveResponses.length || 1;
    
    const result = items.map(item => {
      const dist: Record<string, number> = {};
      categories.forEach(cat => { dist[cat] = 0; });
      for (const r of liveResponses) {
        const placements = (r.response_payload.placements ?? r.response_payload.answer ?? {}) as Record<string, string>;
        const placed = placements[item.id];
        if (placed && dist[placed] !== undefined) {
          dist[placed]++;
        }
      }
      // Convert to percentages
      const pctDist: Record<string, number> = {};
      categories.forEach(cat => { pctDist[cat] = Math.round((dist[cat] / totalResponses) * 100); });
      return { id: item.id, text: item.text, correct_category: item.correct_category, distribution: pctDist };
    });
    return { categories, items: result };
  }

  function handleRevealResults() {
    setShowResults(true);
    const bt = step?.block_type ?? "";
    const peerCompareTallies = bt === "peer_compare" ? getPeerCompareTallies() : null;
    const includeTextResponses = ["short_answer", "reasoning_response", "exit_ticket", "debate", "red_team", "group_challenge", "peer_review"].includes(bt)
      || (bt === "peer_compare" && !peerCompareTallies);

    broadcast("reveal_results", {
      block_id: step?.id,
      tallies: (bt === "poll" || bt === "multi_select") ? getPollTallies() : undefined,
      mcq_tallies: (bt === "micro_challenge" || bt === "mcq") ? getMcqTallies() : undefined,
      peer_compare_tallies: bt === "peer_compare" ? peerCompareTallies ?? undefined : undefined,
      text_responses: includeTextResponses
        ? getTextResponses().slice(0, 30).map(r => r.text)
        : undefined,
      scenario_tallies: bt === "scenario" ? getScenarioTallies() : undefined,
      board_posts: (bt === "collaborative_board" || bt === "group_board") ? getBoardPosts().map(p => p.text) : undefined,
      drag_drop_aggregation: bt === "drag_drop" ? getDragDropAggregation() : undefined,
      response_count: liveResponses.length,
    });
  }

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
          <button
            onClick={() => {
              const url = `${window.location.origin}/live/projector?session=${sessionId}`;
              window.open(url, "projector", "noopener");
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            title="Open Projector View"
          >
            <Monitor className="w-4 h-4" /> Present
          </button>
          <button onClick={() => setShowNotesPanel(n => !n)} className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${showNotesPanel ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} title="Speaker Notes">
            <StickyNote className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4 text-muted-foreground" /> : <Maximize className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button onClick={() => setShowEndModal(true)} className="px-3 py-1.5 border border-destructive/30 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive/5 transition-colors">
            End
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary shrink-0">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Main presentation area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {step && (
            <div className="w-full max-w-4xl space-y-6 animate-in fade-in duration-500">
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

              {step.body && (
                <p className="text-xl text-muted-foreground leading-relaxed">{step.body}</p>
              )}

              {(step.block_type as string) === "video" && videoHasCheckpoints(config) && (
                <VideoCheckpointStep
                  config={config as unknown as VideoCheckpointConfig}
                  body={step.body}
                  onComplete={() => {}}
                />
              )}
              {(step.block_type as string) === "video" && !videoHasCheckpoints(config) && (
                <div className="rounded-2xl overflow-hidden border border-border bg-card aspect-video">
                  {config.video_url ? (
                    <VideoEmbed url={config.video_url as string} />
                  ) : config.youtube_url ? (
                    <VideoEmbed url={config.youtube_url as string} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center space-y-3">
                      <div>
                        <span className="text-6xl">🎬</span>
                        <p className="text-muted-foreground font-medium mt-2">Video content</p>
                      </div>
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
                  {showResults ? (
                    <div className="space-y-3">
                      {getMcqTallies().map((t, i) => {
                        const maxCount = Math.max(...getMcqTallies().map(x => x.count), 1);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                                {t.option}
                              </span>
                              <span className="font-bold text-foreground">{t.count}</span>
                            </div>
                            <div className="h-8 bg-secondary rounded-xl overflow-hidden">
                              <div className="h-full bg-primary/80 rounded-xl transition-all duration-700 ease-out flex items-center justify-end pr-3"
                                style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }}>
                              </div>
                            </div>
                            {t.students.length > 0 && (
                              <p className="text-xs text-muted-foreground pl-9">{t.students.join(", ")}</p>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <>
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
                          📱 {liveResponses.length} of {participants.length} answered
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step.block_type === "reasoning_response" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getTextResponses().map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                          <p className="text-sm text-foreground">{r.text}</p>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      ✍️ {liveResponses.length} of {participants.length} writing
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "peer_compare" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                  {showResults ? (
                    (() => {
                      const peerCompareTallies = getPeerCompareTallies();
                      const textResponses = getTextResponses();

                      if (peerCompareTallies && peerCompareTallies.length > 0) {
                        const maxCount = Math.max(...peerCompareTallies.map((x) => x.count), 1);
                        return (
                          <div className="space-y-3">
                            {peerCompareTallies.map((t, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-foreground flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                                    {t.option}
                                  </span>
                                  <span className="font-bold text-foreground">{t.count}</span>
                                </div>
                                <div className="h-8 bg-secondary rounded-xl overflow-hidden">
                                  <div
                                    className="h-full bg-primary/80 rounded-xl transition-all duration-700 ease-out"
                                    style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }}
                                  />
                                </div>
                                {t.students.length > 0 && (
                                  <p className="text-xs text-muted-foreground pl-9">{t.students.join(", ")}</p>
                                )}
                              </div>
                            ))}
                            <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {textResponses.length > 0 ? textResponses.map((r, i) => (
                            <div key={i} className="rounded-xl border border-border bg-card p-4">
                              <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                              <p className="text-sm text-foreground">{r.text}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No responses yet.</p>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <>
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
                          👥 {liveResponses.length} of {participants.length} shared
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(step.block_type === "poll" || step.block_type === "multi_select") && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{step.body ?? "Vote below"}</p>
                  {showResults ? (
                    <div className="space-y-3">
                      {getPollTallies().map((t, i) => {
                        const maxCount = Math.max(...getPollTallies().map(x => x.count), 1);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                                {t.option}
                              </span>
                              <span className="font-bold text-foreground">{t.count}</span>
                            </div>
                            <div className="h-8 bg-secondary rounded-xl overflow-hidden">
                              <div className="h-full bg-primary/80 rounded-xl transition-all duration-700 ease-out"
                                style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }}>
                              </div>
                            </div>
                            {t.students.length > 0 && (
                              <p className="text-xs text-muted-foreground pl-9">{t.students.join(", ")}</p>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} vote{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {(((config.options as string[]) ?? []).map((opt: string, i: number) => (
                          <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 flex items-center gap-3 hover:border-primary/30 transition-colors">
                            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-foreground font-medium">{opt}</span>
                          </div>
                        )))}
                      </div>
                      <div className="flex items-center gap-2 justify-center pt-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                          📊 {liveResponses.length} of {participants.length} voted
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step.block_type === "short_answer" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? ""}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getTextResponses().map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                          <p className="text-sm text-foreground">{r.text}</p>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      ✍️ {liveResponses.length} of {participants.length} typing
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "exit_ticket" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.question ?? config.prompt ?? step.body ?? "Exit Ticket") as string}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getTextResponses().map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                          <p className="text-sm text-foreground">{r.text}</p>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🎫 {liveResponses.length} of {participants.length} submitted
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "scenario" && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-lg text-foreground">{(config.description as string) ?? ""}</p>
                  </div>
                  {showResults ? (
                    <div className="space-y-3">
                      {getScenarioTallies().map((t, i) => {
                        const maxCount = Math.max(...getScenarioTallies().map(x => x.count), 1);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{t.choice}</span>
                              <span className="font-bold text-foreground">{t.count}</span>
                            </div>
                            <div className="h-8 bg-secondary rounded-xl overflow-hidden">
                              <div className="h-full bg-primary/80 rounded-xl transition-all duration-700 ease-out"
                                style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }} />
                            </div>
                            {t.students.length > 0 && (
                              <p className="text-xs text-muted-foreground pl-1">{t.students.join(", ")}</p>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {((config.choices as Array<{ id: string; text: string }>) ?? []).map((c, i) => (
                          <div key={c.id} className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-foreground font-medium">{c.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 justify-center pt-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                          🎭 {liveResponses.length} of {participants.length} chose
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(step.block_type === "debate") && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? ""}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-primary font-bold">{getStudentName(r.user_id)}</span>
                              {p.position ? <span className="text-xs font-bold text-muted-foreground uppercase bg-secondary px-2 py-0.5 rounded">{String(p.position)}</span> : null}
                            </div>
                            <p className="text-sm text-foreground">{String(p.argument ?? p.text ?? "")}</p>
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      ⚖️ {liveResponses.length} of {participants.length} debating
                    </span>
                  )}
                </div>
              )}

              {(step.block_type === "collaborative_board" || step.block_type === "group_board") && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Share your ideas"}</p>
                  {showResults ? (
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {getBoardPosts().map((post, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(post.userId)}</p>
                          <p className="text-sm text-foreground">{post.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      📝 {liveResponses.length} of {participants.length} posted
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "dilemma_tree" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.root_question as string) ?? ""}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.user_id)}</p>
                            <p className="text-sm text-foreground">Path: {Array.isArray(p.path) ? (p.path as string[]).join(" → ") : "—"}</p>
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🌳 {liveResponses.length} of {participants.length} exploring
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "drag_drop" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.instructions as string) ?? step.body ?? "Sort the items"}</p>
                  {showResults ? (
                    <div className="space-y-4">
                      {(() => {
                        const agg = getDragDropAggregation();
                        const catColors = ["bg-primary/70", "bg-blue-500/70", "bg-amber-500/70", "bg-emerald-500/70", "bg-rose-500/70", "bg-violet-500/70"];
                        return (
                          <>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {agg.categories.map((cat, ci) => (
                                <span key={cat} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                  <span className={`w-3 h-3 rounded-sm ${catColors[ci % catColors.length]}`} />
                                  {cat}
                                </span>
                              ))}
                            </div>
                            {agg.items.map((item) => (
                              <div key={item.id} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-foreground">{item.text}</span>
                                  <span className="text-xs text-muted-foreground">Correct: {item.correct_category}</span>
                                </div>
                                <div className="h-7 bg-secondary rounded-lg overflow-hidden flex">
                                  {agg.categories.map((cat, ci) => {
                                    const pct = item.distribution[cat] || 0;
                                    if (pct === 0) return null;
                                    const isCorrect = cat === item.correct_category;
                                    return (
                                      <div
                                        key={cat}
                                        className={`h-full ${catColors[ci % catColors.length]} ${isCorrect ? "ring-2 ring-success ring-inset" : ""} flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700`}
                                        style={{ width: `${pct}%` }}
                                        title={`${cat}: ${pct}%`}
                                      >
                                        {pct >= 15 ? `${pct}%` : ""}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🎯 {liveResponses.length} of {participants.length} sorting
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "matching" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Matching"}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        const matches = p.matches ?? p.answer ?? {};
                        const correct = p.correct_count as number | undefined;
                        const total = p.total_count as number | undefined;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-primary font-bold">{getStudentName(r.user_id)}</span>
                              {correct !== undefined && total !== undefined && (
                                <span className="text-xs font-bold text-success">{correct}/{total} correct</span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{typeof matches === "object" ? Object.entries(matches as Record<string, string>).map(([k, v]) => `${k} → ${v}`).join(", ") : String(matches)}</p>
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🔗 {liveResponses.length} of {participants.length} matching
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "drawing" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Drawing"}</p>
                  {showResults ? (
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        const dataUrl = (p.drawing_data ?? p.image ?? p.data_url ?? "") as string;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-3">
                            <p className="text-xs text-primary font-bold mb-2">{getStudentName(r.user_id)}</p>
                            {dataUrl && dataUrl.startsWith("data:") ? (
                              <img src={dataUrl} alt="Student drawing" className="w-full rounded-lg" />
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Drawing submitted</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🎨 {liveResponses.length} of {participants.length} drawing
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "red_team" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.claim as string) ?? (config.prompt as string) ?? step.body ?? "Red Team Challenge"}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.user_id)}</p>
                            <p className="text-sm text-foreground">{String(p.counter_argument ?? p.argument ?? p.text ?? "")}</p>
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🔴 {liveResponses.length} of {participants.length} challenging
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "group_challenge" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.challenge as string) ?? (config.prompt as string) ?? step.body ?? "Group Challenge"}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getTextResponses().map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                          <p className="text-sm text-foreground">{r.text}</p>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      🏆 {liveResponses.length} of {participants.length} collaborating
                    </span>
                  )}
                </div>
              )}

              {step.block_type === "peer_review" && (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Peer Review"}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {liveResponses.map((r, i) => {
                        const p = r.response_payload as Record<string, unknown>;
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.user_id)}</p>
                            {p.rating ? <p className="text-xs text-muted-foreground mb-1">Rating: {String("⭐").repeat(Math.min(Number(p.rating) || 0, 5))}</p> : null}
                            <p className="text-sm text-foreground">{String(p.feedback ?? p.text ?? p.review ?? "")}</p>
                          </div>
                        );
                      })}
                      <p className="text-sm text-muted-foreground text-center pt-2">{liveResponses.length} review{liveResponses.length !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      📖 {liveResponses.length} of {participants.length} reviewing
                    </span>
                  )}
                </div>
              )}

              {!["video", "concept_reveal", "micro_challenge", "mcq", "reasoning_response", "peer_compare", "poll", "multi_select", "short_answer", "exit_ticket", "debate", "collaborative_board", "group_board", "scenario", "dilemma_tree", "drag_drop", "matching", "drawing", "red_team", "group_challenge", "peer_review"].includes(step.block_type) && (
                <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
                  <span className="text-5xl">{getBlockIcon(step.block_type)}</span>
                  <p className="text-lg font-medium text-foreground capitalize">{step.block_type.replace(/_/g, " ")}</p>
                  {showResults ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto text-left">
                      {getTextResponses().map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs text-primary font-bold mb-1">{getStudentName(r.userId)}</p>
                          <p className="text-sm text-foreground">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                      📱 {liveResponses.length} of {participants.length} responded
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {timerRunning && timerSeconds !== null && (
            <div className="absolute top-4 right-4 bg-card border border-border rounded-2xl shadow-lg p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Timer</p>
              <p className="text-3xl font-bold text-foreground tabular-nums mt-1">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
              </p>
            </div>
          )}

          {/* Speaker Notes Panel */}
          {showNotesPanel && (
            <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Speaker Notes
                </span>
                <span className="text-[10px] text-muted-foreground">Only visible to you</span>
              </div>
              <textarea
                value={speakerNotes}
                onChange={(e) => setSpeakerNotes(e.target.value)}
                placeholder="Add your speaker notes here… (only you can see these)"
                className="w-full h-24 bg-secondary/50 border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
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
            {isInteractive && (
              <button
                onClick={handleRevealResults}
                disabled={showResults || liveResponses.length === 0}
                className={`w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  showResults
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                } disabled:opacity-40`}
              >
                <BarChart3 className="w-4 h-4" />
                {showResults ? "Results Shown" : `Show Results (${liveResponses.length})`}
              </button>
            )}
          </div>

          {/* Response details sidebar */}
          {isInteractive && liveResponses.length > 0 && (
            <div className="p-3 border-b border-border max-h-64 overflow-y-auto">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                Responses ({liveResponses.length})
              </p>
              <div className="space-y-1">
                {liveResponses.slice(0, 50).map((r) => {
                  const p = r.response_payload;
                  const preview = String(
                    p.selected_option_id ?? p.selected_option ?? p.answer ?? p.text ?? p.argument ?? p.selected_choice_id ?? p.emoji ?? "✓"
                  ).slice(0, 40);
                  return (
                    <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/50 text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[80px]">
                        {getStudentName(r.user_id)}
                      </span>
                      <span className="text-muted-foreground truncate flex-1">{preview}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Steps</p>
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentStep(i); broadcast("goto_block", { step_index: i }); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                  i === currentStep ? "bg-primary/10 text-primary" : i < currentStep ? "text-muted-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                <span>{getBlockIcon(s.block_type)}</span>
                <span className="truncate">{s.title ?? `Step ${i + 1}`}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-4 h-4" /> Joined</span>
              <span className="font-bold text-foreground">{participants.length}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full mx-4 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">End Session?</h2>
              <p className="text-sm text-muted-foreground">
                {collectData
                  ? `${responseCount} responses have been collected. You can review them anytime from Past Sessions.`
                  : "This session will be marked as ended."}
              </p>
            </div>
            <div className="space-y-3">
              {collectData && (
                <button
                  onClick={() => handleEndSession(true)}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  End & Review Responses
                </button>
              )}
              <button
                onClick={() => handleEndSession(false)}
                className="w-full px-6 py-3 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                End Session
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="w-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
