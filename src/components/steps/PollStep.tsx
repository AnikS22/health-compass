import { useState } from "react";

export interface PollConfig {
  options: string[];
}

interface Props {
  config: PollConfig;
  body: string | null;
  onComplete: (response: { selected_option: string }) => void;
}

export default function PollStep({ config, body, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const options = Array.isArray(config?.options) ? config.options : [];

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete({ selected_option: selected });
  }

  if (options.length === 0) {
    return (
      <div className="space-y-5">
        {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
        <div className="bg-secondary/50 border border-border rounded-xl p-6 text-center space-y-3">
          <p className="text-muted-foreground text-sm">This poll has no options configured.</p>
          <button
            onClick={() => onComplete({ selected_option: "" })}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(opt)}
            disabled={submitted}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selected === opt
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-primary/50"
            } ${submitted ? "opacity-70 cursor-default" : "cursor-pointer"}`}
          >
            <span className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                selected === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </span>
          </button>
        ))}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Submit
        </button>
      )}
      {submitted && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">✓ Response recorded</p>
        </div>
      )}
    </div>
  );
}
