import { useState, useCallback } from "react";
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
import VideoCheckpointStep from "./VideoCheckpointStep";
import type { VideoCheckpointConfig } from "./VideoCheckpointStep";
import type {
  StepBlock,
  StepResponse,
  ConceptRevealConfig,
  MicroChallengeConfig,
  ReasoningResponseConfig,
  PeerCompareConfig,
  PeerDistribution,
} from "./types";

interface Props {
  steps: StepBlock[];
  lessonTitle: string;
  onStepComplete?: (stepId: string, response: StepResponse) => void;
  onLessonComplete?: () => void;
  /** If provided, teacher controls the current step index */
  controlledIndex?: number;
  /** Peer distribution data for peer_compare steps */
  peerDistributions?: Record<string, PeerDistribution[]>;
  isLive?: boolean;
}

export default function StepRunner({
  steps,
  lessonTitle,
  onStepComplete,
  onLessonComplete,
  controlledIndex,
  peerDistributions,
  isLive,
}: Props) {
  const [selfIndex, setSelfIndex] = useState(0);
  const currentIndex = controlledIndex ?? selfIndex;
  const step = steps[currentIndex];
  const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  const handleComplete = useCallback(
    (response: StepResponse = {}) => {
      if (step) onStepComplete?.(step.id, response);

      if (controlledIndex === undefined) {
        if (currentIndex < steps.length - 1) {
          setSelfIndex((i) => i + 1);
        } else {
          onLessonComplete?.();
        }
      }
    },
    [step, currentIndex, steps.length, controlledIndex, onStepComplete, onLessonComplete]
  );

  if (!step) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Lesson Complete!</h2>
          <p className="text-muted-foreground">Great work finishing this lesson.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {lessonTitle}
          </p>
          <span className="text-xs text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {step.title && (
          <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
        )}
      </div>

      {/* Step content */}
      <div key={step.id}>
        {step.block_type === "concept_reveal" && (
          <ConceptRevealStep
            config={step.config as unknown as ConceptRevealConfig}
            body={step.body}
            onComplete={() => handleComplete()}
          />
        )}
        {step.block_type === "micro_challenge" && (
          <MicroChallengeStep
            config={step.config as unknown as MicroChallengeConfig}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        )}
        {step.block_type === "reasoning_response" && (
          <ReasoningResponseStep
            config={step.config as unknown as ReasoningResponseConfig}
            onComplete={(r) => handleComplete(r)}
          />
        )}
        {step.block_type === "peer_compare" && (
          <PeerCompareStep
            config={step.config as unknown as PeerCompareConfig}
            distribution={peerDistributions?.[step.id]}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
        {step.block_type === "debate" && (
          <DebateStep
            config={step.config as unknown as DebateConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
        {(step.block_type === "collaborative_board" || step.block_type === "group_board") && (
          <CollaborativeBoardStep
            config={step.config as unknown as CollaborativeBoardConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
        {step.block_type === "peer_review" as string && (
          <PeerReviewStep
            config={step.config as unknown as PeerReviewConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
        {step.block_type === "group_challenge" as string && (
          <GroupChallengeStep
            config={step.config as unknown as GroupChallengeConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
        {(step.block_type === "video_checkpoint" || step.block_type === "video") && (
          <VideoCheckpointStep
            config={step.config as unknown as VideoCheckpointConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        )}
      </div>
    </div>
  );
}
