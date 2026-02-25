import { useState } from "react";
import { MessageSquare, ThumbsUp, Send } from "lucide-react";

export interface DebateConfig {
  topic: string;
  sides?: string[];
  time_limit_seconds?: number;
}

interface Props {
  config: DebateConfig;
  body: string | null;
  onComplete: (response: { side: string; argument: string }) => void;
  isLive?: boolean;
}

export default function DebateStep({ config, body, onComplete, isLive }: Props) {
  const sides = config.sides?.length ? config.sides : ["For", "Against"];
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [argument, setArgument] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!selectedSide || !argument.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">Debate</h3>
          <p className="text-muted-foreground text-sm mt-0.5">{config.topic}</p>
        </div>
      </div>

      {body && <p className="text-sm text-muted-foreground">{body}</p>}

      {!submitted && (
        <>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Choose your side</p>
            <div className="flex gap-2">
              {sides.map(side => (
                <button key={side} onClick={() => setSelectedSide(side)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedSide === side
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}>
                  {side}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your argument</p>
            <textarea value={argument} onChange={e => setArgument(e.target.value)}
              placeholder="Make your case..."
              rows={4}
              className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" />
          </div>

          <button onClick={handleSubmit}
            disabled={!selectedSide || !argument.trim()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Argument
          </button>
        </>
      )}

      {submitted && (
        <>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Your position: {selectedSide}</span>
            </div>
            <p className="text-sm text-muted-foreground italic">"{argument}"</p>
          </div>

          {isLive && (
            <div className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Waiting for class discussion...</p>
            </div>
          )}

          <button onClick={() => onComplete({ side: selectedSide!, argument })}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        </>
      )}
    </div>
  );
}
