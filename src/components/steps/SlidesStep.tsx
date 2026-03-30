import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SlidesConfig {
  slide_urls: string[];
  auto_advance?: boolean;
  speaker_notes?: string[];
}

interface Props {
  config: SlidesConfig;
  body: string | null;
  onComplete: () => void;
  isLive?: boolean;
  controlledSlideIndex?: number;
}

export default function SlidesStep({ config, body, onComplete, isLive, controlledSlideIndex }: Props) {
  const slides = config.slide_urls || [];
  const [selfIndex, setSelfIndex] = useState(0);
  const currentSlide = controlledSlideIndex ?? selfIndex;
  const total = slides.length;

  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No slides uploaded for this block.</p>
        <button onClick={onComplete} className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
          Continue
        </button>
      </div>
    );
  }

  const canGoBack = currentSlide > 0;
  const canGoForward = currentSlide < total - 1;
  const isLastSlide = currentSlide === total - 1;

  function goBack() {
    if (canGoBack) setSelfIndex(i => i - 1);
  }
  function goForward() {
    if (canGoForward) setSelfIndex(i => i + 1);
  }

  return (
    <div className="space-y-4">
      {body && <p className="text-sm text-muted-foreground">{body}</p>}

      {/* Slide display */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-[16/9] flex items-center justify-center">
        <img
          src={slides[currentSlide]}
          alt={`Slide ${currentSlide + 1} of ${total}`}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />

        {/* Navigation overlay (only in non-live or teacher mode) */}
        {!isLive && (
          <>
            {canGoBack && (
              <button
                onClick={goBack}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canGoForward && (
              <button
                onClick={goForward}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Slide counter */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          Slide {currentSlide + 1} of {total}
        </p>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => !isLive && setSelfIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
              } ${!isLive ? "cursor-pointer hover:bg-primary/60" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Continue button for independent mode */}
      {!isLive && isLastSlide && (
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
