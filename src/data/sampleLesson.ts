import type { StepBlock } from "../components/steps/types";

export const sampleLessonTitle = "What is Bias in AI?";

export const sampleSteps: StepBlock[] = [
  {
    id: "step-1",
    sequence_no: 1,
    block_type: "concept_reveal",
    title: "What Does 'Bias' Mean?",
    body: "In everyday language, bias means leaning toward or against something unfairly. But in AI, bias has a more specific — and often hidden — meaning.",
    config: {
      key_idea:
        "AI bias occurs when a system produces results that are systematically prejudiced due to flawed assumptions in the data or algorithm.",
      detail:
        "It's not that the AI 'decides' to be unfair — it learns patterns from data created by humans, and those patterns can include human prejudices.",
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-2",
    sequence_no: 2,
    block_type: "micro_challenge",
    title: "Spot the Bias",
    body: null,
    config: {
      question:
        "A hiring AI trained on 10 years of resumes at a tech company mostly selects male candidates. Why?",
      options: [
        { id: "a", text: "The AI is sexist by design" },
        { id: "b", text: "The training data reflected past hiring patterns that favored men" },
        { id: "c", text: "AI can't process female names" },
        { id: "d", text: "The algorithm was coded to prefer men" },
      ],
      correct_option_id: "b",
      explanation:
        "The AI learned from historical data where most hires were men — not because it was programmed to discriminate, but because it replicated existing patterns.",
    },
    hints: [
      { level: 1, text: "Think about where the AI gets its 'knowledge' from." },
      { level: 2, text: "The AI doesn't have its own opinions — it mirrors what it was trained on." },
    ],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-3",
    sequence_no: 3,
    block_type: "concept_reveal",
    title: "Types of AI Bias",
    body: "Bias in AI isn't one-size-fits-all. Different kinds of bias enter at different stages.",
    config: {
      key_idea: "The three main sources of AI bias are: data bias, algorithmic bias, and interaction bias.",
      detail:
        "Data bias: the training data doesn't represent reality fairly. Algorithmic bias: the model amplifies certain patterns. Interaction bias: users influence the system over time (like search autocomplete).",
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-4",
    sequence_no: 4,
    block_type: "micro_challenge",
    title: "Match the Bias Type",
    body: null,
    config: {
      question:
        "A facial recognition system works well for light-skinned faces but poorly for dark-skinned faces. What type of bias is this?",
      options: [
        { id: "a", text: "Interaction bias" },
        { id: "b", text: "Algorithmic bias" },
        { id: "c", text: "Data bias — the training set lacked diversity" },
        { id: "d", text: "Confirmation bias" },
      ],
      correct_option_id: "c",
      explanation:
        "This is data bias. The training dataset contained mostly light-skinned faces, so the model didn't learn to recognize darker skin tones accurately.",
    },
    hints: [
      { level: 1, text: "Where does the problem originate — in the data, the algorithm, or user behavior?" },
    ],
    is_gate: true,
    mastery_rules: { require_correct: true },
  },
  {
    id: "step-5",
    sequence_no: 5,
    block_type: "reasoning_response",
    title: "Why Does This Matter?",
    body: null,
    config: {
      prompt:
        "Imagine you're applying for a loan and an AI system denies your application. Later you learn the AI was trained on data that disadvantaged people from your neighborhood. In 2-3 sentences, explain why this is harmful and what should be done about it.",
      min_words: 15,
      exemplar:
        "This is harmful because it perpetuates systemic inequality — people are judged not on their own merits but on patterns from biased historical data. To fix this, companies should audit their AI systems for fairness, use diverse training data, and allow humans to review automated decisions.",
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-6",
    sequence_no: 6,
    block_type: "peer_compare",
    title: "What Would You Do?",
    body: null,
    config: {
      prompt:
        "You're the CEO of a company that just discovered its hiring AI has gender bias. What's your first action?",
      options: [
        { id: "a", text: "Shut down the AI immediately" },
        { id: "b", text: "Keep using it but add human review" },
        { id: "c", text: "Retrain it with more balanced data" },
        { id: "d", text: "Disclose the bias publicly and form a task force" },
      ],
      show_distribution: true,
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-7",
    sequence_no: 7,
    block_type: "reasoning_response",
    title: "Defend Your Choice",
    body: null,
    config: {
      prompt:
        "Explain why you chose the action you did in the previous step. What are the tradeoffs of your decision? Consider both short-term and long-term consequences.",
      min_words: 20,
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
  {
    id: "step-8",
    sequence_no: 8,
    block_type: "concept_reveal",
    title: "Key Takeaway",
    body: "You've explored what AI bias is, where it comes from, and how it impacts real people. Here's the big idea to take with you.",
    config: {
      key_idea:
        "AI systems are only as fair as the data and decisions behind them. Ethical AI requires continuous auditing, diverse perspectives, and human accountability.",
      detail:
        "There's no 'set and forget' with AI fairness — it requires ongoing vigilance, transparency, and willingness to course-correct.",
    },
    hints: [],
    is_gate: false,
    mastery_rules: {},
  },
];
