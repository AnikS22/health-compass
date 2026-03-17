import { useState } from "react";
import BlockBody from "./BlockBody";

export interface MatchingConfig {
  instructions?: string;
  pairs: { left: string; right: string }[];
  image_url?: string;
  images?: string[];
}

interface Props {
  config: MatchingConfig;
  body: string | null;
  hints?: { level: number; text: string }[];
  onComplete: (response: { matches: Record<string, string>; correct: boolean; score: number }) => void;
}

const PAIR_COLORS = [
  { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-600", dot: "bg-blue-500" },
  { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
  { border: "border-violet-500", bg: "bg-violet-500/10", text: "text-violet-600", dot: "bg-violet-500" },
  { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-600", dot: "bg-amber-500" },
  { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-600", dot: "bg-rose-500" },
  { border: "border-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-600", dot: "bg-cyan-500" },
  { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
  { border: "border-pink-500", bg: "bg-pink-500/10", text: "text-pink-600", dot: "bg-pink-500" },
  { border: "border-teal-500", bg: "bg-teal-500/10", text: "text-teal-600", dot: "bg-teal-500" },
  { border: "border-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-600", dot: "bg-indigo-500" },
];

export default function MatchingStep({ config, body, hints, onComplete }: Props) {
  const pairs = config?.pairs || [];
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

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

  // Map left index → color index for matched pairs
  function getColorForLeft(leftIdx: number): typeof PAIR_COLORS[0] | null {
    if (matches[leftIdx] === undefined) return null;
    const matchOrder = Object.keys(matches).map(Number).sort((a, b) => a - b);
    const colorIdx = matchOrder.indexOf(leftIdx) % PAIR_COLORS.length;
    return PAIR_COLORS[colorIdx];
  }

  function getColorForRight(rightIdx: number): typeof PAIR_COLORS[0] | null {
    const leftEntry = Object.entries(matches).find(([, r]) => r === rightIdx);
    if (!leftEntry) return null;
    return getColorForLeft(Number(leftEntry[0]));
  }

  function handleLeftClick(leftIdx: number) {
    if (submitted) return;
    if (selectedLeft === leftIdx) {
      setSelectedLeft(null);
    } else if (matches[leftIdx] !== undefined) {
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

  if (pairs.length === 0) {
    return (
      <div className="space-y-5">
        <BlockBody body={body} config={config as unknown as Record<string, unknown>} />
        <div className="bg-secondary/50 border border-border rounded-xl p-6 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No matching pairs configured.</p>
          <button onClick={() => onComplete({ matches: {}, correct: true, score: 100 })}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
            Continue →
          </button>
        </div>
      </div>
    );
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
            const color = getColorForLeft(leftIdx);
            return (
              <button
                key={leftIdx}
                onClick={() => handleLeftClick(leftIdx)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-xs transition-all ${
                  isCorrect ? "border-green-500 bg-green-500/10" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/30" :
                  isMatched && color ? `${color.border} ${color.bg}` :
                  "border-border bg-card hover:border-primary/50"
                } text-foreground`}
              >
                <span className="flex items-center gap-2">
                  {isMatched && color && !submitted && (
                    <span className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                  )}
                  {pair.left}
                </span>
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
            const color = getColorForRight(rightIdx);
            return (
              <button
                key={rightIdx}
                onClick={() => handleRightClick(rightIdx)}
                disabled={submitted || (isUsed && selectedLeft === null)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-xs transition-all ${
                  isCorrect ? "border-green-500 bg-green-500/10" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  isUsed && color ? `${color.border} ${color.bg}` :
                  selectedLeft !== null ? "border-border bg-card hover:border-primary cursor-pointer" :
                  "border-border bg-card"
                } text-foreground`}
              >
                <span className="flex items-center gap-2">
                  {isUsed && color && !submitted && (
                    <span className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                  )}
                  {pairs[rightIdx].right}
                </span>
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
