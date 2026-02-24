"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSignedInAppUser, supabase } from "../../../lib/supabase";

type RuntimeRow = {
  lesson_block_id: string;
  sequence_no: number;
  block_type: string;
  title: string | null;
  body: string | null;
  status: "locked" | "unlocked" | "completed" | "retry" | null;
};

export default function IndependentAttemptClient({ initialAttemptId }: { initialAttemptId: string }) {
  const searchParams = useSearchParams();
  const [runtime, setRuntime] = useState<RuntimeRow[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState("Loading lesson...");
  const effectiveAttemptId = useMemo(() => searchParams.get("attemptId") ?? initialAttemptId, [searchParams, initialAttemptId]);

  useEffect(() => {
    let mounted = true;
    async function loadRuntime() {
      if (!supabase) {
        setStatus("Supabase is not configured.");
        return;
      }
      const { appUser, error } = await getSignedInAppUser();
      if (!appUser) {
        setStatus(error ?? "Sign in required.");
        return;
      }

      const { data: attempt } = await supabase
        .from("independent_attempts")
        .select("id, assignment_id")
        .eq("id", effectiveAttemptId)
        .eq("user_id", appUser.id)
        .maybeSingle();

      if (!attempt) {
        setStatus("Attempt not found. Start from Assignments.");
        return;
      }

      const { data: assignment } = await supabase
        .from("assignments")
        .select("lesson_version_id")
        .eq("id", attempt.assignment_id)
        .maybeSingle();

      if (!assignment) {
        setStatus("Assignment could not be loaded.");
        return;
      }

      const [blocksRes, progressRes] = await Promise.all([
        supabase
          .from("lesson_blocks")
          .select("id, sequence_no, block_type, title, body")
          .eq("lesson_version_id", assignment.lesson_version_id)
          .order("sequence_no", { ascending: true }),
        supabase
          .from("attempt_step_progress")
          .select("lesson_block_id, status")
          .eq("independent_attempt_id", attempt.id)
          .eq("user_id", appUser.id)
      ]);

      if (!mounted) return;
      if (blocksRes.error) {
        setStatus(`Failed to load lesson blocks: ${blocksRes.error.message}`);
        return;
      }

      const statusByBlock = new Map((progressRes.data ?? []).map((p) => [p.lesson_block_id, p.status]));
      const rows: RuntimeRow[] = (blocksRes.data ?? []).map((block) => ({
        lesson_block_id: block.id,
        sequence_no: block.sequence_no,
        block_type: block.block_type,
        title: block.title,
        body: block.body,
        status: statusByBlock.get(block.id) ?? "locked"
      }));
      setRuntime(rows);
      setActiveStepId(rows[0]?.lesson_block_id ?? null);
      setStatus(rows.length > 0 ? "" : "No lesson steps found.");
    }

    void loadRuntime();
    return () => {
      mounted = false;
    };
  }, [effectiveAttemptId]);

  async function submitStepResponse() {
    if (!supabase || !activeStepId) return;
    const { appUser } = await getSignedInAppUser();
    if (!appUser) {
      setStatus("Sign in required.");
      return;
    }

    const { error: progressError } = await supabase.from("attempt_step_progress").upsert({
      independent_attempt_id: effectiveAttemptId,
      lesson_block_id: activeStepId,
      user_id: appUser.id,
      status: "completed",
      score: 100
    });

    if (progressError) {
      setStatus(`Could not save progress: ${progressError.message}`);
      return;
    }

    const { error: responseError } = await supabase.from("attempt_responses").insert({
      independent_attempt_id: effectiveAttemptId,
      lesson_block_id: activeStepId,
      user_id: appUser.id,
      response_payload: { text: responseText },
      score: 100,
      confidence: 4
    });
    if (responseError) {
      setStatus(`Could not save response: ${responseError.message}`);
      return;
    }

    setRuntime((prev) =>
      prev.map((row) => (row.lesson_block_id === activeStepId ? { ...row, status: "completed" } : row))
    );
    setResponseText("");
    setStatus("Step submitted. Continue to next checkpoint.");
  }

  const activeStep = runtime.find((row) => row.lesson_block_id === activeStepId) ?? null;

  return (
    <main>
      <section className="hero">
        <h1 className="title">Independent Lesson Player</h1>
        <p className="subtitle">Attempt ID: {effectiveAttemptId}</p>
      </section>
      {status ? <p className="status info">{status}</p> : null}

      <section className="grid">
        {runtime.map((step) => (
          <button
            key={step.lesson_block_id}
            className={`button ${activeStepId === step.lesson_block_id ? "active" : ""}`}
            onClick={() => setActiveStepId(step.lesson_block_id)}
          >
            Step {step.sequence_no}: {step.title ?? step.block_type} ({step.status ?? "locked"})
          </button>
        ))}
      </section>

      {activeStep ? (
        <section className="formCard" style={{ marginTop: 16 }}>
          <h3>{activeStep.title ?? `Step ${activeStep.sequence_no}`}</h3>
          <p>{activeStep.body ?? "Read/watch this checkpoint and submit your reflection."}</p>
          <textarea
            className="input"
            placeholder="Write your reflection or answer..."
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
          />
          <button className="primaryButton" onClick={submitStepResponse}>
            Submit & Mark Complete
          </button>
        </section>
      ) : null}
    </main>
  );
}
