import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StepRunner from "../components/steps/StepRunner";
import type { StepBlock, Hint } from "../components/steps/types";

type LiveEvent = {
  event_type: string;
  event_payload: Record<string, unknown>;
  created_at: string;
};

export default function StudentLiveView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [steps, setSteps] = useState<StepBlock[]>([]);
  const [lessonTitle, setLessonTitle] = useState("Live Session");
  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`live-events-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_session_events", filter: `live_session_id=eq.${sessionId}` },
        (payload) => {
          const evt = payload.new as LiveEvent;
          handleEvent(evt);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, steps.length]);

  function handleEvent(evt: LiveEvent) {
    switch (evt.event_type) {
      case "next_block":
        setActiveIndex((i) => Math.min(i + 1, Math.max(steps.length - 1, 0)));
        setLocked(false);
        break;
      case "previous_block":
        setActiveIndex((i) => Math.max(i - 1, 0));
        setLocked(false);
        break;
      case "lock":
        setLocked(true);
        break;
      case "unlock":
        setLocked(false);
        break;
    }
  }

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

    const { data: blocks } = await supabase
      .from("lesson_blocks")
      .select("id, sequence_no, block_type, title, body, config, hints, is_gate, mastery_rules")
      .eq("lesson_version_id", session.lesson_version_id)
      .order("sequence_no", { ascending: true });

    if (blocks) {
      setSteps(
        blocks.map((b) => ({
          id: b.id,
          sequence_no: b.sequence_no,
          block_type: b.block_type as StepBlock["block_type"],
          title: b.title,
          body: b.body,
          config: (b.config ?? {}) as Record<string, unknown>,
          hints: (b.hints ?? []) as unknown as Hint[],
          is_gate: b.is_gate,
          mastery_rules: (b.mastery_rules ?? {}) as Record<string, unknown>,
        }))
      );
    }

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

    const { data: events } = await supabase
      .from("live_session_events")
      .select("event_type, event_payload, created_at")
      .eq("live_session_id", sessionId)
      .order("created_at", { ascending: true });

    if (events && blocks) {
      let idx = 0;
      for (const evt of events) {
        if (evt.event_type === "next_block") idx = Math.min(idx + 1, blocks.length - 1);
        else if (evt.event_type === "previous_block") idx = Math.max(idx - 1, 0);
        else if (evt.event_type === "lock") setLocked(true);
        else if (evt.event_type === "unlock") setLocked(false);
      }
      setActiveIndex(idx);
    }

    setLoading(false);
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No session ID provided.</p>
          <button onClick={() => navigate("/join")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
            Join a Session
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Connecting to session…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-success animate-pulse" />
            <span className="text-sm font-semibold text-foreground">{lessonTitle}</span>
          </div>
        </div>
        {locked && (
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-destructive/10 text-destructive">
            Responses Locked
          </span>
        )}
      </div>

      <div className="flex-1 py-8 overflow-y-auto">
        {steps.length > 0 ? (
          <StepRunner
            steps={steps}
            lessonTitle={lessonTitle}
            controlledIndex={activeIndex}
            isLive
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for the teacher to start the lesson…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card px-6 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Step {activeIndex + 1} of {steps.length} · {locked ? "🔒 Locked" : "✏️ You can respond"}
        </p>
      </div>
    </div>
  );
}
