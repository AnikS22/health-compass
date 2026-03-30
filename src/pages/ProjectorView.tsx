import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { StepBlock, Hint } from "../components/steps/types";
import VideoEmbed from "@/components/VideoEmbed";
import type { VideoCheckpointConfig } from "@/components/steps/VideoCheckpointStep";

type Participant = { id: string; display_name: string; joined_at: string; user_id?: string };
type LiveResponse = { id: string; user_id: string; response_payload: Record<string, unknown>; submitted_at: string };

// Broadcast message type
type PresenterMessage = {
  type: "sync_state";
  currentStep: number;
  showResults: boolean;
  locked: boolean;
  timerSeconds: number | null;
  timerRunning: boolean;
  liveSlideIndex?: number;
};

function getBlockIcon(type: string) {
  switch (type) {
    case "video": return "🎬"; case "concept_reveal": return "💡"; case "micro_challenge": return "🧩";
    case "reasoning_response": return "✍️"; case "peer_compare": return "👥"; case "poll": return "📊";
    case "scenario": return "🎭"; case "debate": return "⚖️"; case "exit_ticket": return "🎫";
    case "dilemma_tree": return "🌳"; case "collaborative_board": case "group_board": return "📋";
    case "short_answer": return "📝"; case "drag_drop": return "🎯"; case "matching": return "🔗";
    case "drawing": return "🎨"; case "red_team": return "🔴"; case "group_challenge": return "🏆";
    case "peer_review": return "📖"; case "slides": return "📑"; default: return "📝";
  }
}

function videoHasCheckpoints(config: Record<string, unknown>): boolean {
  return Array.isArray(config.checkpoints) && config.checkpoints.length > 0;
}

