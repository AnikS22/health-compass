import { useState } from "react";
import BlockBody from "./BlockBody";

export interface RedTeamConfig {
  system_prompt: string;
  success_criteria?: string;
  max_attempts?: number;
  image_url?: string;
  images?: string[];
}

interface Props {
  config: RedTeamConfig;
  body: string | null;
  onComplete: (response: { attempts: string[]; completed: boolean }) => void;
}

export default function RedTeamStep({ config, body, onComplete }: Props) {
  const [attempts, setAttempts] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const maxAttempts = config.max_attempts || 5;

  function addAttempt() {
    if (!current.trim()) return;
    const updated = [...attempts, current.trim()];
    setAttempts(updated);
    setCurrent("");
    if (updated.length >= maxAttempts) {
      setSubmitted(true);
      onComplete({ attempts: updated, completed: true });
    }
  }

  function handleFinish() {
    setSubmitted(true);
    onComplete({ attempts, completed: true });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}

      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI System to Red-Team</p>
        <p className="text-sm text-foreground">{config.system_prompt}</p>
      </div>

      {config.success_criteria && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Success Criteria</p>
          <p className="text-sm text-foreground">{config.success_criteria}</p>
        </div>
      )}

      {/* Previous attempts */}
      {attempts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Your attempts ({attempts.length}/{maxAttempts})</p>
          {attempts.map((a, i) => (
            <div key={i} className="bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground">
              <span className="text-xs text-muted-foreground font-bold mr-2">#{i + 1}</span>
              {a}
            </div>
          ))}
        </div>
      )}

      {!submitted && (
        <div className="space-y-3">
          <textarea
            value={current}
            onChange={e => setCurrent(e.target.value)}
            rows={3}
            placeholder="Try to find a flaw, bias, or vulnerability…"
            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={addAttempt}
              disabled={!current.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Submit Attempt ({attempts.length + 1}/{maxAttempts})
            </button>
            {attempts.length > 0 && (
              <button
                onClick={handleFinish}
                className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80"
              >
                Finish Early
              </button>
            )}
          </div>
        </div>
      )}

      {submitted && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">
            ✓ Red-team exercise complete with {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
