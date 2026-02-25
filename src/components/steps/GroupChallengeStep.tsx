import { useState } from "react";
import { Users, Trophy, Send, Clock } from "lucide-react";

export interface GroupChallengeConfig {
  prompt: string;
  group_size?: number;
  time_limit_seconds?: number;
  submission_type?: "text" | "choice" | "collaborative_doc";
  choices?: { id: string; text: string }[];
  rubric_criteria?: string[];
}

interface Props {
  config: GroupChallengeConfig;
  body: string | null;
  onComplete: (response: { text?: string; selected_choice_id?: string }) => void;
  isLive?: boolean;
}

export default function GroupChallengeStep({ config, body, onComplete, isLive }: Props) {
  const [response, setResponse] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submissionType = config.submission_type || "text";

  function handleSubmit() {
    if (submissionType === "text" && !response.trim()) return;
    if (submissionType === "choice" && !selectedChoice) return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">Group Challenge</h3>
          <p className="text-muted-foreground text-sm mt-0.5">{config.prompt}</p>
        </div>
      </div>

      {body && <p className="text-sm text-muted-foreground">{body}</p>}

      {/* Group info */}
      <div className="flex gap-3">
        {config.group_size && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground">
            <Users className="w-3 h-3" /> Groups of {config.group_size}
          </div>
        )}
        {config.time_limit_seconds && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground">
            <Clock className="w-3 h-3" /> {Math.round(config.time_limit_seconds / 60)} min
          </div>
        )}
      </div>

      {/* Rubric criteria */}
      {config.rubric_criteria && config.rubric_criteria.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Success Criteria</p>
          <ul className="space-y-1.5">
            {config.rubric_criteria.map((c, i) => (
              <li key={i} className="text-sm text-foreground flex items-center gap-2">
                <Trophy className="w-3 h-3 text-primary shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLive && !submitted && (
        <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">💬 Discuss with your group, then submit your team's answer below.</p>
        </div>
      )}

      {!submitted && (
        <>
          {submissionType === "text" && (
            <textarea value={response} onChange={e => setResponse(e.target.value)}
              placeholder="Write your group's answer..."
              rows={4}
              className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" />
          )}

          {submissionType === "choice" && config.choices && (
            <div className="space-y-2">
              {config.choices.map(c => (
                <button key={c.id} onClick={() => setSelectedChoice(c.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                    selectedChoice === c.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}>
                  {c.text}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={submissionType === "text" ? !response.trim() : !selectedChoice}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Group Answer
          </button>
        </>
      )}

      {submitted && (
        <>
          <div className="rounded-xl border border-border bg-primary/5 p-5 text-center space-y-2">
            <Trophy className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-semibold text-foreground">Answer submitted!</p>
            <p className="text-xs text-muted-foreground">
              {isLive ? "Waiting for teacher to continue..." : "Great teamwork!"}
            </p>
          </div>
          <button onClick={() => onComplete(
            submissionType === "text" ? { text: response } : { selected_choice_id: selectedChoice! }
          )}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        </>
      )}
    </div>
  );
}
