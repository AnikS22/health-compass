import { useState } from "react";
import { PenLine } from "lucide-react";
import type { ReasoningResponseConfig } from "./types";

interface Props {
  config: ReasoningResponseConfig;
  onComplete: (response: { text: string }) => void;
}

export default function ReasoningResponseStep({ config, onComplete }: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = config.min_words ?? 10;
  const canSubmit = wordCount >= minWords;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <PenLine className="w-5 h-5 text-accent" />
        </div>
        <p className="text-lg font-medium text-foreground pt-1.5">{config.prompt}</p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder="Write your reasoning here..."
          rows={5}
          className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
        />
        <span
          className={`absolute bottom-3 right-3 text-xs ${
            canSubmit ? "text-success" : "text-muted-foreground"
          }`}
        >
          {wordCount}/{minWords} words
        </span>
      </div>

      {submitted && config.exemplar && (
        <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Exemplar Response
          </p>
          <p className="text-sm text-foreground leading-relaxed">{config.exemplar}</p>
        </div>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Submit Response
        </button>
      ) : (
        <button
          onClick={() => onComplete({ text })}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  );
}
