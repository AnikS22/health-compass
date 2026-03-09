import { useState } from "react";

export interface ShortAnswerConfig {
  prompt: string;
  min_words?: number;
}

interface Props {
  config: ShortAnswerConfig;
  body: string | null;
  onComplete: (response: { text: string }) => void;
}

export default function ShortAnswerStep({ config, body, onComplete }: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = !config.min_words || wordCount >= config.min_words;

  function handleSubmit() {
    if (!meetsMinWords) return;
    setSubmitted(true);
    onComplete({ text: text.trim() });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      {config.prompt && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">{config.prompt}</p>
        </div>
      )}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={submitted}
        rows={4}
        placeholder="Type your answer here…"
        className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none disabled:opacity-70"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${meetsMinWords ? "text-muted-foreground" : "text-destructive"}`}>
          {wordCount} words{config.min_words ? ` / ${config.min_words} minimum` : ""}
        </span>
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!meetsMinWords || !text.trim()}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Submit
          </button>
        ) : (
          <span className="text-sm text-primary font-medium">✓ Submitted</span>
        )}
      </div>
    </div>
  );
}
