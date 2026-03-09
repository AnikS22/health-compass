import { useState } from "react";

export interface MatchingConfig {
  instructions?: string;
  pairs: { left: string; right: string }[];
}

interface Props {
  config: MatchingConfig;
  body: string | null;
  hints?: { level: number; text: string }[];
  onComplete: (response: { matches: Record<string, string>; correct: boolean; score: number }) => void;
}

export default function MatchingStep({ config, body, hints, onComplete }: Props) {
  const pairs = config.pairs || [];
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  // Shuffle right side once
  const [shuffledRight] = useState(() => {
    const indices = pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const usedRight = new Set(Object.values(matches));
  const availableHints = (hints || []).filter(h => h.level <= hintLevel);

  function handleLeftClick(leftIdx: number) {
    if (submitted) return;
    if (selectedLeft === leftIdx) {
      setSelectedLeft(null);
    } else if (matches[leftIdx] !== undefined) {
      // Unmatch
      setMatches(prev => {
        const next = { ...prev };
        delete next[leftIdx];
        return next;
      });
      setSelectedLeft(leftIdx);
    } else {
      setSelectedLeft(leftIdx);
    }
  }

  function handleRightClick(rightIdx: number) {
    if (submitted || selectedLeft === null) return;
    if (usedRight.has(rightIdx) && matches[selectedLeft] !== rightIdx) return;
    setMatches(prev => ({ ...prev, [selectedLeft!]: rightIdx }));
    setSelectedLeft(null);
  }

  function handleSubmit() {
    if (Object.keys(matches).length !== pairs.length) return;
    let correctCount = 0;
    pairs.forEach((_, leftIdx) => {
      if (matches[leftIdx] === leftIdx) correctCount++;
    });
    const s = Math.round((correctCount / pairs.length) * 100);
    setScore(s);
    setSubmitted(true);
    const matchMap: Record<string, string> = {};
    Object.entries(matches).forEach(([l, r]) => {
      matchMap[pairs[Number(l)].left] = pairs[Number(r)].right;
    });
    onComplete({ matches: matchMap, correct: correctCount === pairs.length, score: s });
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      {config.instructions && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">{config.instructions}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Click an item on the left, then click its match on the right.</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, leftIdx) => {
            const isMatched = matches[leftIdx] !== undefined;
            const isSelected = selectedLeft === leftIdx;
            const isCorrect = submitted && matches[leftIdx] === leftIdx;
            const isWrong = submitted && matches[leftIdx] !== undefined && matches[leftIdx] !== leftIdx;
            return (
              <button
                key={leftIdx}
                onClick={() => handleLeftClick(leftIdx)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-xs transition-all ${
                  isCorrect ? "border-green-500 bg-green-500/10" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  isSelected ? "border-primary bg-primary/10" :
                  isMatched ? "border-primary/50 bg-primary/5" :
                  "border-border bg-card hover:border-primary/50"
                } text-foreground`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column (shuffled) */}
        <div className="space-y-2">
          {shuffledRight.map(rightIdx => {
            const isUsed = usedRight.has(rightIdx);
            const matchedLeftIdx = Object.entries(matches).find(([, r]) => r === rightIdx)?.[0];
            const isCorrect = submitted && matchedLeftIdx !== undefined && Number(matchedLeftIdx) === rightIdx;
            const isWrong = submitted && matchedLeftIdx !== undefined && Number(matchedLeftIdx) !== rightIdx;
            return (
              <button
                key={rightIdx}
                onClick={() => handleRightClick(rightIdx)}
                disabled={submitted || (isUsed && selectedLeft === null)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-xs transition-all ${
                  isCorrect ? "border-green-500 bg-green-500/10" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  isUsed ? "border-primary/50 bg-primary/5" :
                  selectedLeft !== null ? "border-border bg-card hover:border-primary cursor-pointer" :
                  "border-border bg-card"
                } text-foreground`}
              >
                {pairs[rightIdx].right}
              </button>
            );
          })}
        </div>
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

      {!submitted ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(matches).length !== pairs.length}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Check Matches ({Object.keys(matches).length}/{pairs.length})
          </button>
          {hints && hints.length > 0 && hintLevel < hints.length && (
            <button onClick={() => setHintLevel(l => l + 1)}
              className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80">
              💡 Hint
            </button>
          )}
        </div>
      ) : (
        <div className={`rounded-xl p-4 border ${score === 100 ? "bg-green-500/5 border-green-500/20" : "bg-secondary border-border"}`}>
          <p className="text-sm font-medium text-foreground">
            Score: {score}% — {score === 100 ? "Perfect matches! 🎉" : "Review and try again next time."}
          </p>
        </div>
      )}
    </div>
  );
}
