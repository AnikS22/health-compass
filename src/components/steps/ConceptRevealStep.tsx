import { useState } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";
import type { ConceptRevealConfig } from "./types";

interface Props {
  config: ConceptRevealConfig;
  body: string | null;
  onComplete: () => void;
}

export default function ConceptRevealStep({ config, body, onComplete }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {body && (
        <p className="text-lg text-muted-foreground leading-relaxed">{body}</p>
      )}

      {config.visual_url && (
        <div className="rounded-xl overflow-hidden border border-border">
          <img
            src={config.visual_url}
            alt="Concept illustration"
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      <div
        className={`rounded-xl border-2 border-primary/20 bg-primary/5 p-6 transition-all duration-500 ${
          revealed ? "opacity-100" : "opacity-0 translate-y-4"
        }`}
        style={{ visibility: revealed ? "visible" : "hidden" }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">{config.key_idea}</h3>
            {config.detail && (
              <p className="text-muted-foreground mt-2 leading-relaxed">{config.detail}</p>
            )}
          </div>
        </div>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <ChevronDown className="w-4 h-4" />
          Reveal Key Idea
        </button>
      ) : (
        <button
          onClick={onComplete}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Got it — Continue
        </button>
      )}
    </div>
  );
}
