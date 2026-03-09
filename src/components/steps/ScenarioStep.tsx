import { useState } from "react";

export interface ScenarioConfig {
  description: string;
  choices: { id: string; text: string; outcome: string }[];
  debrief?: string;
}

interface Props {
  config: ScenarioConfig;
  body: string | null;
  hints?: { level: number; text: string }[];
  onComplete: (response: { selected_choice_id: string }) => void;
}

export default function ScenarioStep({ config, body, hints, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const selectedChoice = config.choices?.find(c => c.id === selected);
  const availableHints = (hints || []).filter(h => h.level <= hintLevel);

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete({ selected_choice_id: selected });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-foreground leading-relaxed">{config.description}</p>
      </div>

      <div className="space-y-2">
        {(config.choices || []).map(choice => (
          <button
            key={choice.id}
            onClick={() => !submitted && setSelected(choice.id)}
            disabled={submitted}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
              selected === choice.id
                ? "border-primary bg-primary/10 text-foreground font-medium"
                : "border-border bg-card text-foreground hover:border-primary/50"
            } ${submitted ? "cursor-default" : "cursor-pointer"}`}
          >
            {choice.text}
          </button>
        ))}
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
            disabled={!selected}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Choose
          </button>
          {hints && hints.length > 0 && hintLevel < hints.length && (
            <button onClick={() => setHintLevel(l => l + 1)}
              className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80">
              💡 Hint
            </button>
          )}
        </div>
      )}

      {submitted && selectedChoice && (
        <div className="space-y-3">
          <div className="bg-secondary border border-border rounded-xl p-4">
            <p className="text-sm text-foreground">{selectedChoice.outcome}</p>
          </div>
          {config.debrief && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Reflection</p>
              <p className="text-sm text-foreground">{config.debrief}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
