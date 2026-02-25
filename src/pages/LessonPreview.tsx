import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StepRunner from "../components/steps/StepRunner";
import type { StepBlock, StepResponse, Hint } from "../components/steps/types";

export default function LessonPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [steps, setSteps] = useState<StepBlock[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLesson() {
      const versionId = searchParams.get("versionId");

      if (versionId) {
        // Load specific version by ID
        const { data: version, error: vErr } = await supabase
          .from("lesson_versions")
          .select("id, lesson_id, lessons!inner(title)")
          .eq("id", versionId)
          .single();

        if (vErr || !version) {
          setError("Lesson version not found.");
          setLoading(false);
          return;
        }

        const lesson = version.lessons as unknown as { title: string };
        setLessonTitle(lesson.title);

        const { data: bData } = await supabase
          .from("lesson_blocks")
          .select("id, sequence_no, block_type, title, body, config, hints, is_gate, mastery_rules")
          .eq("lesson_version_id", version.id)
          .order("sequence_no", { ascending: true });

        if (!bData || bData.length === 0) {
          setError("No blocks in this lesson version.");
          setLoading(false);
          return;
        }

        setSteps(bData.map((b) => ({
          id: b.id,
          sequence_no: b.sequence_no,
          block_type: b.block_type as StepBlock["block_type"],
          title: b.title,
          body: b.body,
          config: (b.config ?? {}) as Record<string, unknown>,
          hints: (b.hints ?? []) as unknown as Hint[],
          is_gate: b.is_gate,
          mastery_rules: (b.mastery_rules ?? {}) as Record<string, unknown>,
        })));
        setLoading(false);
        return;
      }

      // Fallback: find latest published lesson with interactive blocks
      const { data: versions, error: vErr2 } = await supabase
        .from("lesson_versions")
        .select("id, lesson_id, lessons!inner(title)")
        .eq("publish_status", "published")
        .order("published_at", { ascending: false })
        .limit(10);

      if (vErr2 || !versions?.length) {
        setError("No published lessons found.");
        setLoading(false);
        return;
      }

      let chosenVersion: (typeof versions)[0] | null = null;
      let blocks: StepBlock[] = [];

      for (const v of versions) {
        const { data: bData } = await supabase
          .from("lesson_blocks")
          .select("id, sequence_no, block_type, title, body, config, hints, is_gate, mastery_rules")
          .eq("lesson_version_id", v.id)
          .in("block_type", ["concept_reveal", "micro_challenge", "reasoning_response", "peer_compare"])
          .order("sequence_no", { ascending: true });

        if (bData && bData.length > 0) {
          chosenVersion = v;
          blocks = bData.map((b) => ({
            id: b.id,
            sequence_no: b.sequence_no,
            block_type: b.block_type as StepBlock["block_type"],
            title: b.title,
            body: b.body,
            config: (b.config ?? {}) as Record<string, unknown>,
            hints: (b.hints ?? []) as unknown as Hint[],
            is_gate: b.is_gate,
            mastery_rules: (b.mastery_rules ?? {}) as Record<string, unknown>,
          }));
          break;
        }
      }

      if (!chosenVersion || blocks.length === 0) {
        setError("No interactive lesson blocks found.");
        setLoading(false);
        return;
      }

      const lesson = chosenVersion.lessons as unknown as { title: string };
      setLessonTitle(lesson.title);
      setSteps(blocks);
      setLoading(false);
    }

    loadLesson();
  }, [searchParams]);

  const handleStepComplete = useCallback((stepId: string, response: StepResponse) => {
    console.log("Step completed:", stepId, response);
  }, []);

  const handleLessonComplete = useCallback(() => {
    console.log("Lesson complete!");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">Loading lesson…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Lesson Preview</span>
        </div>
      </div>
      <div className="py-8">
        <StepRunner
          steps={steps}
          lessonTitle={lessonTitle}
          onStepComplete={handleStepComplete}
          onLessonComplete={handleLessonComplete}
        />
      </div>
    </div>
  );
}
