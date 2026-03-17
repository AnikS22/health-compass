import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { MicroChallengeConfig, Hint } from "./types";
import BlockBody from "./BlockBody";

interface Props {
  config: MicroChallengeConfig;
  hints: Hint[];
  onComplete: (response: { selected_option_id: string }) => void;
}

export default function MicroChallengeStep({ config, hints, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const isCorrect = selected === config.correct_option_id;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
  }

  function handleContinue() {
    if (selected) onComplete({ selected_option_id: selected });
  }

  const sortedHints = [...hints].sort((a, b) => a.level - b.level);
  const visibleHints = sortedHints.slice(0, hintLevel);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <p className="text-lg font-medium text-foreground">{config.question}</p>

      <div className="space-y-2.5">
        {config.options.map((opt) => {
          const isThis = selected === opt.id;
          const showResult = submitted && isThis;
          const correctResult = showResult && isCorrect;
          const wrongResult = showResult && !isCorrect;
          const isCorrectAnswer = submitted && opt.id === config.correct_option_id;

          return (
            <button
              key={opt.id}
              onClick={() => !submitted && setSelected(opt.id)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                correctResult
                  ? "border-success bg-success/5 text-foreground"
                  : wrongResult
                  ? "border-destructive bg-destructive/5 text-foreground"
                  : isCorrectAnswer
                  ? "border-success bg-success/5 text-foreground"
                  : isThis
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-3">
                {correctResult && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                {wrongResult && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                {isCorrectAnswer && !isThis && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hints */}
      {!submitted && sortedHints.length > 0 && hintLevel < sortedHints.length && (
        <button
          onClick={() => setHintLevel((l) => l + 1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Need a hint? ({hintLevel}/{sortedHints.length})
        </button>
      )}
      {visibleHints.map((h) => (
        <div
          key={h.level}
          className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm animate-in fade-in duration-300"
        >
          💡 Hint {h.level}: {h.text}
        </div>
      ))}

      {submitted && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            isCorrect
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isCorrect ? "Correct! " : "Not quite. "}
          {config.explanation}
        </div>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  );
}
