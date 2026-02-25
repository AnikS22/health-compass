export type StepType = "concept_reveal" | "micro_challenge" | "reasoning_response" | "peer_compare";

export interface Hint {
  level: number;
  text: string;
}

export interface StepBlock {
  id: string;
  sequence_no: number;
  block_type: StepType;
  title: string | null;
  body: string | null;
  config: Record<string, unknown>;
  hints: Hint[];
  is_gate: boolean;
  mastery_rules: Record<string, unknown>;
}

// Config shapes per step type
export interface ConceptRevealConfig {
  visual_url?: string;
  key_idea: string;
  detail?: string;
}

export interface MicroChallengeConfig {
  question: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation: string;
}

export interface ReasoningResponseConfig {
  prompt: string;
  min_words?: number;
  exemplar?: string;
}

export interface PeerCompareConfig {
  prompt: string;
  options?: { id: string; text: string }[];
  show_distribution: boolean;
}

export interface StepResponse {
  selected_option_id?: string;
  text?: string;
}

export interface PeerDistribution {
  option_id: string;
  count: number;
  percentage: number;
}
