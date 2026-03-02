import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ConceptRevealStep from "./ConceptRevealStep";
import MicroChallengeStep from "./MicroChallengeStep";
import ReasoningResponseStep from "./ReasoningResponseStep";
import PeerCompareStep from "./PeerCompareStep";
import DebateStep from "./DebateStep";
import type { DebateConfig } from "./DebateStep";
import CollaborativeBoardStep from "./CollaborativeBoardStep";
import type { CollaborativeBoardConfig } from "./CollaborativeBoardStep";
import PeerReviewStep from "./PeerReviewStep";
import type { PeerReviewConfig } from "./PeerReviewStep";
import GroupChallengeStep from "./GroupChallengeStep";
import type { GroupChallengeConfig } from "./GroupChallengeStep";
import type {
  StepResponse,
  ConceptRevealConfig,
  MicroChallengeConfig,
  ReasoningResponseConfig,
  PeerCompareConfig,
} from "./types";

/* ── Config shape ───────────────────────────────────────────────── */

export interface Checkpoint {
  id: string;
  timestamp_seconds: number;
  block_type: string;
  title?: string;
  body?: string;
  config: Record<string, unknown>;
}

export interface VideoCheckpointConfig {
  video_url?: string;
  youtube_url?: string;
  checkpoints?: Checkpoint[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ── YouTube IFrame API loader ──────────────────────────────────── */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let ytApiLoading = false;
let ytApiReady = !!window.YT?.Player;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  if (ytApiReady) return Promise.resolve();
  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytApiLoading = false;
      prev?.();
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks.length = 0;
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

/* ── Checkpoint Block Renderer ──────────────────────────────────── */

function CheckpointBlockRenderer({
  checkpoint,
  onComplete,
  isLive,
}: {
  checkpoint: Checkpoint;
  onComplete: (r: StepResponse) => void;
  isLive?: boolean;
}) {
  const { block_type, config, body } = checkpoint;

  if (block_type === "concept_reveal") {
    return <ConceptRevealStep config={config as unknown as ConceptRevealConfig} body={body ?? null} onComplete={() => onComplete({})} />;
  }
  if (block_type === "micro_challenge") {
    return <MicroChallengeStep config={config as unknown as MicroChallengeConfig} hints={[]} onComplete={onComplete} />;
  }
  if (block_type === "reasoning_response" || block_type === "short_answer") {
    return <ReasoningResponseStep config={config as unknown as ReasoningResponseConfig} onComplete={onComplete} />;
  }
  if (block_type === "peer_compare") {
    return <PeerCompareStep config={config as unknown as PeerCompareConfig} onComplete={onComplete} isLive={isLive} />;
  }
  if (block_type === "debate") {
    return <DebateStep config={config as unknown as DebateConfig} body={body ?? null} onComplete={onComplete} isLive={isLive} />;
  }
  if (block_type === "collaborative_board" || block_type === "group_board") {
    return <CollaborativeBoardStep config={config as unknown as CollaborativeBoardConfig} body={body ?? null} onComplete={onComplete} isLive={isLive} />;
  }
  if (block_type === "peer_review") {
    return <PeerReviewStep config={config as unknown as PeerReviewConfig} body={body ?? null} onComplete={onComplete} isLive={isLive} />;
  }
  if (block_type === "group_challenge") {
    return <GroupChallengeStep config={config as unknown as GroupChallengeConfig} body={body ?? null} onComplete={onComplete} isLive={isLive} />;
  }
  if (block_type === "mcq" || block_type === "multi_select") {
    return <McqInline config={config} onComplete={onComplete} />;
  }
  if (block_type === "poll") {
    return <PollInline config={config} body={body} onComplete={onComplete} />;
  }
  return (
    <div className="space-y-3">
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      <p className="text-xs text-muted-foreground italic">Block type: {block_type}</p>
      <button onClick={() => onComplete({})} className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
        Continue
      </button>
    </div>
  );
}

/* ── Simple inline MCQ ──────────────────────────────────────────── */
function McqInline({ config, onComplete }: { config: any; onComplete: (r: StepResponse) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const options: string[] = Array.isArray(config.options) ? config.options : [];
  const correct = config.correct_answer;

  const handleSubmit = () => { setSubmitted(true); };

  if (submitted) {
    const isCorrect = selected === correct;
    return (
      <div className="space-y-3">
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {isCorrect ? "✅ Correct!" : `❌ Incorrect — answer: ${correct}`}
        </div>
        <button onClick={() => onComplete({ selected_option_id: selected ?? undefined })} className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          Continue Video
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <button key={i} onClick={() => setSelected(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${selected === opt ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
          {opt}
        </button>
      ))}
      <button onClick={handleSubmit} disabled={!selected}
        className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40">
        Submit
      </button>
    </div>
  );
}

/* ── Simple inline Poll ─────────────────────────────────────────── */
function PollInline({ config, body, onComplete }: { config: any; body?: string; onComplete: (r: StepResponse) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options: string[] = Array.isArray(config.options) ? config.options : [];

  return (
    <div className="space-y-2">
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      {options.map((opt, i) => (
        <button key={i} onClick={() => setSelected(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${selected === opt ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
          {opt}
        </button>
      ))}
      <button onClick={() => onComplete({ text: selected ?? undefined })} disabled={!selected}
        className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40">
        Submit
      </button>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

interface Props {
  config: VideoCheckpointConfig;
  body?: string | null;
  onComplete: (r: StepResponse) => void;
  isLive?: boolean;
}

export default function VideoCheckpointStep({ config, body, onComplete, isLive }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkpoints = config.checkpoints ?? [];
  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => a.timestamp_seconds - b.timestamp_seconds
  );

  const videoUrl = config.video_url || "";
  const youtubeUrl = config.youtube_url || "";
  const ytId = youtubeUrl ? youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)?.[1] : null;
  const isYouTube = !!ytId;
  const hasCheckpoints = sortedCheckpoints.length > 0;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Set<string>>(new Set());
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [ytReady, setYtReady] = useState(false);

  /* ── YouTube Player setup ───────────────────────────────────── */
  useEffect(() => {
    if (!isYouTube || !ytId || !hasCheckpoints) return;

    let destroyed = false;
    loadYouTubeAPI().then(() => {
      if (destroyed || !ytContainerRef.current) return;
      const player = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            if (destroyed) return;
            ytPlayerRef.current = player;
            setDuration(player.getDuration() || 0);
            setYtReady(true);
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.PLAYING) {
              setDuration(player.getDuration() || 0);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
  }, [isYouTube, ytId, hasCheckpoints]);

  /* ── YouTube polling for currentTime ────────────────────────── */
  useEffect(() => {
    if (!isYouTube || !ytReady || !hasCheckpoints) return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player?.getCurrentTime) return;
      const t = player.getCurrentTime();
      setCurrentTime(t);
      const dur = player.getDuration();
      if (dur && dur > 0) setDuration(dur);
    }, 400);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isYouTube, ytReady, hasCheckpoints]);

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
    if (activeCheckpoint || !hasCheckpoints) return;
    for (const cp of sortedCheckpoints) {
      if (completedCheckpoints.has(cp.id)) continue;
      if (currentTime >= cp.timestamp_seconds && currentTime < cp.timestamp_seconds + 1.5) {
        // Pause the video
        if (isYouTube) {
          ytPlayerRef.current?.pauseVideo?.();
        } else {
          videoRef.current?.pause();
        }
        setActiveCheckpoint(cp);
        break;
      }
    }
  }, [currentTime, activeCheckpoint, completedCheckpoints, sortedCheckpoints, hasCheckpoints, isYouTube]);

  /* ── Handle checkpoint completion ─────────────────────────────── */
  const handleCheckpointComplete = useCallback((response: StepResponse) => {
    if (!activeCheckpoint) return;
    setResponses((prev) => ({ ...prev, [activeCheckpoint.id]: response }));
    setCompletedCheckpoints((s) => new Set(s).add(activeCheckpoint.id));
    setActiveCheckpoint(null);
    setTimeout(() => {
      if (isYouTube) {
        ytPlayerRef.current?.playVideo?.();
      } else {
        videoRef.current?.play();
      }
    }, 200);
  }, [activeCheckpoint, isYouTube]);

  const allDone = hasCheckpoints && sortedCheckpoints.every((c) => completedCheckpoints.has(c.id));

  const handleFinish = () => {
    onComplete(hasCheckpoints ? { checkpoints: responses } as unknown as StepResponse : {});
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  /* ── Checkpoint overlay (shared for both YouTube & HTML5) ───── */
  const checkpointOverlay = activeCheckpoint && (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-10 overflow-y-auto">
      <div className="w-full max-w-lg space-y-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            📍 Checkpoint @ {fmtTime(activeCheckpoint.timestamp_seconds)}
          </span>
          <span className="text-[10px] uppercase bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
            {activeCheckpoint.block_type.replace(/_/g, " ")}
          </span>
        </div>
        {activeCheckpoint.title && (
          <h3 className="text-lg font-bold text-foreground">{activeCheckpoint.title}</h3>
        )}
        <CheckpointBlockRenderer
          checkpoint={activeCheckpoint}
          onComplete={handleCheckpointComplete}
          isLive={isLive}
        />
      </div>
    </div>
  );

  /* ── Timeline (shared) ─────────────────────────────────────── */
  const timeline = hasCheckpoints && duration > 0 && (
    <div className="space-y-2">
      <div className="relative h-2 rounded-full bg-secondary overflow-visible">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        {sortedCheckpoints.map((cp) => {
          const left = (cp.timestamp_seconds / duration) * 100;
          const done = completedCheckpoints.has(cp.id);
          return (
            <div key={cp.id}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-colors ${done ? "bg-primary border-primary" : "bg-background border-primary/60"}`}
              style={{ left: `${left}%`, marginLeft: "-6px" }}
              title={`${fmtTime(cp.timestamp_seconds)} — ${(cp.block_type || "").replace(/_/g, " ")}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{fmtTime(currentTime)}</span>
        <span>{completedCheckpoints.size}/{sortedCheckpoints.length} checkpoints</span>
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  );

  /* ── YouTube-only (no checkpoints) — simple embed ────────────── */
  if (isYouTube && !hasCheckpoints) {
    return (
      <div className="space-y-4">
        {body && <p className="text-muted-foreground text-sm mb-3">{body}</p>}
        <div className="rounded-2xl overflow-hidden bg-black">
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        </div>
        <button onClick={() => onComplete({})}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
          Continue
        </button>
      </div>
    );
  }

  /* ── YouTube WITH checkpoints — YT.Player API ───────────────── */
  if (isYouTube && hasCheckpoints) {
    return (
      <div className="space-y-4">
        {body && <p className="text-muted-foreground text-sm mb-3">{body}</p>}
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <div ref={ytContainerRef} className="w-full aspect-video" />
          {checkpointOverlay}
        </div>

        {timeline}

        {allDone && (
          <button onClick={handleFinish}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Complete This Step
          </button>
        )}
      </div>
    );
  }

  /* ── Direct video (with or without checkpoints) ──────────────── */
  return (
    <div className="space-y-4">
      {body && <p className="text-muted-foreground text-sm mb-3">{body}</p>}

      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          controls={!activeCheckpoint}
          controlsList="nodownload"
        />
        {checkpointOverlay}
      </div>

      {timeline}

      {allDone && (
        <button onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Complete This Step
        </button>
      )}
      {!hasCheckpoints && (
        <button onClick={() => onComplete({})}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
          Continue
        </button>
      )}
    </div>
  );
}
