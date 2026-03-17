import { useState } from "react";
import BlockBody from "./BlockBody";

export interface DrawingConfig {
  prompt?: string;
  background_url?: string;
  allow_text?: boolean;
  image_url?: string;
  images?: string[];
}

interface Props {
  config: DrawingConfig;
  body: string | null;
  onComplete: (response: { text?: string; completed: boolean }) => void;
}

export default function DrawingStep({ config, body, onComplete }: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setSubmitted(true);
    onComplete({ text: text.trim() || undefined, completed: true });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      {config.prompt && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">{config.prompt}</p>
        </div>
      )}

      <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground text-sm">
          ✏️ Drawing canvas is available in the full app experience.
        </p>
        {config.background_url && (
          <img src={config.background_url} alt="Background" className="mt-4 rounded-lg max-h-48 mx-auto" />
        )}
      </div>

      {config.allow_text && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={submitted}
          rows={3}
          placeholder="Add text annotations…"
          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none disabled:opacity-70"
        />
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Complete
        </button>
      ) : (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">✓ Drawing step completed</p>
        </div>
      )}
    </div>
  );
}
