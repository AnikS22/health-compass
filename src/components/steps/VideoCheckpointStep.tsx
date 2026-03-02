import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Play, RotateCcw, Send } from "lucide-react";
import type { StepResponse } from "./types";

/* ── Config shape ───────────────────────────────────────────────── */

export interface CheckpointActivity {
  type: "mcq" | "short_answer" | "fill_blank" | "poll";
  prompt: string;
  /** MCQ / poll options */
  options?: { id: string; text: string }[];
  /** For MCQ auto-grading */
  correct_option_id?: string;
  explanation?: string;
  hints?: string[];
  time_limit_seconds?: number;
  max_attempts?: number;
  required_to_continue?: boolean;
}

export interface Checkpoint {
  id: string;
  timestamp_seconds: number;
  activity: CheckpointActivity;
}

export interface VideoCheckpointConfig {
  video_url: string;
  checkpoints: Checkpoint[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ── Component ──────────────────────────────────────────────────── */

interface Props {
  config: VideoCheckpointConfig;
  body?: string | null;
  onComplete: (r: StepResponse) => void;
  isLive?: boolean;
}

export default function VideoCheckpointStep({ config, body, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedCheckpoints = [...config.checkpoints].sort(
    (a, b) => a.timestamp_seconds - b.timestamp_seconds
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Set<string>>(new Set());
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  // Activity overlay state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isYouTube = !!extractYouTubeId(config.video_url);

  /* ── Time tracking for HTML5 video ───────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  /* ── Checkpoint detection ──────────────────────────────────────── */
  useEffect(() => {
    if (activeCheckpoint) return; // Already showing one
    for (const cp of sortedCheckpoints) {
      if (completedCheckpoints.has(cp.id)) continue;
      if (currentTime >= cp.timestamp_seconds && currentTime < cp.timestamp_seconds + 1.5) {
        // Pause & activate
        videoRef.current?.pause();
        setActiveCheckpoint(cp);
        setSelectedOption(null);
        setTextAnswer("");
        setSubmitted(false);
        setIsCorrect(null);
        setAttempts(0);
        setHintIndex(0);
        if (cp.activity.time_limit_seconds) {
          setCountdown(cp.activity.time_limit_seconds);
        } else {
          setCountdown(null);
        }
        break;
      }
    }
  }, [currentTime, activeCheckpoint, completedCheckpoints, sortedCheckpoints]);

  /* ── Countdown timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (countdown === null || countdown <= 0 || submitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c !== null && c <= 1) {
          handleSubmitActivity(true);
          return 0;
        }
        return c !== null ? c - 1 : null;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, submitted]);

  /* ── Submit activity response ──────────────────────────────────── */
  const handleSubmitActivity = useCallback(
    (timedOut = false) => {
      if (!activeCheckpoint) return;
      const act = activeCheckpoint.activity;
      let correct: boolean | null = null;

      if (act.type === "mcq" && act.correct_option_id) {
        correct = selectedOption === act.correct_option_id;
        if (!correct && !timedOut && act.max_attempts && attempts + 1 < act.max_attempts) {
          setAttempts((a) => a + 1);
          setIsCorrect(false);
          // Show next hint if available
          if (act.hints && hintIndex < act.hints.length) {
            setHintIndex((h) => h + 1);
          }
          return;
        }
      }

      setSubmitted(true);
      setIsCorrect(correct);

      const answer = act.type === "mcq" || act.type === "poll" ? selectedOption : textAnswer;
      setResponses((prev) => ({
        ...prev,
        [activeCheckpoint.id]: {
          answer,
          correct,
          attempts: attempts + 1,
          timed_out: timedOut,
        },
      }));
    },
    [activeCheckpoint, selectedOption, textAnswer, attempts, hintIndex]
  );

  /* ── Continue after activity ───────────────────────────────────── */
  const handleContinue = useCallback(() => {
    if (!activeCheckpoint) return;
    setCompletedCheckpoints((s) => new Set(s).add(activeCheckpoint.id));
    setActiveCheckpoint(null);
    setCountdown(null);
    // Resume video
    setTimeout(() => videoRef.current?.play(), 200);
  }, [activeCheckpoint]);

  /* ── Lesson-level completion ───────────────────────────────────── */
  const allDone = sortedCheckpoints.length > 0 && sortedCheckpoints.every((c) => completedCheckpoints.has(c.id));

  useEffect(() => {
    // Video ended and all checkpoints done
    if (!isPlaying && allDone && currentTime > 0 && duration > 0 && currentTime >= duration - 1) {
      // small delay for UX
    }
  }, [isPlaying, allDone, currentTime, duration]);

  const handleFinish = () => {
    onComplete({ checkpoints: responses } as unknown as StepResponse);
  };

  /* ── Render: progress markers ──────────────────────────────────── */
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {body && <p className="text-muted-foreground text-sm mb-3">{body}</p>}

      {/* Video container */}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        {isYouTube ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>YouTube checkpoints require HTML5 video.</p>
            <p className="text-xs mt-1">Please use a direct video URL (mp4, webm) for checkpoint lessons.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={config.video_url}
            className="w-full aspect-video"
            controls={!activeCheckpoint}
            controlsList="nodownload"
          />
        )}

        {/* Checkpoint overlay */}
        {activeCheckpoint && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-10">
            <div className="w-full max-w-lg space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Checkpoint @ {fmtTime(activeCheckpoint.timestamp_seconds)}
                </span>
                {countdown !== null && countdown > 0 && !submitted && (
                  <span className="flex items-center gap-1 text-xs font-mono text-destructive">
                    <Clock className="w-3 h-3" /> {countdown}s
                  </span>
                )}
              </div>

              {/* Prompt */}
              <p className="text-foreground font-medium">{activeCheckpoint.activity.prompt}</p>

              {/* Hint */}
              {!submitted && activeCheckpoint.activity.hints && hintIndex > 0 && (
                <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-lg px-3 py-2">
                  💡 Hint: {activeCheckpoint.activity.hints[hintIndex - 1]}
                </p>
              )}

              {/* Activity body */}
              {!submitted ? (
                <>
                  {(activeCheckpoint.activity.type === "mcq" || activeCheckpoint.activity.type === "poll") &&
                    activeCheckpoint.activity.options?.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                          selectedOption === opt.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}

                  {(activeCheckpoint.activity.type === "short_answer" ||
                    activeCheckpoint.activity.type === "fill_blank") && (
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your answer…"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  )}

                  {isCorrect === false && !submitted && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Not quite — try again
                      {activeCheckpoint.activity.max_attempts
                        ? ` (${attempts + 1}/${activeCheckpoint.activity.max_attempts})`
                        : ""}
                    </p>
                  )}

                  <button
                    onClick={() => handleSubmitActivity()}
                    disabled={
                      (activeCheckpoint.activity.type === "mcq" && !selectedOption) ||
                      (activeCheckpoint.activity.type === "poll" && !selectedOption) ||
                      (activeCheckpoint.activity.type === "short_answer" && !textAnswer.trim()) ||
                      (activeCheckpoint.activity.type === "fill_blank" && !textAnswer.trim())
                    }
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit
                  </button>
                </>
              ) : (
                /* Feedback */
                <div className="space-y-3">
                  {isCorrect !== null && (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm font-medium ${
                        isCorrect
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                    </div>
                  )}
                  {activeCheckpoint.activity.explanation && (
                    <p className="text-sm text-muted-foreground">{activeCheckpoint.activity.explanation}</p>
                  )}
                  <button
                    onClick={handleContinue}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Continue Video
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline with checkpoint markers */}
      {!isYouTube && duration > 0 && (
        <div className="space-y-2">
          <div className="relative h-2 rounded-full bg-secondary overflow-visible">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Checkpoint dots */}
            {sortedCheckpoints.map((cp) => {
              const left = (cp.timestamp_seconds / duration) * 100;
              const done = completedCheckpoints.has(cp.id);
              return (
                <div
                  key={cp.id}
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-colors ${
                    done
                      ? "bg-primary border-primary"
                      : "bg-background border-primary/60"
                  }`}
                  style={{ left: `${left}%`, marginLeft: "-6px" }}
                  title={`Checkpoint @ ${fmtTime(cp.timestamp_seconds)}`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{fmtTime(currentTime)}</span>
            <span>
              {completedCheckpoints.size}/{sortedCheckpoints.length} checkpoints
            </span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Finish button — shown when video ended and all checkpoints done */}
      {allDone && (
        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Complete This Step
        </button>
      )}

      {/* If no checkpoints, allow immediate completion */}
      {sortedCheckpoints.length === 0 && (
        <button
          onClick={() => onComplete({})}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  );
}