export default function ProjectorView() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [steps, setSteps] = useState<StepBlock[]>([]);
  const [lessonTitle, setLessonTitle] = useState("Live Session");
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [liveResponses, setLiveResponses] = useState<LiveResponse[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [liveSlideIndex, setLiveSlideIndex] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Listen for sync messages from teacher window
  useEffect(() => {
    if (!sessionId) return;
    const bc = new BroadcastChannel(`presenter-${sessionId}`);
    channelRef.current = bc;

    bc.onmessage = (event) => {
      const msg = event.data as PresenterMessage;
      if (msg.type === "sync_state") {
        setCurrentStep(msg.currentStep);
        setShowResults(msg.showResults);
        setLocked(msg.locked);
        setTimerSeconds(msg.timerSeconds);
        setTimerRunning(msg.timerRunning);
        if (typeof msg.liveSlideIndex === "number") setLiveSlideIndex(msg.liveSlideIndex);
      }
    };

    // Tell teacher window we're ready
    bc.postMessage({ type: "projector_ready" });

    return () => bc.close();
  }, [sessionId]);

  // Load session data
  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

  // Poll for responses & participants
  useEffect(() => {
    if (!sessionId || !steps[currentStep]) return;
    const blockId = steps[currentStep].id;
    let mounted = true;

    async function fetchData() {
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
          .is("left_at", null),
      ]);
      if (!mounted) return;
      if (respResult.data) setLiveResponses(respResult.data as unknown as LiveResponse[]);
      if (partResult.data) {
        setParticipants(partResult.data as Participant[]);
        const nameMap: Record<string, string> = {};
        (partResult.data as any[]).forEach((p) => { if (p.user_id) nameMap[p.user_id] = p.display_name; });
        setParticipantNames(nameMap);
      }
    }

    void fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => { mounted = false; clearInterval(timer); };
  }, [sessionId, currentStep, steps]);

  async function loadSession() {
    if (!sessionId) return;
    const { data: session } = await supabase.from("live_sessions").select("id, session_code, lesson_version_id").eq("id", sessionId).single();
    if (!session) { setLoading(false); return; }

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
    setLoading(false);
  }

  // ---------- HELPER FUNCTIONS ----------
  function getStudentName(userId: string): string {
    return participantNames[userId] || "Student";
  }

  function getPollTallies(): { option: string; count: number; students: string[] }[] {
    const config = (step?.config ?? {}) as Record<string, unknown>;
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

  function getMcqTallies(): { option: string; count: number; students: string[] }[] {
    const config = (step?.config ?? {}) as Record<string, unknown>;
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

  function getTextResponses(): { text: string; userId: string }[] {
    return liveResponses
      .map(r => {
        const p = r.response_payload;
        const text = (p.text ?? p.answer ?? p.argument ?? p.post ?? p.feedback ?? p.review ?? p.counter_argument ?? "") as string;
        return { text, userId: r.user_id };
      })
      .filter(r => r.text.length > 0);
  }

  function getScenarioTallies(): { choice: string; count: number; students: string[] }[] {
    const config = (step?.config ?? {}) as Record<string, unknown>;
    const choices = ((config.choices as Array<{ id: string; text: string }>) ?? []);
    const tally: Record<string, { count: number; students: string[] }> = {};
    choices.forEach(c => { tally[c.id] = { count: 0, students: [] }; });
    for (const r of liveResponses) {
      const choiceId = (r.response_payload.selected_choice_id ?? "") as string;
      if (choiceId && tally[choiceId]) {
        tally[choiceId].count++;
        tally[choiceId].students.push(getStudentName(r.user_id));
      }
    }
    return choices.map(c => ({ choice: c.text, count: tally[c.id]?.count ?? 0, students: tally[c.id]?.students ?? [] }));
  }

  function getBoardPosts(): { text: string; userId: string }[] {
    const posts: { text: string; userId: string }[] = [];
    for (const r of liveResponses) {
      const p = r.response_payload;
      if (Array.isArray(p.posts)) {
        for (const post of p.posts) posts.push({ text: String(post), userId: r.user_id });
      } else if (p.text || p.post) {
        posts.push({ text: String(p.text ?? p.post ?? ""), userId: r.user_id });
      }
    }
    return posts.filter(p => p.text.length > 0);
  }

  function getDragDropAggregation() {
    const config = (step?.config ?? {}) as Record<string, unknown>;
    const categories = (config.categories as string[]) ?? [];
    const items = (config.items as Array<{ id: string; text: string; correct_category: string }>) ?? [];
    const totalResponses = liveResponses.length || 1;
    const result = items.map(item => {
      const dist: Record<string, number> = {};
      categories.forEach(cat => { dist[cat] = 0; });
      for (const r of liveResponses) {
        const placements = (r.response_payload.placements ?? r.response_payload.answer ?? {}) as Record<string, string>;
        const placed = placements[item.id];
        if (placed && dist[placed] !== undefined) dist[placed]++;
      }
      const pctDist: Record<string, number> = {};
      categories.forEach(cat => { pctDist[cat] = Math.round((dist[cat] / totalResponses) * 100); });
      return { id: item.id, text: item.text, correct_category: item.correct_category, distribution: pctDist };
    });
    return { categories, items: result };
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-muted-foreground text-lg">No session specified.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-pulse text-muted-foreground text-lg">Loading presentation…</div>
      </div>
    );
  }

  const step = steps[currentStep];
  const config = (step?.config ?? {}) as Record<string, unknown>;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden select-none cursor-default">
      {/* Thin progress bar */}
      <div className="h-1 bg-muted shrink-0">
        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        {step && (
          <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-700">
            {/* Step badge + title */}
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getBlockIcon(step.block_type)}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {currentStep + 1} / {steps.length}
                </span>
                {step.title && (
                  <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">{step.title}</h1>
                )}
              </div>
            </div>

            {/* Body text */}
            {step.body && (
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">{step.body}</p>
            )}

            {/* VIDEO */}
            {(step.block_type as string) === "video" && (
              <div className="rounded-2xl overflow-hidden border border-border aspect-video max-w-4xl mx-auto">
                {config.video_url ? (
                  <VideoEmbed url={config.video_url as string} />
                ) : config.youtube_url ? (
                  <VideoEmbed url={config.youtube_url as string} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>
            )}

            {/* CONCEPT REVEAL */}
            {step.block_type === "concept_reveal" && (
              <div className="rounded-3xl border-2 border-primary/30 bg-primary/10 p-10">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-4xl">💡</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">{String(config.key_idea ?? "")}</h2>
                    {config.detail != null && <p className="text-xl text-muted-foreground mt-3">{String(config.detail)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* MCQ / MICRO CHALLENGE */}
            {(step.block_type === "micro_challenge" || (step.block_type as string) === "mcq") && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.question as string) ?? ""}</p>
                {showResults ? (
                  <div className="space-y-4">
                    {getMcqTallies().map((t, i) => {
                      const maxCount = Math.max(...getMcqTallies().map(x => x.count), 1);
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold text-lg flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">{String.fromCharCode(65 + i)}</span>
                              {t.option}
                            </span>
                            <span className="text-2xl font-extrabold text-foreground">{t.count}</span>
                          </div>
                          <div className="h-10 bg-muted rounded-xl overflow-hidden">
                            <div className="h-full bg-primary rounded-xl transition-all duration-1000 ease-out" style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {((config.options as Array<{ id: string; text: string }>) ?? []).map((opt, i) => (
                      <div key={opt.id} className="rounded-2xl border-2 border-border bg-muted/50 p-6 flex items-center gap-4">
                        <span className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground font-medium text-lg">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POLL / MULTI_SELECT */}
            {(step.block_type === "poll" || step.block_type === "multi_select") && (
              <div className="space-y-6">
                {showResults ? (
                  <div className="space-y-4">
                    {getPollTallies().map((t, i) => {
                      const maxCount = Math.max(...getPollTallies().map(x => x.count), 1);
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold text-lg flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">{String.fromCharCode(65 + i)}</span>
                              {t.option}
                            </span>
                            <span className="text-2xl font-extrabold text-foreground">{t.count}</span>
                          </div>
                          <div className="h-10 bg-muted rounded-xl overflow-hidden">
                            <div className="h-full bg-primary rounded-xl transition-all duration-1000 ease-out" style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-muted-foreground text-center pt-2">{liveResponses.length} response{liveResponses.length !== 1 ? "s" : ""}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {((config.options as string[]) ?? []).map((opt, i) => (
                      <div key={i} className="rounded-2xl border-2 border-border bg-muted/50 p-6 flex items-center gap-4">
                        <span className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground font-medium text-lg">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REASONING RESPONSE / SHORT ANSWER / EXIT TICKET */}
            {["reasoning_response", "short_answer", "exit_ticket"].includes(step.block_type) && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {getTextResponses().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                        <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.userId)}</p>
                        <p className="text-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      ✍️ {liveResponses.length} of {participants.length} writing…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* PEER COMPARE */}
            {step.block_type === "peer_compare" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.prompt as string) ?? ""}</p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {getTextResponses().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                        <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.userId)}</p>
                        <p className="text-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      👥 {liveResponses.length} of {participants.length} sharing…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SCENARIO */}
            {step.block_type === "scenario" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.scenario_text as string) ?? step.body ?? ""}</p>
                {showResults ? (
                  <div className="space-y-4">
                    {getScenarioTallies().map((t, i) => {
                      const maxCount = Math.max(...getScenarioTallies().map(x => x.count), 1);
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold text-lg">{t.choice}</span>
                            <span className="text-2xl font-extrabold text-foreground">{t.count}</span>
                          </div>
                          <div className="h-10 bg-muted rounded-xl overflow-hidden">
                            <div className="h-full bg-primary rounded-xl transition-all duration-1000 ease-out" style={{ width: `${Math.max((t.count / maxCount) * 100, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {((config.choices as Array<{ id: string; text: string }>) ?? []).map((c) => (
                      <div key={c.id} className="rounded-2xl border-2 border-border bg-muted/50 p-5">
                        <span className="text-foreground font-medium text-lg">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DEBATE */}
            {step.block_type === "debate" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.motion as string) ?? (config.prompt as string) ?? ""}</p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {getTextResponses().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                        <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.userId)}</p>
                        <p className="text-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      ⚖️ {liveResponses.length} of {participants.length} debating…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* COLLABORATIVE BOARD */}
            {(step.block_type === "collaborative_board" || step.block_type === "group_board") && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Share your ideas"}</p>
                {showResults ? (
                  <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                    {getBoardPosts().map((post, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-4">
                        <p className="text-xs text-primary font-bold mb-1">{getStudentName(post.userId)}</p>
                        <p className="text-foreground text-sm">{post.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      📝 {liveResponses.length} of {participants.length} posting…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DILEMMA TREE */}
            {step.block_type === "dilemma_tree" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.root_question as string) ?? ""}</p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {liveResponses.map((r, i) => {
                      const p = r.response_payload as Record<string, unknown>;
                      return (
                        <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                          <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.user_id)}</p>
                          <p className="text-foreground">Path: {Array.isArray(p.path) ? (p.path as string[]).join(" → ") : "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      🌳 {liveResponses.length} of {participants.length} exploring…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DRAG DROP */}
            {step.block_type === "drag_drop" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.instructions as string) ?? step.body ?? "Sort the items"}</p>
                {showResults ? (
                  <div className="space-y-4">
                    {(() => {
                      const agg = getDragDropAggregation();
                      const catColors = ["bg-primary/70", "bg-blue-500/70", "bg-amber-500/70", "bg-emerald-500/70", "bg-rose-500/70", "bg-violet-500/70"];
                      return (
                        <>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {agg.categories.map((cat, ci) => (
                              <span key={cat} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                <span className={`w-4 h-4 rounded ${catColors[ci % catColors.length]}`} />
                                {cat}
                              </span>
                            ))}
                          </div>
                          {agg.items.map((item) => (
                            <div key={item.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground text-lg">{item.text}</span>
                                <span className="text-sm text-muted-foreground">Correct: {item.correct_category}</span>
                              </div>
                              <div className="h-9 bg-muted rounded-xl overflow-hidden flex">
                                {agg.categories.map((cat, ci) => {
                                  const pct = item.distribution[cat] || 0;
                                  if (pct === 0) return null;
                                  return (
                                    <div key={cat}
                                      className={`h-full ${catColors[ci % catColors.length]} flex items-center justify-center text-xs font-bold text-white transition-all duration-1000`}
                                      style={{ width: `${pct}%` }}
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
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      🎯 {liveResponses.length} of {participants.length} sorting…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* RED TEAM / GROUP CHALLENGE / PEER REVIEW */}
            {["red_team", "group_challenge", "peer_review"].includes(step.block_type) && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">
                  {(config.claim as string) ?? (config.challenge as string) ?? (config.prompt as string) ?? step.body ?? ""}
                </p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {getTextResponses().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                        <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.userId)}</p>
                        <p className="text-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      {getBlockIcon(step.block_type)} {liveResponses.length} of {participants.length} working…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* MATCHING */}
            {step.block_type === "matching" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? "Match the pairs"}</p>
                {showResults ? (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {liveResponses.map((r, i) => {
                      const p = r.response_payload as Record<string, unknown>;
                      const correct = p.correct_count as number | undefined;
                      const total = p.total_count as number | undefined;
                      return (
                        <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-primary font-bold">{getStudentName(r.user_id)}</span>
                            {correct !== undefined && total !== undefined && (
                              <span className="text-sm font-bold text-emerald-400">{correct}/{total}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      🔗 {liveResponses.length} of {participants.length} matching…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DRAWING */}
            {step.block_type === "drawing" && (
              <div className="space-y-6">
                <p className="text-3xl font-bold text-foreground">{(config.prompt as string) ?? step.body ?? ""}</p>
                {showResults ? (
                  <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                    {liveResponses.map((r, i) => {
                      const p = r.response_payload as Record<string, unknown>;
                      const dataUrl = (p.drawing_data ?? p.image ?? p.data_url ?? "") as string;
                      return (
                        <div key={i} className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="text-xs text-primary font-bold mb-2">{getStudentName(r.user_id)}</p>
                          {dataUrl && dataUrl.startsWith("data:") ? (
                            <img src={dataUrl} alt="Drawing" className="w-full rounded-lg" />
                          ) : (
                            <p className="text-muted-foreground text-sm italic">Drawing submitted</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted text-foreground text-lg font-bold animate-pulse">
                      🎨 {liveResponses.length} of {participants.length} drawing…
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SLIDES */}
            {step.block_type === "slides" && (() => {
              const slideImages = (config.slide_urls ?? config.slides ?? []) as string[];
              const idx = Math.min(liveSlideIndex, Math.max(slideImages.length - 1, 0));
              return (
                <div className="space-y-4">
                  {slideImages.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden border border-border bg-muted/50 aspect-video max-w-5xl mx-auto flex items-center justify-center">
                      <img
                        src={slideImages[idx]}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16">
                      <span className="text-muted-foreground text-2xl">No slides uploaded</span>
                    </div>
                  )}
                  {slideImages.length > 1 && (
                    <p className="text-center text-muted-foreground text-lg font-medium">
                      Slide {idx + 1} of {slideImages.length}
                    </p>
                  )}
                </div>
              );
            })()}

            {!["video", "concept_reveal", "micro_challenge", "mcq", "reasoning_response", "peer_compare",
              "poll", "multi_select", "short_answer", "exit_ticket", "debate", "collaborative_board",
              "group_board", "scenario", "dilemma_tree", "drag_drop", "matching", "drawing",
              "red_team", "group_challenge", "peer_review"].includes(step.block_type) && (
              <div className="rounded-3xl border border-border bg-muted/50 p-10 text-center space-y-4">
                <span className="text-6xl">{getBlockIcon(step.block_type)}</span>
                <p className="text-2xl font-medium text-foreground capitalize">{step.block_type.replace(/_/g, " ")}</p>
                {showResults && getTextResponses().length > 0 && (
                  <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto text-left mt-4">
                    {getTextResponses().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-muted/50 p-5">
                        <p className="text-sm text-primary font-bold mb-2">{getStudentName(r.userId)}</p>
                        <p className="text-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">{lessonTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          {locked && (
            <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
              🔒 Locked
            </span>
          )}
          <span className="text-muted-foreground text-sm flex items-center gap-1.5">
            👥 {participants.length} students
          </span>
          {timerRunning && timerSeconds !== null && (
            <span className="text-foreground font-mono text-lg font-bold tabular-nums">
              ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
