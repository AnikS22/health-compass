import { useState } from "react";

export interface McqConfig {
  options: string[];
  correct_answer?: string;
}

interface Props {
  config: McqConfig;
  body: string | null;
  hints?: { level: number; text: string }[];
  isMultiSelect?: boolean;
  onComplete: (response: { selected_option?: string; selected_options?: string[]; correct: boolean }) => void;
}

export default function McqStep({ config, body, hints, isMultiSelect, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  function toggleOption(opt: string) {
    if (submitted) return;
    const next = new Set(selected);
    if (isMultiSelect) {
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
    } else {
      next.clear();
      next.add(opt);
    }
    setSelected(next);
  }

  function handleSubmit() {
    if (selected.size === 0) return;
    const selectedArr = Array.from(selected);
    const isCorrect = config.correct_answer
      ? selected.has(config.correct_answer)
      : true;
    setCorrect(isCorrect);
    setSubmitted(true);
    onComplete({
      selected_option: isMultiSelect ? undefined : selectedArr[0],
      selected_options: isMultiSelect ? selectedArr : undefined,
      correct: isCorrect,
    });
  }

  const availableHints = (hints || []).filter(h => h.level <= hintLevel);

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      <div className="space-y-2">
        {(config.options || []).map((opt, i) => {
          const isSelected = selected.has(opt);
          const isAnswer = submitted && config.correct_answer === opt;
          return (
            <button
              key={i}
              onClick={() => toggleOption(opt)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                isAnswer
                  ? "border-green-500 bg-green-500/10 text-foreground"
                  : isSelected
                  ? submitted
                    ? "border-destructive bg-destructive/10 text-foreground"
                    : "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              } ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {availableHints.length > 0 && (
        <div className="space-y-2">
          {availableHints.map(h => (
            <div key={h.level} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-foreground">
              💡 {h.text}
            </div>
          ))}
        </div>
      )}

      {!submitted && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Submit
          </button>
          {hints && hints.length > 0 && hintLevel < hints.length && (
            <button
              onClick={() => setHintLevel(l => l + 1)}
              className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80"
            >
              💡 Hint
            </button>
          )}
        </div>
      )}

      {submitted && (
        <div className={`rounded-xl p-4 border ${correct ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"}`}>
          <p className="text-sm font-medium text-foreground">
            {correct ? "✓ Correct!" : `✗ The correct answer is: ${config.correct_answer || "N/A"}`}
          </p>
        </div>
      )}
    </div>
  );
}
