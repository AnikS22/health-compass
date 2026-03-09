import { useState } from "react";

export interface ExitTicketConfig {
  question: string;
  response_type?: "text" | "rating" | "emoji";
  include_confidence?: boolean;
}

interface Props {
  config: ExitTicketConfig;
  body: string | null;
  onComplete: (response: { text?: string; rating?: number; emoji?: string; confidence?: number }) => void;
}

const EMOJIS = ["😕", "🤔", "🙂", "😊", "🤩"];

export default function ExitTicketStep({ config, body, onComplete }: Props) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [emoji, setEmoji] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const responseType = config.response_type || "text";

  const canSubmit =
    (responseType === "text" && text.trim().length > 0) ||
    (responseType === "rating" && rating > 0) ||
    (responseType === "emoji" && emoji !== "");

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    onComplete({
      text: responseType === "text" ? text.trim() : undefined,
      rating: responseType === "rating" ? rating : undefined,
      emoji: responseType === "emoji" ? emoji : undefined,
      confidence: config.include_confidence ? confidence : undefined,
    });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground">{config.question}</p>
      </div>

      {responseType === "text" && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={submitted}
          rows={3}
          placeholder="Your response…"
          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none disabled:opacity-70"
        />
      )}

      {responseType === "rating" && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => !submitted && setRating(n)}
              disabled={submitted}
              className={`w-12 h-12 rounded-xl text-lg font-bold border-2 transition-all ${
                rating >= n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {responseType === "emoji" && (
        <div className="flex items-center gap-3">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => !submitted && setEmoji(e)}
              disabled={submitted}
              className={`text-3xl p-2 rounded-xl border-2 transition-all ${
                emoji === e ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/50"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {config.include_confidence && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Confidence Level: {confidence}/5
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={confidence}
            onChange={e => setConfidence(Number(e.target.value))}
            disabled={submitted}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Submit Exit Ticket
        </button>
      ) : (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">✓ Exit ticket submitted. Great work!</p>
        </div>
      )}
    </div>
  );
}
