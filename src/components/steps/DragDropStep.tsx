import { useState } from "react";
import BlockBody from "./BlockBody";

export interface DragDropConfig {
  instructions?: string;
  categories: string[];
  items: { id: string; text: string; correct_category: string }[];
  image_url?: string;
  images?: string[];
}

interface Props {
  config: DragDropConfig;
  body: string | null;
  hints?: { level: number; text: string }[];
  onComplete: (response: { placements: Record<string, string>; correct: boolean; score: number }) => void;
}

export default function DragDropStep({ config, body, hints, onComplete }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  const categories = config.categories || [];
  const items = config.items || [];
  const unplaced = items.filter(item => !placements[item.id]);
  const availableHints = (hints || []).filter(h => h.level <= hintLevel);

  function assignToCategory(itemId: string, category: string) {
    if (submitted) return;
    setPlacements(prev => ({ ...prev, [itemId]: category }));
  }

  function removeFromCategory(itemId: string) {
    if (submitted) return;
    setPlacements(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  function handleSubmit() {
    if (Object.keys(placements).length !== items.length) return;
    let correctCount = 0;
    items.forEach(item => {
      if (placements[item.id] === item.correct_category) correctCount++;
    });
    const s = Math.round((correctCount / items.length) * 100);
    setScore(s);
    setSubmitted(true);
    onComplete({ placements, correct: correctCount === items.length, score: s });
  }

  return (
    <div className="space-y-5">
      <BlockBody body={body} config={config as unknown as Record<string, unknown>} />
      {config.instructions && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">{config.instructions}</p>
        </div>
      )}

      {/* Unplaced items */}
      {unplaced.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items to sort</p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <span>{item.text}</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => assignToCategory(item.id, cat)}
                      className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      → {cat}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 3)}, 1fr)` }}>
        {categories.map(cat => {
          const catItems = items.filter(item => placements[item.id] === cat);
          return (
            <div key={cat} className="bg-secondary/50 border border-border rounded-xl p-3 min-h-[100px]">
              <p className="text-xs font-bold text-foreground mb-2">{cat}</p>
              <div className="space-y-1.5">
                {catItems.map(item => {
                  const isCorrect = submitted && item.correct_category === cat;
                  const isWrong = submitted && item.correct_category !== cat;
                  return (
                    <div
                      key={item.id}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                        isCorrect ? "bg-green-500/10 border-green-500/30 text-foreground" :
                        isWrong ? "bg-destructive/10 border-destructive/30 text-foreground" :
                        "bg-card border-border text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.text}</span>
                        {!submitted && (
                          <button onClick={() => removeFromCategory(item.id)} className="text-muted-foreground hover:text-destructive ml-2">✕</button>
                        )}
                        {isWrong && <span className="text-[10px] text-destructive ml-1">→ {item.correct_category}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
            disabled={Object.keys(placements).length !== items.length}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Check Answers ({Object.keys(placements).length}/{items.length})
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
            Score: {score}% — {score === 100 ? "Perfect! 🎉" : "Review the corrections above."}
          </p>
        </div>
      )}
    </div>
  );
}
