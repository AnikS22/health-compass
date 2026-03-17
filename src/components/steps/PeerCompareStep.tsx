import { useState } from "react";
import { BarChart3, Users } from "lucide-react";
import type { PeerCompareConfig, PeerDistribution } from "./types";
import BlockBody from "./BlockBody";

interface Props {
  config: PeerCompareConfig;
  distribution?: PeerDistribution[];
  onComplete: (response: { selected_option_id?: string; text?: string }) => void;
  isLive?: boolean;
}

export default function PeerCompareStep({ config, distribution, onComplete, isLive }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const hasOptions = config.options && config.options.length > 0;
  const canSubmit = hasOptions ? !!selected : freeText.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  const maxCount = distribution
    ? Math.max(...distribution.map((d) => d.count), 1)
    : 1;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <p className="text-lg font-medium text-foreground pt-1.5">{config.prompt}</p>
      </div>

      {!submitted && hasOptions && (
        <div className="space-y-2.5">
          {config.options!.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                selected === opt.id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {!submitted && !hasOptions && (
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Share your perspective..."
          rows={3}
          className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
        />
      )}

      {/* Distribution chart */}
      {submitted && distribution && distribution.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            Class Distribution
          </div>
          <div className="space-y-3">
            {distribution.map((d) => {
              const optLabel = config.options?.find((o) => o.id === d.option_id)?.text ?? d.option_id;
              const isSelected = d.option_id === selected;
              return (
                <div key={d.option_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {optLabel} {isSelected && "← You"}
                    </span>
                    <span className="text-muted-foreground">{d.percentage}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isSelected ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${(d.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {submitted && !distribution && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 text-center space-y-2">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {isLive
              ? "Waiting for teacher to reveal results..."
              : "Distribution will be available after more responses."}
          </p>
        </div>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Submit & Compare
        </button>
      ) : (
        <button
          onClick={() =>
            onComplete(hasOptions ? { selected_option_id: selected! } : { text: freeText })
          }
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  );
}
