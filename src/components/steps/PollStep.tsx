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

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete({ selected_option: selected });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      <div className="space-y-2">
        {(config.options || []).map((opt, i) => (
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
            {opt}
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
