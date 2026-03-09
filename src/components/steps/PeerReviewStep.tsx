import { useState } from "react";
import { Star, Users, MessageCircle } from "lucide-react";

export interface PeerReviewConfig {
  prompt: string;
  review_criteria?: string[];
  max_rating?: number;
  anonymous?: boolean;
}

interface Props {
  config: PeerReviewConfig;
  body: string | null;
  onComplete: (response: { text: string; rating?: number }) => void;
  isLive?: boolean;
}

export default function PeerReviewStep({ config, body, onComplete, isLive }: Props) {
  const [ownResponse, setOwnResponse] = useState("");
  const [phase, setPhase] = useState<"write" | "review" | "done">("write");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const maxRating = config.max_rating || 5;
  const criteria = config.review_criteria || [];

  function submitOwnResponse() {
    if (!ownResponse.trim()) return;
    setPhase("review");
  }

  function submitReview() {
    setPhase("done");
    onComplete({ text: ownResponse, rating: rating || undefined });
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">Peer Review</h3>
          <p className="text-muted-foreground text-sm mt-0.5">{config.prompt}</p>
        </div>
      </div>

      {body && <p className="text-sm text-muted-foreground">{body}</p>}

      {/* Phase 1: Write your response */}
      {phase === "write" && (
        <>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Step 1: Write your response</p>
            <textarea value={ownResponse} onChange={e => setOwnResponse(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" />
          </div>
          <button onClick={submitOwnResponse}
            disabled={!ownResponse.trim()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            Submit & Review a Peer
          </button>
        </>
      )}

      {/* Phase 2: Review a peer's work */}
      {phase === "review" && (
        <>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Step 2: Review a classmate's response</p>
            {isLive ? (
              <div className="rounded-lg border border-border bg-card p-4 italic text-sm text-muted-foreground">
                "Waiting for a peer's response to review..."
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-4 italic text-sm text-muted-foreground">
                Peer responses will appear here during a live session.
              </div>
            )}
          </div>

          {criteria.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Criteria</p>
              <ul className="space-y-1">
                {criteria.map((c, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                    <MessageCircle className="w-3 h-3 text-primary shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rating</p>
            <div className="flex gap-1">
              {Array.from({ length: maxRating }, (_, i) => (
                <button key={i} onClick={() => setRating(i + 1)}
                  className={`p-1 transition-colors ${i < rating ? "text-primary" : "text-muted-foreground/30"}`}>
                  <Star className="w-6 h-6" fill={i < rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
            placeholder="Write constructive feedback..."
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" />

          <button onClick={submitReview}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Submit Review
          </button>
        </>
      )}

      {/* Phase 3: Done */}
      {phase === "done" && (
        <>
          <div className="rounded-xl border border-border bg-primary/5 p-5 text-center space-y-2">
            <Star className="w-8 h-8 text-primary mx-auto" fill="currentColor" />
            <p className="text-sm font-semibold text-foreground">Review submitted!</p>
            <p className="text-xs text-muted-foreground">Great job giving feedback to your classmates.</p>
          </div>
          <button onClick={() => onComplete({ text: ownResponse, rating: rating || undefined })}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        </>
      )}
    </div>
  );
}
