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
import PollStep from "./PollStep";
import type { PollConfig } from "./PollStep";
import McqStep from "./McqStep";
import type { McqConfig } from "./McqStep";
import ShortAnswerStep from "./ShortAnswerStep";
import type { ShortAnswerConfig } from "./ShortAnswerStep";
import ScenarioStep from "./ScenarioStep";
import type { ScenarioConfig } from "./ScenarioStep";
import ExitTicketStep from "./ExitTicketStep";
import type { ExitTicketConfig } from "./ExitTicketStep";
import DragDropStep from "./DragDropStep";
import type { DragDropConfig } from "./DragDropStep";
import MatchingStep from "./MatchingStep";
import type { MatchingConfig } from "./MatchingStep";
import DilemmaTreeStep from "./DilemmaTreeStep";
import type { DilemmaTreeConfig } from "./DilemmaTreeStep";
import DrawingStep from "./DrawingStep";
import type { DrawingConfig } from "./DrawingStep";
import RedTeamStep from "./RedTeamStep";
import type { RedTeamConfig } from "./RedTeamStep";
import SlidesStep from "./SlidesStep";
import type { SlidesConfig } from "./SlidesStep";
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
  controlledIndex?: number;
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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Lesson Complete!</h2>
          <p className="text-muted-foreground">Great work finishing this lesson.</p>
        </div>
      </div>
    );
  }

  function renderStep() {
    if (!step) return null;

    switch (step.block_type) {
      case "concept_reveal":
        return (
          <ConceptRevealStep
            config={step.config as unknown as ConceptRevealConfig}
            body={step.body}
            onComplete={() => handleComplete()}
          />
        );
      case "micro_challenge":
        return (
          <MicroChallengeStep
            config={step.config as unknown as MicroChallengeConfig}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "reasoning_response":
        return (
          <ReasoningResponseStep
            config={step.config as unknown as ReasoningResponseConfig}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "peer_compare":
        return (
          <PeerCompareStep
            config={step.config as unknown as PeerCompareConfig}
            distribution={peerDistributions?.[step.id]}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "debate":
        return (
          <DebateStep
            config={step.config as unknown as DebateConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "collaborative_board":
      case "group_board":
        return (
          <CollaborativeBoardStep
            config={step.config as unknown as CollaborativeBoardConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "peer_review":
        return (
          <PeerReviewStep
            config={step.config as unknown as PeerReviewConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "group_challenge":
        return (
          <GroupChallengeStep
            config={step.config as unknown as GroupChallengeConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "video_checkpoint":
      case "video":
        return (
          <VideoCheckpointStep
            config={step.config as unknown as VideoCheckpointConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
            isLive={isLive}
          />
        );
      case "poll":
        return (
          <PollStep
            config={step.config as unknown as PollConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "mcq":
        return (
          <McqStep
            config={step.config as unknown as McqConfig}
            body={step.body}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "multi_select":
        return (
          <McqStep
            config={step.config as unknown as McqConfig}
            body={step.body}
            hints={step.hints}
            isMultiSelect
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "short_answer":
        return (
          <ShortAnswerStep
            config={step.config as unknown as ShortAnswerConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "scenario":
        return (
          <ScenarioStep
            config={step.config as unknown as ScenarioConfig}
            body={step.body}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "exit_ticket":
        return (
          <ExitTicketStep
            config={step.config as unknown as ExitTicketConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "drag_drop":
        return (
          <DragDropStep
            config={step.config as unknown as DragDropConfig}
            body={step.body}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "matching":
        return (
          <MatchingStep
            config={step.config as unknown as MatchingConfig}
            body={step.body}
            hints={step.hints}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "dilemma_tree":
        return (
          <DilemmaTreeStep
            config={step.config as unknown as DilemmaTreeConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "drawing":
        return (
          <DrawingStep
            config={step.config as unknown as DrawingConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "red_team":
        return (
          <RedTeamStep
            config={step.config as unknown as RedTeamConfig}
            body={step.body}
            onComplete={(r) => handleComplete(r)}
          />
        );
      case "slides":
        return (
          <SlidesStep
            config={step.config as unknown as SlidesConfig}
            body={step.body}
            onComplete={() => handleComplete()}
            isLive={isLive}
          />
        );
      default:
        return (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Unsupported block type: <strong>{step.block_type}</strong>
            </p>
            <button
              onClick={() => handleComplete()}
              className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90"
            >
              Continue
            </button>
          </div>
        );
    }
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
        {renderStep()}
      </div>
    </div>
  );
}
